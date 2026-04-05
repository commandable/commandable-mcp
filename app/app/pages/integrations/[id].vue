<script setup lang="ts">
import type { IntegrationData } from '@commandable/mcp-core'
import type { CatalogEntry, IntegrationToolsTreeExpose } from '../../types/integration'
import IntegrationVariantConfigDialog from '../../components/IntegrationVariantConfigDialog.vue'

const HYPHEN_REGEX = /-/g
const WHITESPACE_SPLIT_REGEX = /\s+/

const route = useRoute()
const integrationId = route.params.id as string

const { data: integrations, pending, error, refresh } = await useFetch<IntegrationData[]>('/api/integrations')
const { data: catalog } = await useFetch<CatalogEntry[]>('/api/catalog')

const integration = computed(() => integrations.value?.find(i => i.id === integrationId) ?? null)

const formEnabled = ref(true)
const formMaxScope = ref<'read' | 'write' | null>(null)
const formEnabledToolsets = ref<string[]>([])
const formDisabledTools = ref<string[]>([])
const toolsTreeRef = ref<IntegrationToolsTreeExpose | null>(null)
const removeModalOpen = ref(false)
const saving = ref(false)
const variantConfigDialogOpen = ref(false)
const savingVariantConfig = ref(false)
const connectionHealthStatus = ref<string | null>(null)
const connectionStatusLoading = ref(false)

function humanizeType(type: string) {
  return type
    .replace(HYPHEN_REGEX, ' ')
    .split(WHITESPACE_SPLIT_REGEX)
    .filter(Boolean)
    .map(word => word[0] ? `${word[0].toUpperCase()}${word.slice(1)}` : word)
    .join(' ')
}

const baseCatalogEntry = computed(() =>
  (catalog.value || []).find(entry =>
    entry.type === integration.value?.type
    || entry.variants?.some(variant => variant.type === integration.value?.type),
  ) ?? null,
)

const baseType = computed(() => baseCatalogEntry.value?.type ?? integration.value?.type ?? null)

const familyVariants = computed(() =>
  baseCatalogEntry.value?.variants?.filter(variant => (variant.variantConfig?.length ?? 0) > 0) ?? [],
)

const showsVariantScopeAction = computed(() =>
  familyVariants.value.length > 0
  && Boolean(integration.value),
)

const isConnected = computed(() => connectionHealthStatus.value === 'connected')

const canConfigureVariantScope = computed(() =>
  showsVariantScopeAction.value
  && isConnected.value,
)
const baseIntegrationName = computed(() => baseCatalogEntry.value?.name || (baseType.value ? humanizeType(baseType.value) : 'Integration'))

const variantScopeBlockedMessage = computed(() => {
  if (!showsVariantScopeAction.value || canConfigureVariantScope.value)
    return null
  if (connectionStatusLoading.value)
    return 'Checking connection before enabling reduced scope...'
  if (connectionHealthStatus.value === 'invalid_credentials')
    return 'Reconnect this integration before choosing a reduced scope.'
  return 'Connect this integration before choosing a reduced scope.'
})

async function refreshConnectionStatus() {
  if (!integration.value || !showsVariantScopeAction.value) {
    connectionHealthStatus.value = null
    return
  }
  connectionStatusLoading.value = true
  try {
    const status = await $fetch<{ health_status: string | null }>(`/api/integrations/${integration.value.id}/credentials-status`)
    connectionHealthStatus.value = status?.health_status ?? 'disconnected'
  }
  catch {
    connectionHealthStatus.value = 'disconnected'
  }
  finally {
    connectionStatusLoading.value = false
  }
}

function initForm() {
  if (!integration.value)
    return
  formEnabled.value = integration.value.enabled !== false
  formMaxScope.value = integration.value.maxScope === 'read' ? 'read' : null
  formDisabledTools.value = integration.value.disabledTools ? [...integration.value.disabledTools] : []

  const treeToolsets = toolsTreeRef.value?.toolsets
  const allKeys = Array.isArray(treeToolsets)
    ? treeToolsets.map(t => t.key).filter(k => k !== '__all__' && k !== 'custom')
    : []
  formEnabledToolsets.value = integration.value.enabledToolsets?.length
    ? [...integration.value.enabledToolsets]
    : allKeys
}

watch(integration, () => initForm(), { immediate: true })
watch(() => integration.value?.id, () => {
  void refreshConnectionStatus()
}, { immediate: true })

