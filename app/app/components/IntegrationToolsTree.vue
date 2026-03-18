<template>
  <div class="space-y-2">
    <div
      v-if="loading"
      class="text-sm text-muted py-2"
    >
      Loading tools…
    </div>
    <div
      v-else-if="loadError"
      class="text-sm text-red-600 py-2"
    >
      Failed to load tools.
    </div>
    <div
      v-else-if="!effectiveToolsets.length"
      class="text-sm text-muted py-2"
    >
      No tools available for this integration.
    </div>
    <template v-else>
      <div
        v-for="ts in effectiveToolsets"
        :key="ts.key"
        class="rounded-lg overflow-hidden border border-[var(--ui-border)]"
        :class="!isToolsetEnabled(ts.key) ? 'opacity-50' : ''"
      >
        <!-- Toolset header row -->
        <div
          class="flex items-center gap-3 px-3 py-2.5 bg-[var(--ui-bg-elevated)] border-l-4"
          :class="isToolsetEnabled(ts.key) ? 'border-l-primary' : 'border-l-transparent'"
        >
          <USwitch
            :model-value="isToolsetEnabled(ts.key)"
            size="sm"
            @update:model-value="toggleToolset(ts.key, $event)"
          />
          <button
            type="button"
            class="flex-1 flex items-center justify-between min-w-0 text-left"
            @click="toggleExpanded(ts.key)"
          >
            <div class="min-w-0">
              <span class="text-sm font-semibold">{{ ts.label }}</span>
              <span class="text-xs text-muted ml-2 font-normal">
                {{ getActiveCount(ts.key) }}/{{ getToolsInSet(ts.key).length }} active
              </span>
              <span
                v-if="ts.description"
                class="block text-xs text-muted mt-0.5"
              >{{ ts.description }}</span>
            </div>
            <UIcon
              :name="expanded.has(ts.key) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="text-muted shrink-0 ml-2"
            />
          </button>
        </div>

        <!-- Tools list (expanded) -->
        <div
          v-if="expanded.has(ts.key)"
          class="border-t border-[var(--ui-border)]"
        >
          <div class="ml-4 border-l-2 border-[var(--ui-border)]">
            <div
              v-for="tool in getToolsInSet(ts.key)"
              :key="tool.name"
              class="flex items-start gap-3 px-4 py-2.5 border-b border-[var(--ui-border)] last:border-b-0"
              :class="isToolGreyed(tool) ? 'opacity-40' : ''"
            >
              <USwitch
                :model-value="isToolEnabled(tool.name)"
                :disabled="isToolGreyed(tool) || !isToolsetEnabled(ts.key)"
                size="xs"
                class="mt-0.5 shrink-0"
                @update:model-value="toggleTool(tool.name, $event)"
              />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-medium">{{ tool.displayName }}</span>
                  <span
                    class="text-[10px] px-1.5 py-0.5 rounded font-medium leading-tight"
                    :class="scopeClass(tool.scope)"
                  >
                    {{ tool.scope }}
                  </span>
                  <span
                    v-if="isToolGreyed(tool)"
                    class="text-[10px] text-muted italic"
                  >
                    hidden by read-only
                  </span>
                </div>
                <p class="text-xs text-muted mt-0.5 leading-snug">
                  {{ tool.description }}
                </p>
                <p class="text-[10px] font-mono text-muted/60 mt-0.5">
                  {{ tool.name }}
                </p>
              </div>
              <UButton
                v-if="tool.custom && props.integrationId"
                size="xs"
                variant="soft"
                color="error"
                icon="i-lucide-trash-2"
                :loading="deletingToolName === tool.name"
                @click="deleteCustomTool(tool.name)"
              >
                Delete
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
type ToolItem = {
  name: string
  displayName: string
  description: string
  scope: 'read' | 'write' | 'admin'
  toolset?: string
  custom?: boolean
}

type ToolsetMeta = {
  key: string
  label: string
  description: string
}

type ToolsetMap = Record<string, { label: string, description: string }>

const props = defineProps<{
  integrationType?: string
  integrationId?: string
  maxScope: 'read' | 'write' | null
  enabledToolsets: string[]
  disabledTools: string[]
}>()

const emit = defineEmits<{
  'update:enabledToolsets': [value: string[]]
  'update:disabledTools': [value: string[]]
}>()

