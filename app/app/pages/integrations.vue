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
            Only read tools will be available. Write and admin tools will be hidden.
          </p>
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
              <UBadge
                v-if="i.maxScope === 'read'"
                size="xs"
                color="warning"
                variant="soft"
              >
                Read-only
              </UBadge>
              <UBadge
                v-if="i.disabledTools && i.disabledTools.length"
                size="xs"
                color="neutral"
                variant="soft"
              >
                {{ i.disabledTools.length }} tool{{ i.disabledTools.length === 1 ? '' : 's' }} blocked
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
            <UButton size="sm" variant="soft" color="neutral" @click="openAccess(i)">
              Configure tool access
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
    <!-- Configure tool access modal -->
    <UModal v-model:open="accessModalOpen">
      <UCard>
        <template #header>
          <div class="font-medium">
            Configure tool access: {{ accessIntegration?.label }}
          </div>
        </template>

        <div class="space-y-6">
          <!-- Section 1: Scope cap -->
          <div class="space-y-2">
            <div class="text-sm font-medium">
              Access level
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="px-3 py-1.5 text-sm rounded-md border transition-colors"
                :class="accessMaxScope !== 'read'
                  ? 'border-green-500 bg-green-50 text-green-700 font-medium dark:bg-green-950 dark:text-green-300'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'"
                @click="accessMaxScope = null"
              >
                Read + Write
              </button>
              <button
                type="button"
                class="px-3 py-1.5 text-sm rounded-md border transition-colors"
                :class="accessMaxScope === 'read'
                  ? 'border-green-500 bg-green-50 text-green-700 font-medium dark:bg-green-950 dark:text-green-300'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'"
                @click="accessMaxScope = 'read'"
              >
                Read-only
              </button>
            </div>
            <p v-if="accessMaxScope === 'read'" class="text-xs text-amber-600 dark:text-amber-400">
              Only read tools will be available. Write tools are dimmed below.
            </p>
          </div>

          <!-- Section 2: Tool groups -->
          <div v-if="getAccessToolsets().length" class="space-y-2">
            <div class="text-sm font-medium">
              Tool groups
            </div>
            <div class="space-y-1">
              <label
                v-for="toolset in getAccessToolsets()"
                :key="`access-ts-${toolset.key}`"
                class="flex items-start gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  :checked="isToolsetChecked(toolset.key)"
                  class="mt-1"
                  @change="toggleAccessToolset(toolset.key)"
                >
                <span>
                  <span class="font-medium">{{ toolset.label }}</span>
                  <span class="text-muted"> — {{ toolset.description }}</span>
                </span>
              </label>
            </div>
          </div>

          <!-- Section 3: Individual tools -->
          <div class="space-y-2">
            <div class="text-sm font-medium">
              Individual tools
            </div>

            <div v-if="accessToolsPending" class="text-sm text-muted">
              Loading tools…
            </div>
            <div v-else-if="accessToolsError" class="text-sm text-red-600">
              Failed to load tools.
            </div>
            <div v-else-if="!getAccessToolsets().length" class="text-sm text-muted">
              No tool groups defined for this integration.
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="toolset in getAccessToolsets()"
                :key="`access-tools-${toolset.key}`"
                class="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden"
                :class="!isToolsetChecked(toolset.key) ? 'opacity-50' : ''"
              >
                <!-- Toolset header -->
                <button
                  type="button"
                  class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  @click="toggleSection(toolset.key)"
                >
                  <span>
                    {{ toolset.label }}
                    <span class="font-normal text-muted ml-1">
                      ({{ getActiveToolCount(toolset.key) }}/{{ getToolsForSection(toolset.key).length }} active)
                    </span>
                  </span>
                  <span class="text-muted text-xs">{{ expandedSections.has(toolset.key) ? '▲' : '▼' }}</span>
                </button>

                <!-- Tools list (expanded) -->
                <div v-if="expandedSections.has(toolset.key)" class="divide-y divide-slate-100 dark:divide-slate-800">
                  <div
                    v-for="tool in getToolsForSection(toolset.key)"
                    :key="`tool-${tool.name}`"
                    class="flex items-start gap-2 px-3 py-2"
                    :class="isToolHiddenByScope(tool) ? 'opacity-40' : ''"
                  >
                    <input
                      type="checkbox"
                      :checked="isToolChecked(tool.name)"
                      :disabled="isToolHiddenByScope(tool)"
                      class="mt-0.5 shrink-0"
                      @change="toggleAccessTool(tool.name)"
                    >
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs font-mono font-medium">{{ tool.name }}</span>
                        <span
                          class="text-xs px-1.5 py-0.5 rounded font-medium"
                          :class="tool.scope === 'read'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                            : tool.scope === 'write'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                              : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'"
                        >
                          {{ tool.scope }}
                        </span>
                        <span v-if="isToolHiddenByScope(tool)" class="text-xs text-muted italic">hidden by Read-only</span>
                      </div>
                      <p class="text-xs text-muted mt-0.5 leading-snug">
                        {{ tool.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="soft" color="neutral" @click="accessModalOpen = false">
              Cancel
            </UButton>
            <UButton :loading="savingAccess" @click="saveAccess">
              Save
            </UButton>
          </div>
        </template>
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
  maxScope?: 'read' | 'write' | null
  disabledTools?: string[] | null
}

type ToolItem = {
  name: string
  description: string
  scope: 'read' | 'write' | 'admin'
  toolset?: string
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
const selectedTypeMaxScope = ref<'read' | null>(null)
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
  selectedTypeMaxScope.value = null
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
        maxScope: selectedTypeMaxScope.value || undefined,
      },
    })
    selectedType.value = undefined
    selectedTypeMaxScope.value = null
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

