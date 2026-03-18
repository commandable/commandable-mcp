<script setup lang="ts">
import type { CredentialFieldSchema, CredentialVariantConfig } from '../types/integration'
import { marked } from 'marked'

interface CredConfig {
  supportsCredentials: boolean
  variants: CredentialVariantConfig[]
  defaultVariant: string | null | undefined
}

const props = defineProps<{
  integrationId: string
  integrationType: string
  currentVariant?: string | null
}>()

const emit = defineEmits<{
  saved: []
  disconnected: []
}>()

const credConfig = ref<CredConfig | null>(null)
const loading = ref(true)
const loadError = ref(false)
const hasCredentials = ref(false)
const healthStatus = ref<string | null>(null)
const selectedVariant = ref<string | undefined>(undefined)
const form = reactive<Record<string, string>>({})
const saving = ref(false)
const disconnecting = ref(false)
const modalOpen = ref(false)

const hasMultipleVariants = computed(() => (credConfig.value?.variants?.length ?? 0) > 1)

const variantItems = computed(() =>
  (credConfig.value?.variants || []).map(v => ({ label: v.label, value: v.key })),
)

const activeVariant = computed(() =>
  credConfig.value?.variants?.find(v => v.key === selectedVariant.value) ?? null,
)

const schemaFields = computed((): [string, unknown][] => {
  const properties = activeVariant.value?.schema?.properties || {}
  return Object.entries(properties)
})

const renderedHint = computed((): string => {
  const md = activeVariant.value?.hintMarkdown
  if (!md)
    return ''
  return marked.parse(md) as string
})

function isSecretField(key: string): boolean {
  const lower = key.toLowerCase()
  return lower.includes('token') || lower.includes('key') || lower.includes('secret') || lower.includes('password') || lower.includes('json')
}

function clearForm(): void {
  for (const key of Object.keys(form))
    form[key] = ''
}

function openModal() {
  clearForm()
  modalOpen.value = true
}

watch(selectedVariant, () => {
  clearForm()
})

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const [config, status] = await Promise.all([
      $fetch<CredConfig>(`/api/integrations/${props.integrationId}/credentials-config`),
      $fetch<{ hasCredentials: boolean, health_status: string | null }>(`/api/integrations/${props.integrationId}/credentials-status`),
    ])
    credConfig.value = config
    hasCredentials.value = !!status?.hasCredentials
    healthStatus.value = status?.health_status ?? null
    selectedVariant.value = props.currentVariant || config?.defaultVariant || config?.variants?.[0]?.key || undefined
  }
  catch {
    loadError.value = true
  }
  finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const body: Record<string, string> = {}
    for (const [k] of schemaFields.value) {
      const v = (form[k] || '').trim()
      if (v)
        body[k] = v
    }
    if (selectedVariant.value)
      body.credentialVariant = selectedVariant.value
    const res = await $fetch<{ ok: boolean, health_status: string }>(`/api/integrations/${props.integrationId}/credentials`, { method: 'POST', body })
    hasCredentials.value = true
    healthStatus.value = res.health_status ?? 'connected'
    modalOpen.value = false
    clearForm()
    emit('saved')
  }
  finally {
    saving.value = false
  }
}

async function disconnect() {
  disconnecting.value = true
  try {
    await $fetch(`/api/integrations/${props.integrationId}/credentials`, { method: 'DELETE' })
    hasCredentials.value = false
    healthStatus.value = 'disconnected'
    emit('disconnected')
  }
  finally {
    disconnecting.value = false
  }
}

