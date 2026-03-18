<template>
  <UContainer class="py-10 space-y-8 max-w-3xl">
    <div
      v-if="pending"
      class="text-sm text-muted py-8 text-center"
    >
      Loading…
    </div>
    <div
      v-else-if="error || !integration"
      class="py-8 text-center space-y-4"
    >
      <div class="text-sm text-red-600">
        Integration not found.
      </div>
      <UButton
        to="/integrations"
        variant="soft"
        color="neutral"
        icon="i-lucide-arrow-left"
      >
        Back to Integrations
      </UButton>
    </div>
    <template v-else>
      <!-- Header -->
      <div>
        <NuxtLink
          to="/integrations"
          class="inline-flex items-center gap-1 text-sm text-muted hover:text-[var(--ui-text)] transition-colors mb-4"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="w-4 h-4"
          />
          Back to Integrations
        </NuxtLink>

        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-semibold">
              {{ integration.label }}
            </h1>
            <UBadge
              size="sm"
              color="neutral"
              variant="subtle"
            >
              {{ integration.type }}
            </UBadge>
          </div>
          <USwitch
            v-model="formEnabled"
            size="lg"
          />
        </div>
        <p class="text-sm text-muted mt-1">
          {{ integration.type }} · {{ integration.referenceId }}
        </p>
      </div>

      <!-- Credentials -->
      <section>
        <div class="flex items-center justify-between gap-4 mb-1">
          <h2 class="text-lg font-medium">
            Connection
          </h2>
        </div>
        <div class="border border-[var(--ui-border)] rounded-lg px-4 py-3">
          <IntegrationCredentials
            :integration-id="integration.id"
            :integration-type="integration.type"
            :current-variant="integration.credentialVariant"
            @saved="onCredentialChange"
            @disconnected="onCredentialChange"
          />
        </div>
      </section>

      <!-- Access Level -->
      <section class="space-y-3">
        <h2 class="text-lg font-medium">
          Access Level
        </h2>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-4 py-2 text-sm rounded-lg border transition-colors"
            :class="formMaxScope !== 'read'
              ? 'border-green-500 bg-green-50 text-green-700 font-medium dark:bg-green-950 dark:text-green-300'
              : 'border-[var(--ui-border)] text-muted hover:bg-[var(--ui-bg-elevated)]'"
            @click="formMaxScope = null"
          >
            Read + Write
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm rounded-lg border transition-colors"
            :class="formMaxScope === 'read'
              ? 'border-green-500 bg-green-50 text-green-700 font-medium dark:bg-green-950 dark:text-green-300'
              : 'border-[var(--ui-border)] text-muted hover:bg-[var(--ui-bg-elevated)]'"
            @click="formMaxScope = 'read'"
          >
            Read-only
          </button>
        </div>
        <p
          v-if="formMaxScope === 'read'"
          class="text-xs text-amber-600 dark:text-amber-400"
        >
          Only read tools will be available. Write and admin tools will be greyed out below.
        </p>
      </section>

      <!-- Tools -->
      <section class="space-y-3">
        <h2 class="text-lg font-medium">
          Tools
        </h2>
        <IntegrationToolsTree
          ref="toolsTreeRef"
          :integration-id="integration.id"
          :max-scope="formMaxScope"
          :enabled-toolsets="formEnabledToolsets"
          :disabled-tools="formDisabledTools"
          @update:enabled-toolsets="formEnabledToolsets = $event"
          @update:disabled-tools="formDisabledTools = $event"
        />
      </section>

      <!-- Save bar -->
      <div class="sticky bottom-0 py-4 bg-[var(--ui-bg)] border-t border-[var(--ui-border)] -mx-4 px-4 flex items-center justify-between gap-4">
        <UButton
          :loading="saving"
          size="lg"
          @click="saveAll"
        >
          Save Changes
        </UButton>

        <UButton
          variant="soft"
          color="error"
          icon="i-lucide-trash-2"
          @click="confirmRemove"
        >
          Remove Integration
        </UButton>
      </div>
    </template>
  </UContainer>
</template>

<script setup lang="ts">
type Integration = {
  id: string
  type: string
  referenceId: string
  label: string
  enabled?: boolean
  credentialVariant?: string | null
  enabledToolsets?: string[] | null
  maxScope?: 'read' | 'write' | null
  disabledTools?: string[] | null
}

const route = useRoute()
const integrationId = route.params.id as string

const { data: integrations, pending, error, refresh } = await useFetch<Integration[]>('/api/integrations')

const integration = computed(() => integrations.value?.find(i => i.id === integrationId) ?? null)

const formEnabled = ref(true)
const formMaxScope = ref<'read' | 'write' | null>(null)
const formEnabledToolsets = ref<string[]>([])
const formDisabledTools = ref<string[]>([])
const toolsTreeRef = ref<any>(null)
const saving = ref(false)

function initForm() {
  if (!integration.value) return
  formEnabled.value = integration.value.enabled !== false
  formMaxScope.value = integration.value.maxScope === 'read' ? 'read' : null
  formDisabledTools.value = integration.value.disabledTools ? [...integration.value.disabledTools] : []

  const treeToolsets = toolsTreeRef.value?.toolsets
  const allKeys = Array.isArray(treeToolsets)
    ? treeToolsets.map((t: any) => t.key).filter((k: string) => k !== '__all__' && k !== 'custom')
    : []
  formEnabledToolsets.value = integration.value.enabledToolsets?.length
    ? [...integration.value.enabledToolsets]
    : allKeys
}

watch(integration, () => initForm(), { immediate: true })

// Re-initialize form when the tree finishes loading its toolsets
watch(() => toolsTreeRef.value?.toolsets, (toolsets) => {
  if (!integration.value || !toolsets?.length) return
  if (!integration.value.enabledToolsets?.length) {
    formEnabledToolsets.value = toolsets.map((t: any) => t.key).filter((k: string) => k !== '__all__')
  }
}, { deep: true })

async function saveAll() {
  if (!integration.value) return
  saving.value = true
  try {
    const id = integration.value.id

    // Save enabled state
    await $fetch('/api/integrations', {
      method: 'POST',
      body: { ...integration.value, enabled: formEnabled.value }
    })

    // Save toolsets
    const treeToolsets = toolsTreeRef.value?.toolsets
    const allKeys = Array.isArray(treeToolsets)
      ? treeToolsets.map((t: any) => t.key).filter((k: string) => k !== '__all__' && k !== 'custom')
      : []
    const enabledToolsets = allKeys.length && formEnabledToolsets.value.length < allKeys.length
      ? formEnabledToolsets.value
      : []
    await $fetch(`/api/integrations/${id}/toolsets`, {
      method: 'POST',
      body: { enabledToolsets }
    })

    // Save permissions
    await $fetch(`/api/integrations/${id}/permissions`, {
      method: 'POST',
      body: {
        maxScope: formMaxScope.value,
        disabledTools: formDisabledTools.value.length ? formDisabledTools.value : null
      }
    })

    await refresh()
  } finally {
    saving.value = false
  }
}

async function confirmRemove() {
  if (!integration.value) return
  if (!window.confirm(`Remove "${integration.value.label}"? This cannot be undone.`))
    return
  await $fetch(`/api/integrations/${integration.value.id}`, { method: 'DELETE' })
  navigateTo('/integrations')
}

function onCredentialChange() {
  refresh()
}
</script>