// ── Configure tool access modal ────────────────────────────────────────────

const accessModalOpen = ref(false)
const accessIntegration = ref<Integration | null>(null)
const accessToolsPending = ref(false)
const accessToolsError = ref<any | null>(null)
const toolsByType = reactive<Record<string, ToolItem[]>>({})

// Form state for the modal
const accessMaxScope = ref<'read' | null>(null)
const accessEnabledToolsets = ref<string[]>([])
const accessDisabledTools = ref<string[]>([])
const savingAccess = ref(false)
const expandedSections = ref<Set<string>>(new Set())

async function fetchToolsForType(type: string): Promise<ToolItem[]> {
  if (toolsByType[type])
    return toolsByType[type]
  const data = await $fetch<ToolItem[]>(`/api/catalog/${type}/tools`)
  toolsByType[type] = data || []
  return toolsByType[type]
}

async function openAccess(i: Integration) {
  accessIntegration.value = i
  accessMaxScope.value = i.maxScope === 'read' ? 'read' : null
  accessDisabledTools.value = i.disabledTools ? [...i.disabledTools] : []
  accessModalOpen.value = true
  expandedSections.value = new Set()
  accessToolsError.value = null

  // Pre-populate toolsets from cached data (already fetched for list display)
  const opts = await fetchToolsetsForType(i.type).catch(() => [])
  const allKeys = opts.map(o => o.key)
  accessEnabledToolsets.value = (i.enabledToolsets && i.enabledToolsets.length)
    ? [...i.enabledToolsets]
    : allKeys

  // Fetch individual tools
  accessToolsPending.value = true
  try {
    await fetchToolsForType(i.type)
  }
  catch (e) {
    accessToolsError.value = e
  }
  finally {
    accessToolsPending.value = false
  }
}

function getAccessToolsets(): ToolsetMeta[] {
  if (!accessIntegration.value)
    return []
  return toolsetsByType[accessIntegration.value.type] || []
}

function getToolsForSection(toolsetKey: string): ToolItem[] {
  if (!accessIntegration.value)
    return []
  return (toolsByType[accessIntegration.value.type] || []).filter(t => t.toolset === toolsetKey)
}

function isToolsetChecked(key: string): boolean {
  return accessEnabledToolsets.value.includes(key)
}

function toggleAccessToolset(key: string) {
  const idx = accessEnabledToolsets.value.indexOf(key)
  if (idx >= 0) {
    // Don't allow unchecking the last toolset
    if (accessEnabledToolsets.value.length > 1)
      accessEnabledToolsets.value.splice(idx, 1)
  }
  else {
    accessEnabledToolsets.value.push(key)
  }
}

function isToolChecked(name: string): boolean {
  return !accessDisabledTools.value.includes(name)
}

function toggleAccessTool(name: string) {
  const idx = accessDisabledTools.value.indexOf(name)
  if (idx >= 0)
    accessDisabledTools.value.splice(idx, 1)
  else
    accessDisabledTools.value.push(name)
}

function isToolHiddenByScope(tool: ToolItem): boolean {
  return accessMaxScope.value === 'read' && tool.scope !== 'read'
}

function toggleSection(key: string) {
  if (expandedSections.value.has(key))
    expandedSections.value.delete(key)
  else
    expandedSections.value.add(key)
  expandedSections.value = new Set(expandedSections.value)
}

function getActiveToolCount(toolsetKey: string): number {
  return getToolsForSection(toolsetKey).filter((t) => {
    if (isToolHiddenByScope(t)) return false
    if (accessDisabledTools.value.includes(t.name)) return false
    return true
  }).length
}

async function saveAccess() {
  if (!accessIntegration.value)
    return
  savingAccess.value = true
  try {
    const id = accessIntegration.value.id
    const allToolsets = toolsetsByType[accessIntegration.value.type] || []
    const allKeys = allToolsets.map(o => o.key)
    // null means all toolsets enabled
    const enabledToolsets = allKeys.length && accessEnabledToolsets.value.length < allKeys.length
      ? accessEnabledToolsets.value
      : []

    await $fetch(`/api/integrations/${id}/toolsets`, {
      method: 'POST',
      body: { enabledToolsets },
    })
    await $fetch(`/api/integrations/${id}/permissions`, {
      method: 'POST',
      body: {
        maxScope: accessMaxScope.value,
        disabledTools: accessDisabledTools.value.length ? accessDisabledTools.value : null,
      },
    })
    accessModalOpen.value = false
    await refresh()
  }
  finally {
    savingAccess.value = false
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
