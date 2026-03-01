<template>
  <UContainer class="py-10 space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold">
          Integrations
        </h1>
        <p class="text-sm text-muted">
          Add an integration and store its credentials (encrypted) locally.
        </p>
      </div>

      <div class="flex gap-2">
        <UButton to="/" icon="i-lucide-home" variant="soft" color="neutral">
          Dashboard
        </UButton>
        <UButton to="/settings" icon="i-lucide-settings" variant="soft" color="neutral">
          Settings
        </UButton>
      </div>
    </div>

    <UCard>
      <template #header>
        <div class="font-medium">
          Add integration
        </div>
      </template>

      <div class="space-y-4">
        <UFormField label="Type">
          <USelect v-model="selectedType" :items="catalogTypes" placeholder="Select…" class="w-72" />
        </UFormField>

        <div v-if="selectedType && selectedTypeToolsets.length" class="space-y-2">
          <div class="text-sm font-medium">
            Tool groups
          </div>
          <div class="space-y-2">
            <label v-for="toolset in selectedTypeToolsets" :key="toolset.key" class="flex items-start gap-2 text-sm">
              <input
                v-model="selectedTypeEnabledToolsets"
                type="checkbox"
                :value="toolset.key"
                class="mt-1"
              >
              <span>
                <span class="font-medium">{{ toolset.label }}</span>
                <span class="text-muted"> — {{ toolset.description }}</span>
              </span>
            </label>
          </div>
        </div>

        <div v-else-if="selectedType && selectedTypeToolsetsPending" class="text-sm text-muted">
          Loading tool groups…
        </div>
        <div v-else-if="selectedType && selectedTypeToolsetsError" class="text-sm text-red-600">
          Failed to load tool groups.
        </div>

        <UButton :disabled="!selectedType || adding || (selectedTypeToolsets.length > 0 && !selectedTypeEnabledToolsets.length)" @click="add">
          Add
        </UButton>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="font-medium">
          Connected
        </div>
      </template>

      <div v-if="pending" class="text-sm text-muted">
        Loading…
      </div>
      <div v-else-if="error" class="text-sm text-red-600">
        Failed to load integrations.
      </div>
      <div v-else class="space-y-3">
        <div v-if="!integrations?.length" class="text-sm text-muted">
          None yet.
        </div>

        <div v-for="i in integrations" :key="i.id" class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b last:border-b-0 pb-3 last:pb-0">
          <div class="min-w-0">
            <div class="font-medium truncate">{{ i.label }}</div>
            <div class="text-xs text-muted truncate">
              {{ i.type }} · {{ i.referenceId }}
              <span v-if="i.credentialVariant"> · {{ i.credentialVariant }}</span>
            </div>
            <div class="mt-2 flex flex-wrap gap-1">
              <UBadge
                v-if="!i.enabledToolsets || !i.enabledToolsets.length"
                size="xs"
                color="neutral"
                variant="soft"
              >
                All tool groups
              </UBadge>
              <UBadge
                v-for="key in i.enabledToolsets || []"
                :key="`${i.id}-${key}`"
                size="xs"
                color="neutral"
                variant="subtle"
              >
                {{ toolsetLabel(i.type, key) }}
              </UBadge>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UBadge v-if="credentialStatus[i.id] === true" color="success" variant="soft">
              Credentials saved
            </UBadge>
            <UBadge v-else color="warning" variant="soft">
              No credentials
            </UBadge>

            <UButton size="sm" variant="soft" color="neutral" @click="openCredentials(i)">
              Configure credentials
            </UButton>
            <UButton size="sm" variant="soft" color="neutral" @click="openToolsets(i)">
              Edit tool groups
            </UButton>
            <UButton size="sm" variant="ghost" color="error" @click="remove(i)">
              Remove
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <UModal v-model:open="credentialsModalOpen">
      <UCard>
        <template #header>
          <div class="font-medium">
            Credentials: {{ activeIntegration?.label }}
          </div>
        </template>

        <div v-if="credConfigPending" class="text-sm text-muted">
          Loading…
        </div>
        <div v-else-if="credConfigError" class="text-sm text-red-600">
          Failed to load credential schema.
        </div>
        <div v-else-if="credConfig?.supportsCredentials === false" class="text-sm text-muted">
          This integration does not support credentials-based auth yet.
        </div>
        <div v-else class="space-y-4">
          <!-- Variant selector — only shown when there are multiple variants -->
          <UFormField v-if="hasMultipleVariants" label="Credential type">
            <USelect
              v-model="selectedVariant"
              :items="variantItems"
              class="w-full"
            />
          </UFormField>

          <div v-if="activeVariant?.hintMarkdown" class="text-sm text-muted whitespace-pre-wrap">
            {{ activeVariant.hintMarkdown }}
          </div>

          <div class="space-y-3">
            <UFormField
              v-for="[k, prop] in activeSchemaFields"
              :key="k"
              :label="(prop as any).title || k"
              :description="(prop as any).description"
              hint="You can enter env:VARNAME"
            >
              <UInput
                v-model="credentialsForm[k]"
                :type="isSecretField(k) ? 'password' : 'text'"
                placeholder="env:MY_TOKEN or actual value"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="flex justify-end gap-2">
            <UButton variant="soft" color="neutral" @click="credentialsModalOpen = false">
              Cancel
            </UButton>
            <UButton :loading="savingCreds" @click="saveCredentials">
              Save
            </UButton>
          </div>
        </div>
      </UCard>
    </UModal>

    <UModal v-model:open="toolsetsModalOpen">
      <UCard>
        <template #header>
          <div class="font-medium">
            Tool groups: {{ toolsetsIntegration?.label }}
          </div>
        </template>

        <div v-if="toolsetsPending" class="text-sm text-muted">
          Loading…
        </div>
        <div v-else-if="toolsetsError" class="text-sm text-red-600">
          Failed to load tool groups.
        </div>
        <div v-else-if="!toolsetOptions.length" class="text-sm text-muted">
          This integration does not define tool groups.
        </div>
        <div v-else class="space-y-4">
          <div class="space-y-2">
            <label v-for="toolset in toolsetOptions" :key="`modal-${toolset.key}`" class="flex items-start gap-2 text-sm">
              <input
                v-model="toolsetsForm"
                type="checkbox"
                :value="toolset.key"
                class="mt-1"
              >
              <span>
                <span class="font-medium">{{ toolset.label }}</span>
                <span class="text-muted"> — {{ toolset.description }}</span>
              </span>
            </label>
          </div>

          <div class="flex justify-end gap-2">
            <UButton variant="soft" color="neutral" @click="toolsetsModalOpen = false">
              Cancel
            </UButton>
            <UButton :disabled="!toolsetsForm.length" :loading="savingToolsets" @click="saveToolsets">
              Save
            </UButton>
          </div>
        </div>
      </UCard>
    </UModal>
  </UContainer>