const toolsets = ref<ToolsetMeta[]>([])
const tools = ref<ToolItem[]>([])
const loading = ref(true)
const loadError = ref(false)
const deletingToolName = ref('')
const expanded = ref<Set<string>>(new Set())

const effectiveToolsets = computed<ToolsetMeta[]>(() => {
  if (toolsets.value.length)
    return toolsets.value

  const discovered = Array.from(new Set(
    tools.value
      .map(tool => tool.toolset)
      .filter((key): key is string => !!key)
  )).sort((a, b) => a.localeCompare(b))

  if (!discovered.length && tools.value.length) {
    return [{ key: '__all__', label: 'All tools', description: '' }]
  }

  return discovered.map(key => ({ key, label: key, description: '' }))
})

function scopeClass(scope: string): string {
  if (scope === 'read') return 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
  if (scope === 'write') return 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
  return 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
}

function isToolsetEnabled(key: string): boolean {
  if (key === '__all__') {
    // Considered enabled if at least one tool in the group is not disabled
    return getToolsInSet('__all__').some(t => !props.disabledTools.includes(t.name))
  }
  return props.enabledToolsets.includes(key)
}

function isToolEnabled(name: string): boolean {
  return !props.disabledTools.includes(name)
}

function isToolGreyed(tool: ToolItem): boolean {
  return props.maxScope === 'read' && tool.scope !== 'read'
}

function getToolsInSet(key: string): ToolItem[] {
  if (key === '__all__') return tools.value
  return tools.value.filter(t => t.toolset === key)
}

function getActiveCount(key: string): number {
  return getToolsInSet(key).filter((t) => {
    if (isToolGreyed(t)) return false
    if (props.disabledTools.includes(t.name)) return false
    return true
  }).length
}

function toggleToolset(key: string, enabled: boolean) {
  if (key === '__all__') {
    // Toggle all tools in/out of disabledTools
    const allNames = getToolsInSet('__all__').map(t => t.name)
    const current = props.disabledTools.filter(n => !allNames.includes(n))
    emit('update:disabledTools', enabled ? current : [...current, ...allNames])
    return
  }
  const current = [...props.enabledToolsets]
  if (enabled) {
    if (!current.includes(key)) current.push(key)
  } else {
    if (current.length > 1) {
      const idx = current.indexOf(key)
      if (idx >= 0) current.splice(idx, 1)
    }
  }
  emit('update:enabledToolsets', current)
}

function toggleTool(name: string, enabled: boolean) {
  const current = [...props.disabledTools]
  if (enabled) {
    const idx = current.indexOf(name)
    if (idx >= 0) current.splice(idx, 1)
  } else {
    if (!current.includes(name)) current.push(name)
  }
  emit('update:disabledTools', current)
}

function toggleExpanded(key: string) {
  const next = new Set(expanded.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expanded.value = next
}

async function load() {
  loading.value = true
  loadError.value = false
  try {
    if (!props.integrationId && !props.integrationType) {
      toolsets.value = []
      tools.value = []
      return
    }
    const [tsData, toolData] = await (props.integrationId
      ? Promise.all([
          $fetch<ToolsetMap>(`/api/integrations/${props.integrationId}/toolsets`),
          $fetch<ToolItem[]>(`/api/integrations/${props.integrationId}/tools`)
        ])
      : Promise.all([
          $fetch<ToolsetMap>(`/api/catalog/${props.integrationType}/toolsets`),
          $fetch<ToolItem[]>(`/api/catalog/${props.integrationType}/tools`)
        ]))

    toolsets.value = Object.entries(tsData || {})
      .map(([key, value]) => ({ key, label: value.label, description: value.description }))
      .sort((a, b) => a.key.localeCompare(b.key))

    tools.value = toolData || []

    if (effectiveToolsets.value.length)
      expanded.value = new Set([effectiveToolsets.value[0]!.key])
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

async function deleteCustomTool(name: string) {
  if (!props.integrationId || !name || deletingToolName.value)
    return
  if (!window.confirm(`Delete custom tool "${name}"? This cannot be undone.`))
    return
  deletingToolName.value = name
  try {
    await $fetch(`/api/integrations/${props.integrationId}/tools`, {
      method: 'DELETE',
      body: { name }
    })
    emit('update:disabledTools', props.disabledTools.filter(toolName => toolName !== name))
    await load()
  } finally {
    deletingToolName.value = ''
  }
}

defineExpose({ toolsets: effectiveToolsets })

load()
</script>
