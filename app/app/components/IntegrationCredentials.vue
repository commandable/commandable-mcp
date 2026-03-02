<template>
  <div class="space-y-4">
    <div v-if="loading" class="text-sm text-muted">
      Loading credential schema…
    </div>
    <div v-else-if="loadError" class="text-sm text-red-600">
      Failed to load credential schema.
    </div>
    <div v-else-if="credConfig?.supportsCredentials === false" class="text-sm text-muted">
      This integration does not support credentials-based auth yet.
    </div>
    <template v-else>
      <div class="flex items-center gap-2 text-sm">
        <span
          class="inline-block w-2 h-2 rounded-full"
          :class="hasCredentials ? 'bg-green-500' : 'bg-amber-400'"
        />
        <span class="text-muted">{{ hasCredentials ? 'Credentials saved' : 'No credentials configured' }}</span>
      </div>

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
          v-for="[key, prop] in schemaFields"
          :key="key"
          :label="(prop as any).title || key"
          :description="(prop as any).description"
          hint="You can enter env:VARNAME"
        >
          <UInput
            v-model="form[key]"
            :type="isSecretField(key) ? 'password' : 'text'"
            placeholder="env:MY_TOKEN or actual value"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="flex items-center gap-2">
        <UButton :loading="saving" @click="save">
          Save Credentials
        </UButton>
        <UButton
          v-if="hasCredentials"
          variant="soft"
          color="error"
          :loading="disconnecting"
          @click="disconnect"
        >
          Disconnect
        </UButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
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
const selectedVariant = ref<string | undefined>(undefined)
const form = reactive<Record<string, string>>({})
const saving = ref(false)
const disconnecting = ref(false)

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

function isSecretField(key: string): boolean {
  const lower = key.toLowerCase()
  return lower.includes('token') || lower.includes('key') || lower.includes('secret') || lower.includes('password') || lower.includes('json')
}

watch(selectedVariant, () => {
  for (const k of Object.keys(form))
    delete form[k]
})

async function load() {
  loading.value = true
  loadError.value = false
  try {
    const [config, status] = await Promise.all([
      $fetch<CredConfig>(`/api/integrations/${props.integrationId}/credentials-config`),
      $fetch<{ hasCredentials: boolean }>(`/api/integrations/${props.integrationId}/credentials-status`),
    ])
    credConfig.value = config
    hasCredentials.value = !!status?.hasCredentials
    selectedVariant.value = props.currentVariant || config?.defaultVariant || config?.variants?.[0]?.key || undefined
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const body: Record<string, string> = {}
    for (const [k] of schemaFields.value) {
      const v = (form[k] || '').trim()
      if (v) body[k] = v
    }
    if (selectedVariant.value)
      body.credentialVariant = selectedVariant.value
    await $fetch(`/api/integrations/${props.integrationId}/credentials`, { method: 'POST', body })
    hasCredentials.value = true
    for (const k of Object.keys(form))
      delete form[k]
    emit('saved')
  } finally {
    saving.value = false
  }
}

async function disconnect() {
  disconnecting.value = true
  try {
    await $fetch(`/api/integrations/${props.integrationId}/credentials`, { method: 'DELETE' as any })
    hasCredentials.value = false
    emit('disconnected')
  } finally {
    disconnecting.value = false
  }
}

load()
</script>