</template>

<script setup lang="ts">
type Integration = {
  id: string
  type: string
  referenceId: string
  label: string
  credentialVariant?: string | null
  enabledToolsets?: string[] | null
}

type CredentialVariant = {
  key: string
  label: string
  schema: any
  hintMarkdown: string | null
}

type CredConfig = {
  supportsCredentials: boolean
  variants: CredentialVariant[]
  defaultVariant: string | null | undefined
}

type ToolsetMeta = {
  key: string
  label: string
  description: string
}

type ToolsetMap = Record<string, { label: string, description: string }>

const { data: catalog } = await useFetch<any[]>('/api/catalog')
const { data: integrations, pending, error, refresh } = await useFetch<Integration[]>('/api/integrations')

const catalogTypes = computed(() => (catalog.value || []).map(i => ({ label: i.type, value: i.type })))
const selectedType = ref<string | undefined>(undefined)
const adding = ref(false)
const selectedTypeToolsets = ref<ToolsetMeta[]>([])
const selectedTypeToolsetsPending = ref(false)
const selectedTypeToolsetsError = ref<any | null>(null)
const selectedTypeEnabledToolsets = ref<string[]>([])
const toolsetsByType = reactive<Record<string, ToolsetMeta[]>>({})

const credentialStatus = reactive<Record<string, boolean>>({})

function normalizeToolsets(toolsets: ToolsetMap): ToolsetMeta[] {
  return Object.entries(toolsets)
    .map(([key, value]) => ({
      key,
      label: value.label,
      description: value.description,
    }))
    .sort((a, b) => a.key.localeCompare(b.key))
}

async function fetchToolsetsForType(type: string): Promise<ToolsetMeta[]> {
  if (toolsetsByType[type])
    return toolsetsByType[type]
  const data = await $fetch<ToolsetMap>(`/api/catalog/${type}/toolsets`)
  const options = normalizeToolsets(data || {})
  toolsetsByType[type] = options
  return options
}

function toolsetLabel(type: string, key: string): string {
  const options = toolsetsByType[type] || []
  return options.find(o => o.key === key)?.label || key
}

watchEffect(async () => {
  if (!integrations.value) return
  for (const i of integrations.value) {
    if (credentialStatus[i.id] !== undefined) continue
    const res = await $fetch<{ hasCredentials: boolean }>(`/api/integrations/${i.id}/credentials-status`).catch(() => null)
    credentialStatus[i.id] = !!res?.hasCredentials
  }
})

watchEffect(async () => {
  if (!integrations.value)
    return
  const types = Array.from(new Set(integrations.value.map(i => i.type)))
  await Promise.all(types.map(async (type) => {
    try {
      await fetchToolsetsForType(type)
    }
    catch {}
  }))
})

watch(selectedType, async (type) => {
  selectedTypeToolsets.value = []
  selectedTypeEnabledToolsets.value = []
  selectedTypeToolsetsError.value = null
  if (!type)
    return
  selectedTypeToolsetsPending.value = true
  try {
    const options = await fetchToolsetsForType(type)
    selectedTypeToolsets.value = options
    selectedTypeEnabledToolsets.value = options.map(o => o.key)
  }
  catch (e) {
    selectedTypeToolsetsError.value = e
  }
  finally {
    selectedTypeToolsetsPending.value = false
  }
}, { immediate: true })

