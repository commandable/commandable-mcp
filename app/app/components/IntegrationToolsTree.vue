<template>
  <div class="space-y-3">
    <div v-if="loading" class="text-sm text-muted">
      Loading tools…
    </div>
    <div v-else-if="loadError" class="text-sm text-red-600">
      Failed to load tools.
    </div>
    <div v-else-if="!effectiveToolsets.length" class="text-sm text-muted">
      No tools available for this integration.
    </div>
    <template v-else>
      <div
        v-for="ts in effectiveToolsets"
        :key="ts.key"
        class="border border-[var(--ui-border)] rounded-lg overflow-hidden"
        :class="!isToolsetEnabled(ts.key) ? 'opacity-50' : ''"
      >
        <div class="flex items-center gap-3 px-4 py-3 bg-[var(--ui-bg-elevated)]">
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
              <span class="text-sm font-medium">{{ ts.label }}</span>
              <span class="text-xs text-muted ml-2">
                {{ getActiveCount(ts.key) }}/{{ getToolsInSet(ts.key).length }} active
              </span>
            </div>
            <UIcon
              :name="expanded.has(ts.key) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="text-muted shrink-0"
            />
          </button>
        </div>

        <div v-if="expanded.has(ts.key)" class="divide-y divide-[var(--ui-border)]">
          <div
            v-for="tool in getToolsInSet(ts.key)"
            :key="tool.name"
            class="flex items-start gap-3 px-4 py-2.5"
            :class="isToolGreyed(tool) ? 'opacity-40' : ''"
          >
            <USwitch
              :model-value="isToolEnabled(tool.name)"
              :disabled="isToolGreyed(tool) || !isToolsetEnabled(ts.key)"
              size="xs"
              class="mt-0.5"
              @update:model-value="toggleTool(tool.name, $event)"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-mono font-medium">{{ tool.name }}</span>
                <span
                  class="text-[10px] px-1.5 py-0.5 rounded font-medium leading-tight"
                  :class="scopeClass(tool.scope)"
                >
                  {{ tool.scope }}
                </span>
                <span v-if="isToolGreyed(tool)" class="text-[10px] text-muted italic">
                  hidden by read-only
                </span>
              </div>
              <p class="text-xs text-muted mt-0.5 leading-snug">
                {{ tool.description }}
              </p>
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
  description: string
  scope: 'read' | 'write' | 'admin'
  toolset?: string
}

type ToolsetMeta = {
  key: string
  label: string
  description: string
}

type ToolsetMap = Record<string, { label: string, description: string }>

const props = defineProps<{
  integrationType: string
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
const expanded = ref<Set<string>>(new Set())

const effectiveToolsets = computed<ToolsetMeta[]>(() => {
  if (toolsets.value.length)
    return toolsets.value

  const discovered = Array.from(new Set(
    tools.value
      .map(tool => tool.toolset)
      .filter((key): key is string => !!key),
  )).sort((a, b) => a.localeCompare(b))

  if (!discovered.length && tools.value.length) {
    return [{
      key: '__all__',
      label: 'All tools',
      description: '',
    }]
  }

  return discovered.map(key => ({
    key,
    label: key,
    description: '',
  }))
})

function scopeClass(scope: string): string {
  if (scope === 'read') return 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
  if (scope === 'write') return 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
  return 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
}

function isToolsetEnabled(key: string): boolean {
  return props.enabledToolsets.includes(key)
}

function isToolEnabled(name: string): boolean {
  return !props.disabledTools.includes(name)
}

function isToolGreyed(tool: ToolItem): boolean {
  return props.maxScope === 'read' && tool.scope !== 'read'
}

function getToolsInSet(key: string): ToolItem[] {
  if (key === '__all__')
    return tools.value
  return tools.value.filter(t => t.toolset === key)
}

function getActiveCount(key: string): number {
  return getToolsInSet(key).filter(t => {
    if (isToolGreyed(t)) return false
    if (props.disabledTools.includes(t.name)) return false
    return true
  }).length
}

function toggleToolset(key: string, enabled: boolean) {
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
    const [tsData, toolData] = await Promise.all([
      $fetch<ToolsetMap>(`/api/catalog/${props.integrationType}/toolsets`),
      $fetch<ToolItem[]>(`/api/catalog/${props.integrationType}/tools`),
    ])

    toolsets.value = Object.entries(tsData || {})
      .map(([key, value]) => ({ key, label: value.label, description: value.description }))
      .sort((a, b) => a.key.localeCompare(b.key))

    tools.value = toolData || []

    // Auto-expand first toolset
    if (effectiveToolsets.value.length)
      expanded.value = new Set([effectiveToolsets.value[0]!.key])
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

defineExpose({ toolsets: effectiveToolsets })

load()
</script>
