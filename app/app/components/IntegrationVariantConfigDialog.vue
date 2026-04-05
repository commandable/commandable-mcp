<script setup lang="ts">
import type { CatalogVariantEntry, VariantConfigEntry, VariantOption } from '../types/integration'

const props = defineProps<{
  open: boolean
  integrationId: string
  currentType: string
  baseType: string
  baseName: string
  variants: CatalogVariantEntry[]
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': [payload: { type: string, config: Record<string, unknown> | null, labelSuffix: string | null }]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

const selectedType = ref(props.currentType)
const pickerOptions = reactive<Record<string, VariantOption[]>>({})
const singleSelections = reactive<Record<string, string>>({})
const multiSelections = reactive<Record<string, string[]>>({})
const loadingKeys = reactive<Record<string, boolean>>({})
const loadError = ref<string | null>(null)

const variantTypeItems = computed(() => [
  { label: `Full ${props.baseName}`, value: props.baseType },
  ...props.variants.map(variant => ({
    label: variant.label || variant.type,
    value: variant.type,
  })),
])

const activeVariant = computed(() =>
  props.variants.find(variant => variant.type === selectedType.value) ?? null,
)

const activeVariantConfig = computed(() => activeVariant.value?.variantConfig ?? [])

const selectionSignature = computed(() =>
  activeVariantConfig.value.map((item) => {
    if (item.selectionMode === 'multi')
      return `${item.key}:${(multiSelections[item.key] || []).join(',')}`
    return `${item.key}:${singleSelections[item.key] || ''}`
  }).join('|'),
)

function clearSelections() {
  for (const key of Object.keys(singleSelections))
    delete singleSelections[key]
  for (const key of Object.keys(multiSelections))
    delete multiSelections[key]
}

function resetPickerState() {
  loadError.value = null
  clearSelections()
  for (const key of Object.keys(pickerOptions))
    delete pickerOptions[key]
  for (const key of Object.keys(loadingKeys))
    delete loadingKeys[key]
}

function selectedOptionsFor(item: VariantConfigEntry) {
  const options = pickerOptions[item.key] || []
  if (item.selectionMode === 'multi')
    return options.filter(option => (multiSelections[item.key] || []).includes(option.id))
  return options.filter(option => option.id === singleSelections[item.key])
}

function buildConfig(optionsOnly = false) {
  const config: Record<string, unknown> = {}
  for (const item of activeVariantConfig.value) {
    const selected = selectedOptionsFor(item)
    if (item.selectionMode === 'multi') {
      if (!selected.length)
        continue
      config[`${item.key}Ids`] = selected.map(option => option.id)
      if (!optionsOnly)
        config[`${item.key}Names`] = selected.map(option => option.name)
    }
    else {
      const option = selected[0]
      if (!option)
        continue
      config[`${item.key}Id`] = option.id
      if (!optionsOnly)
        config[`${item.key}Name`] = option.name
    }
  }
  return config
}

async function loadOptions() {
  if (!isOpen.value) {
    return
  }

  if (!activeVariant.value) {
    loadError.value = null
    return
  }

  loadError.value = null
  const partialConfig: Record<string, unknown> = {}

  for (const item of activeVariantConfig.value) {
    loadingKeys[item.key] = true
    try {
      const response = await $fetch<{ options: VariantOption[] }>(`/api/integrations/${props.integrationId}/variant-options`, {
        method: 'POST',
        body: {
          forIntegrationType: activeVariant.value.type,
          key: item.key,
          config: partialConfig,
        },
      })
      pickerOptions[item.key] = response.options
    }
    catch (error) {
      console.error(`Failed to load options for ${item.key}`, error)
      pickerOptions[item.key] = []
      loadError.value = error instanceof Error ? error.message : `Failed to load ${item.label.toLowerCase()} options`
    }
    finally {
      loadingKeys[item.key] = false
    }

    if (item.selectionMode === 'multi') {
      const validIds = new Set((pickerOptions[item.key] || []).map(option => option.id))
      multiSelections[item.key] = (multiSelections[item.key] || []).filter(id => validIds.has(id))
    }
    else if (singleSelections[item.key] && !(pickerOptions[item.key] || []).some(option => option.id === singleSelections[item.key])) {
      singleSelections[item.key] = ''
    }

    Object.assign(partialConfig, buildConfig())
  }
}

function toggleMultiSelection(item: VariantConfigEntry, optionId: string) {
  const current = new Set(multiSelections[item.key] || [])
  if (current.has(optionId))
    current.delete(optionId)
  else
    current.add(optionId)
  multiSelections[item.key] = [...current]
}

const canConfirm = computed(() => {
  if (selectedType.value === props.baseType)
    return true
  if (!activeVariant.value)
    return false
  return activeVariantConfig.value.every((item) => {
    if (item.selectionMode === 'multi')
      return Boolean((multiSelections[item.key] || []).length)
    return Boolean(singleSelections[item.key])
  })
})

const labelSuffix = computed(() =>
  activeVariantConfig.value.flatMap(item => selectedOptionsFor(item).map(option => option.name)).join(' / ') || null,
)

watch(() => props.open, (open) => {
  if (!open)
    return
  selectedType.value = props.currentType
  resetPickerState()
  void loadOptions()
}, { immediate: true })

watch(selectedType, () => {
  if (!isOpen.value)
    return
  resetPickerState()
  void loadOptions()
})

watch(selectionSignature, () => {
  if (!isOpen.value || selectedType.value === props.baseType)
    return
  void loadOptions()
})

function submit() {
  emit('confirm', {
    type: selectedType.value,
    config: selectedType.value === props.baseType ? null : buildConfig(),
    labelSuffix: selectedType.value === props.baseType ? null : labelSuffix.value,
  })
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Reduce integration scope"
    description="Choose a reduced scope for this integration or keep full access."
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="Scope mode">
          <USelect
            v-model="selectedType"
            :items="variantTypeItems"
            class="w-full"
          />
        </UFormField>

        <template v-if="selectedType !== baseType && activeVariantConfig.length">
          <UFormField
            v-for="item in activeVariantConfig"
            :key="item.key"
            :label="item.label"
            :description="item.selectionMode === 'multi' ? `Choose one or more ${item.label.toLowerCase()} values.` : `Choose a ${item.label.toLowerCase()} value.`"
          >
            <template v-if="item.selectionMode === 'single'">
              <USelect
                v-model="singleSelections[item.key]"
                :items="(pickerOptions[item.key] || []).map(option => ({ label: option.name, value: option.id }))"
                :loading="loadingKeys[item.key]"
                :disabled="loadingKeys[item.key]"
                :placeholder="`Select ${item.label.toLowerCase()}...`"
                class="w-full"
              />
            </template>
            <template v-else>
              <div class="space-y-2">
                <label
                  v-for="option in pickerOptions[item.key] || []"
                  :key="option.id"
                  class="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    :checked="(multiSelections[item.key] || []).includes(option.id)"
                    :disabled="loadingKeys[item.key]"
                    @change="toggleMultiSelection(item, option.id)"
                  >
                  <span>{{ option.name }}</span>
                </label>
              </div>
            </template>
          </UFormField>
        </template>

        <p
          v-if="loadError"
          class="text-sm text-red-600 dark:text-red-400"
        >
          {{ loadError }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2 w-full">
        <UButton
          variant="ghost"
          color="neutral"
          :disabled="saving"
          @click="isOpen = false"
        >
          Cancel
        </UButton>
        <UButton
          :disabled="!canConfirm || saving"
          :loading="saving"
          @click="submit"
        >
          Save Scope
        </UButton>
      </div>
    </template>
  </UModal>
</template>