// Re-initialize form when the tree finishes loading its toolsets
watch(() => toolsTreeRef.value?.toolsets, (toolsets) => {
  if (!integration.value || !toolsets?.length)
    return
  if (!integration.value.enabledToolsets?.length) {
    formEnabledToolsets.value = toolsets.map(t => t.key).filter(k => k !== '__all__')
  }
}, { deep: true })

async function saveAll() {
  if (!integration.value)
    return
  saving.value = true
  try {
    const id = integration.value.id

    // Save enabled state
    await $fetch('/api/integrations', {
      method: 'POST',
      body: { ...integration.value, enabled: formEnabled.value },
    })

    // Save toolsets
    const treeToolsets = toolsTreeRef.value?.toolsets
    const allKeys = Array.isArray(treeToolsets)
      ? treeToolsets.map(t => t.key).filter(k => k !== '__all__' && k !== 'custom')
      : []
    const enabledToolsets = allKeys.length && formEnabledToolsets.value.length < allKeys.length
      ? formEnabledToolsets.value
      : []
    await $fetch(`/api/integrations/${id}/toolsets`, {
      method: 'POST',
      body: { enabledToolsets },
    })

    // Save permissions
    await $fetch(`/api/integrations/${id}/permissions`, {
      method: 'POST',
      body: {
        maxScope: formMaxScope.value,
        disabledTools: formDisabledTools.value.length ? formDisabledTools.value : null,
      },
    })

    await refresh()
  }
  finally {
    saving.value = false
  }
}

async function confirmRemove() {
  if (!integration.value)
    return
  removeModalOpen.value = true
}

async function removeIntegration() {
  if (!integration.value)
    return
  removeModalOpen.value = false
  await $fetch(`/api/integrations/${integration.value.id}`, { method: 'DELETE' })
  navigateTo('/integrations')
}

async function openVariantScopeDialog() {
  if (!canConfigureVariantScope.value)
    return
  variantConfigDialogOpen.value = true
}

async function onCredentialChange() {
  await refresh()
  await refreshConnectionStatus()
  if (canConfigureVariantScope.value)
    variantConfigDialogOpen.value = true
}

async function saveVariantScope(payload: { type: string, config: Record<string, unknown> | null, labelSuffix: string | null }) {
  if (!integration.value || !baseType.value)
    return

  savingVariantConfig.value = true
  try {
    const nextLabel = payload.type === baseType.value
      ? baseIntegrationName.value
      : (payload.labelSuffix ? `${baseIntegrationName.value}: ${payload.labelSuffix}` : integration.value.label)

    await $fetch('/api/integrations', {
      method: 'POST',
      body: {
        ...integration.value,
        type: payload.type,
        label: nextLabel,
        config: payload.config,
      },
    })

    variantConfigDialogOpen.value = false
    await refresh()
  }
  finally {
    savingVariantConfig.value = false
  }
}
</script>

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
          <UButton
            v-if="showsVariantScopeAction"
            size="xs"
            variant="soft"
            color="neutral"
            icon="i-lucide-filter"
            :disabled="!canConfigureVariantScope || connectionStatusLoading"
            :loading="connectionStatusLoading"
            @click="openVariantScopeDialog"
          >
            Reduce Scope
          </UButton>
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
        <p
          v-if="variantScopeBlockedMessage"
          class="mt-2 text-xs text-muted"
        >
          {{ variantScopeBlockedMessage }}
        </p>
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

      <UModal
        v-model:open="removeModalOpen"
        title="Remove integration"
        :description="integration ? `Remove &quot;${integration.label}&quot;? This cannot be undone.` : undefined"
      >
        <template #footer>
          <div class="flex items-center justify-end gap-2 w-full">
            <UButton
              variant="ghost"
              color="neutral"
              @click="removeModalOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              icon="i-lucide-trash-2"
              @click="removeIntegration"
            >
              Remove
            </UButton>
          </div>
        </template>
      </UModal>

      <IntegrationVariantConfigDialog
        v-if="integration && baseType"
        v-model:open="variantConfigDialogOpen"
        :integration-id="integration.id"
        :current-type="integration.type"
        :base-type="baseType"
        :base-name="baseIntegrationName"
        :variants="familyVariants"
        :saving="savingVariantConfig"
        @confirm="saveVariantScope"
      />
    </template>
  </UContainer>
</template>
