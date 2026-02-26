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

      <div class="flex flex-col md:flex-row gap-3 md:items-end">
        <UFormField label="Type">
          <USelect v-model="selectedType" :items="catalogTypes" placeholder="Select…" class="w-72" />
        </UFormField>

        <UButton :disabled="!selectedType || adding" @click="add">
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
            <div class="text-xs text-muted truncate">{{ i.type }} · {{ i.referenceId }}</div>
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
          <div v-if="credConfig?.hintMarkdown" class="text-sm text-muted whitespace-pre-wrap">
            {{ credConfig.hintMarkdown }}
          </div>

          <div class="space-y-3">
            <UFormField
              v-for="k in credentialKeys"
              :key="k"
              :label="k"
              hint="You can enter env:VARNAME"
            >
              <UInput v-model="credentialsForm[k]" placeholder="env:MY_TOKEN or actual value" />
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
  </UContainer>
</template>

<script setup lang="ts">
type Integration = {
  id: string
  type: string
  referenceId: string
  label: string
}

const { data: catalog } = await useFetch<any[]>('/api/catalog')
const { data: integrations, pending, error, refresh } = await useFetch<Integration[]>('/api/integrations')

const catalogTypes = computed(() => (catalog.value || []).map(i => ({ label: i.type, value: i.type })))
const selectedType = ref<string | undefined>(undefined)
const adding = ref(false)

const credentialStatus = reactive<Record<string, boolean>>({})

watchEffect(async () => {
  if (!integrations.value) return
  for (const i of integrations.value) {
    if (credentialStatus[i.id] !== undefined) continue
    const res = await $fetch<{ hasCredentials: boolean }>(`/api/integrations/${i.id}/credentials-status`).catch(() => null)
    credentialStatus[i.id] = !!res?.hasCredentials
  }
})

async function add() {
  if (!selectedType.value) return
  adding.value = true
  try {
    await $fetch('/api/integrations', { method: 'POST', body: { type: selectedType.value } })
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

const credConfig = ref<any | null>(null)
const credConfigPending = ref(false)
const credConfigError = ref<any | null>(null)

const credentialKeys = computed(() => {
  const schema = credConfig.value?.schema
  const props = schema?.properties || {}
  return Object.keys(props)
})

async function openCredentials(i: Integration) {
  activeIntegration.value = i
  for (const k of Object.keys(credentialsForm))
    delete credentialsForm[k]
  credentialsModalOpen.value = true
  credConfig.value = null
  credConfigError.value = null
  credConfigPending.value = true
  try {
    credConfig.value = await $fetch(`/api/integrations/${i.id}/credentials-config`)
  }
  catch (e) {
    credConfigError.value = e
  }
  finally {
    credConfigPending.value = false
  }
}

async function saveCredentials() {
  if (!activeIntegration.value) return
  savingCreds.value = true
  try {
    const body: Record<string, string> = {}
    for (const k of credentialKeys.value) {
      const v = (credentialsForm[k] || '').trim()
      if (v) body[k] = v
    }
    await $fetch(`/api/integrations/${activeIntegration.value.id}/credentials`, { method: 'POST', body })
    const res = await $fetch<{ hasCredentials: boolean }>(`/api/integrations/${activeIntegration.value.id}/credentials-status`)
    credentialStatus[activeIntegration.value.id] = !!res?.hasCredentials
    credentialsModalOpen.value = false
  }
  finally {
    savingCreds.value = false
  }
}
</script>

