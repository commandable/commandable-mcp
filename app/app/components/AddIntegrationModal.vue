<template>
  <UModal
    v-model:open="isOpen"
    title="Add integration"
    description="Choose a service to connect."
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="Integration type">
          <USelect
            v-model="selectedType"
            :items="catalogTypes"
            placeholder="Select a service..."
            class="w-full"
          />
        </UFormField>

        <div v-if="selectedType" class="space-y-2">
          <div class="text-sm font-medium">
            Access level
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-3 py-1.5 text-sm rounded-md border transition-colors"
              :class="selectedTypeMaxScope !== 'read'
                ? 'border-green-500 bg-green-50 text-green-700 font-medium dark:bg-green-950 dark:text-green-300'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'"
              @click="selectedTypeMaxScope = null"
            >
              Read + Write
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-sm rounded-md border transition-colors"
              :class="selectedTypeMaxScope === 'read'
                ? 'border-green-500 bg-green-50 text-green-700 font-medium dark:bg-green-950 dark:text-green-300'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'"
              @click="selectedTypeMaxScope = 'read'"
            >
              Read-only
            </button>
          </div>
          <p v-if="selectedTypeMaxScope === 'read'" class="text-xs text-amber-600 dark:text-amber-400">
            Write/admin tools are greyed out automatically.
          </p>
        </div>

        <details v-if="selectedType" class="border border-[var(--ui-border)] rounded-md">
          <summary class="cursor-pointer select-none px-3 py-2 text-sm font-medium">
            Advanced tool controls (optional)
          </summary>
          <div class="px-3 pb-3 pt-1 space-y-3">
            <IntegrationToolsTree
              ref="toolsTreeRef"
              :integration-type="selectedType"
              :max-scope="selectedTypeMaxScope"
              :enabled-toolsets="selectedTypeEnabledToolsets"
              :disabled-tools="selectedTypeDisabledTools"
              @update:enabled-toolsets="selectedTypeEnabledToolsets = $event"
              @update:disabled-tools="selectedTypeDisabledTools = $event"
            />
          </div>
        </details>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="soft" color="neutral" @click="isOpen = false">
          Cancel
        </UButton>
        <UButton :disabled="!selectedType || creating" :loading="creating" @click="create">
          Add
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'created': [id: string]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v),
})

const { data: catalog } = await useFetch<any[]>('/api/catalog')
const catalogTypes = computed(() => (catalog.value || []).map((i: any) => ({ label: i.type, value: i.type })))

const selectedType = ref<string | undefined>(undefined)
const selectedTypeMaxScope = ref<'read' | null>(null)
const selectedTypeEnabledToolsets = ref<string[]>([])
const selectedTypeDisabledTools = ref<string[]>([])
const toolsTreeRef = ref<any>(null)
const creating = ref(false)

watch(isOpen, (open) => {
  if (!open) return
  selectedType.value = undefined
  selectedTypeMaxScope.value = null
  selectedTypeEnabledToolsets.value = []
  selectedTypeDisabledTools.value = []
})

watch(selectedType, () => {
  selectedTypeMaxScope.value = null
  selectedTypeEnabledToolsets.value = []
  selectedTypeDisabledTools.value = []
})

watch(() => toolsTreeRef.value?.toolsets, (toolsets) => {
  if (!selectedType.value || !toolsets?.length)
    return

  // Default: all toolsets enabled in UI.
  if (!selectedTypeEnabledToolsets.value.length)
    selectedTypeEnabledToolsets.value = toolsets.map((t: any) => t.key).filter((k: string) => k !== 'custom')
}, { deep: true })

async function create() {
  if (!selectedType.value) return
  creating.value = true
  try {
    const toolsetKeys: string[] = (toolsTreeRef.value?.toolsets || []).map((t: any) => t.key)
    const realToolsetKeys = toolsetKeys.filter(k => k !== '__all__' && k !== 'custom')

    // IMPORTANT:
    // - undefined/null means "all toolsets" (no filtering)
    // - [] is NOT safe (it filters out all tools in the loader)
    const enabledToolsets = realToolsetKeys.length
      ? (selectedTypeEnabledToolsets.value.length < realToolsetKeys.length
          ? selectedTypeEnabledToolsets.value.filter(k => k !== '__all__')
          : undefined)
      : undefined

    const result = await $fetch<{ id: string }>('/api/integrations', {
      method: 'POST',
      body: {
        type: selectedType.value,
        maxScope: selectedTypeMaxScope.value || undefined,
        enabledToolsets,
        disabledTools: selectedTypeDisabledTools.value.length ? selectedTypeDisabledTools.value : undefined,
      },
    })

    isOpen.value = false
    emit('created', result.id)
  }
  finally {
    creating.value = false
  }
}
</script>