async function add() {
  if (!selectedType.value) return
  adding.value = true
  try {
    await $fetch('/api/integrations', {
      method: 'POST',
      body: {
        type: selectedType.value,
        enabledToolsets: selectedTypeToolsets.value.length ? selectedTypeEnabledToolsets.value : undefined,
      },
    })
    selectedType.value = undefined
    await refresh()
  }
  finally {
    adding.value = false
  }
}

async function remove(i: Integration) {
  await $fetch(`/api/integrations/${i.id}`, { method: 'DELETE' })
  delete credentialStatus[i.id]
  await refresh()
}

const credentialsModalOpen = ref(false)
const activeIntegration = ref<Integration | null>(null)
const credentialsForm = reactive<Record<string, string>>({})
const savingCreds = ref(false)
const selectedVariant = ref<string | undefined>(undefined)

const credConfig = ref<CredConfig | null>(null)
const credConfigPending = ref(false)
const credConfigError = ref<any | null>(null)

const hasMultipleVariants = computed(() => (credConfig.value?.variants?.length ?? 0) > 1)

const variantItems = computed(() =>
  (credConfig.value?.variants || []).map(v => ({ label: v.label, value: v.key })),
)

const activeVariant = computed(() =>
  credConfig.value?.variants?.find(v => v.key === selectedVariant.value) ?? null,
)

const activeSchemaFields = computed((): [string, unknown][] => {
  const props = activeVariant.value?.schema?.properties || {}
  return Object.entries(props)
})

function isSecretField(key: string): boolean {
  const lower = key.toLowerCase()
  return lower.includes('token') || lower.includes('key') || lower.includes('secret') || lower.includes('password') || lower.includes('json')
}

async function openCredentials(i: Integration) {
  activeIntegration.value = i
  for (const k of Object.keys(credentialsForm))
    delete credentialsForm[k]
  credentialsModalOpen.value = true
  credConfig.value = null
  credConfigError.value = null
  credConfigPending.value = true
  try {
    credConfig.value = await $fetch<CredConfig>(`/api/integrations/${i.id}/credentials-config`)
    // Pre-select the integration's current variant, or the default
    selectedVariant.value = i.credentialVariant || credConfig.value?.defaultVariant || credConfig.value?.variants?.[0]?.key || undefined
  }
  catch (e) {
    credConfigError.value = e
  }
  finally {
    credConfigPending.value = false
  }
}

// Reset form fields when variant changes
watch(selectedVariant, () => {
  for (const k of Object.keys(credentialsForm))
    delete credentialsForm[k]
})

const toolsetsModalOpen = ref(false)
const toolsetsIntegration = ref<Integration | null>(null)
const toolsetOptions = ref<ToolsetMeta[]>([])
const toolsetsForm = ref<string[]>([])
const savingToolsets = ref(false)
const toolsetsPending = ref(false)
const toolsetsError = ref<any | null>(null)

async function openToolsets(i: Integration) {
  toolsetsIntegration.value = i
  toolsetsModalOpen.value = true
  toolsetOptions.value = []
  toolsetsForm.value = []
  toolsetsError.value = null
  toolsetsPending.value = true
  try {
    const options = await fetchToolsetsForType(i.type)
    toolsetOptions.value = options
    toolsetsForm.value = (i.enabledToolsets && i.enabledToolsets.length)
      ? [...i.enabledToolsets]
      : options.map(o => o.key)
  }
  catch (e) {
    toolsetsError.value = e
  }
  finally {
    toolsetsPending.value = false
  }
}

async function saveToolsets() {
  if (!toolsetsIntegration.value)
    return
  savingToolsets.value = true
  try {
    await $fetch(`/api/integrations/${toolsetsIntegration.value.id}/toolsets`, {
      method: 'POST',
      body: { enabledToolsets: toolsetsForm.value },
    })
    toolsetsModalOpen.value = false
    await refresh()
  }
  finally {
    savingToolsets.value = false
  }
}

async function saveCredentials() {
  if (!activeIntegration.value) return
  savingCreds.value = true
  try {
    const body: Record<string, string> = {}
    for (const [k] of activeSchemaFields.value) {
      const v = (credentialsForm[k] || '').trim()
      if (v) body[k] = v
    }
    if (selectedVariant.value)
      body.credentialVariant = selectedVariant.value
    await $fetch(`/api/integrations/${activeIntegration.value.id}/credentials`, { method: 'POST', body })
    const res = await $fetch<{ hasCredentials: boolean }>(`/api/integrations/${activeIntegration.value.id}/credentials-status`)
    credentialStatus[activeIntegration.value.id] = !!res?.hasCredentials
    credentialsModalOpen.value = false
    await refresh()
  }
  finally {
    savingCreds.value = false
  }
}
</script>