load()
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <div
      v-if="loading"
      class="flex items-center gap-2 text-sm text-muted"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="animate-spin"
      />
      Checking connection…
    </div>

    <!-- No credentials support -->
    <div
      v-else-if="credConfig?.supportsCredentials === false"
      class="flex items-center gap-2 text-sm text-muted"
    >
      <UIcon name="i-lucide-info" />
      No credentials required for this integration.
    </div>

    <!-- Connected state -->
    <div
      v-else-if="healthStatus === 'connected'"
      class="flex items-center gap-3 flex-wrap"
    >
      <div class="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
        <span class="inline-block w-2 h-2 rounded-full bg-green-500" />
        Connected
      </div>
      <UButton
        size="xs"
        variant="soft"
        color="neutral"
        icon="i-lucide-refresh-cw"
        @click="openModal"
      >
        Reconfigure
      </UButton>
      <UButton
        size="xs"
        variant="soft"
        color="error"
        icon="i-lucide-unplug"
        :loading="disconnecting"
        @click="disconnect"
      >
        Disconnect
      </UButton>
    </div>

    <!-- Invalid credentials state -->
    <div
      v-else-if="healthStatus === 'invalid_credentials'"
      class="flex items-center gap-3 flex-wrap"
    >
      <div class="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
        <span class="inline-block w-2 h-2 rounded-full bg-red-500" />
        Invalid credentials
      </div>
      <UButton
        size="sm"
        icon="i-lucide-refresh-cw"
        color="primary"
        @click="openModal"
      >
        Reconfigure
      </UButton>
      <UButton
        size="xs"
        variant="soft"
        color="error"
        icon="i-lucide-unplug"
        :loading="disconnecting"
        @click="disconnect"
      >
        Disconnect
      </UButton>
    </div>

    <!-- Not connected state -->
    <div
      v-else
      class="flex items-center gap-3 flex-wrap"
    >
      <div class="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
        <span class="inline-block w-2 h-2 rounded-full bg-red-500" />
        Not connected
      </div>
      <UButton
        size="sm"
        icon="i-lucide-plug"
        color="primary"
        @click="openModal"
      >
        Connect
      </UButton>
    </div>

    <!-- Connect / Reconfigure Modal -->
    <UModal
      v-model:open="modalOpen"
      :title="hasCredentials ? 'Reconfigure Credentials' : 'Connect Integration'"
      description="Enter your credentials to connect this integration."
    >
      <template #body>
        <div class="space-y-4">
          <div
            v-if="loadError"
            class="text-sm text-red-600"
          >
            Failed to load credential schema. Please try again.
          </div>

          <template v-else>
            <UFormField
              v-if="hasMultipleVariants"
              label="Credential type"
            >
              <USelect
                v-model="selectedVariant"
                :items="variantItems"
                class="w-full"
              />
            </UFormField>

            <!-- eslint-disable-next-line vue/no-v-html -->
            <div
              v-if="activeVariant?.hintMarkdown"
              class="hint-markdown text-sm bg-[var(--ui-bg-elevated)] rounded-md px-3 py-2"
              v-html="renderedHint"
            />

            <div class="space-y-3">
              <UFormField
                v-for="[key, prop] in schemaFields"
                :key="key"
                :label="(prop as CredentialFieldSchema).title || key"
                :description="(prop as CredentialFieldSchema).description"
              >
                <UInput
                  v-model="form[key]"
                  :type="isSecretField(key) ? 'password' : 'text'"
                  class="w-full"
                />
              </UFormField>
            </div>
          </template>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-end gap-2 w-full">
          <UButton
            variant="ghost"
            color="neutral"
            :disabled="saving"
            @click="modalOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            :loading="saving"
            icon="i-lucide-check"
            @click="save"
          >
            Save Credentials
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.hint-markdown :deep(p) {
  margin-bottom: 0.5rem;
}
.hint-markdown :deep(p:last-child) {
  margin-bottom: 0;
}
.hint-markdown :deep(ul),
.hint-markdown :deep(ol) {
  padding-left: 1.25rem;
  margin-bottom: 0.5rem;
}
.hint-markdown :deep(ul) {
  list-style-type: disc;
}
.hint-markdown :deep(ol) {
  list-style-type: decimal;
}
.hint-markdown :deep(li) {
  margin-bottom: 0.2rem;
}
.hint-markdown :deep(code) {
  font-family: ui-monospace, monospace;
  font-size: 0.8em;
  background-color: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  padding: 0.1em 0.3em;
}
.dark .hint-markdown :deep(code) {
  background-color: rgba(255, 255, 255, 0.1);
}
.hint-markdown :deep(strong) {
  font-weight: 600;
}
.hint-markdown :deep(a) {
  color: var(--ui-primary);
  text-decoration: underline;
}
</style>
