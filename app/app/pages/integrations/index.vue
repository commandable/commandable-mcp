<script setup lang="ts">
interface Integration {
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

const { data: integrations, pending, error, refresh } = await useFetch<Integration[]>('/api/integrations')
const healthStatus = reactive<Record<string, string>>({})
const showAddModal = ref(false)

watchEffect(async () => {
  if (!integrations.value)
    return
  for (const i of integrations.value) {
    if (healthStatus[i.id] !== undefined)
      continue
    const res = await $fetch<{ health_status: string | null }>(`/api/integrations/${i.id}/credentials-status`).catch(() => null)
    healthStatus[i.id] = res?.health_status ?? 'disconnected'
  }
})

async function toggleEnabled(integ: Integration, enabled: boolean) {
  await $fetch('/api/integrations', {
    method: 'POST',
    body: { ...integ, enabled },
  })
  await refresh()
}

function onIntegrationCreated(id: string) {
  navigateTo(`/integrations/${id}`)
}
</script>

<template>
  <UContainer class="py-10 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold">
          Integrations
        </h1>
        <p class="text-sm text-muted">
          Manage your connected services.
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        @click="showAddModal = true"
      >
        Add Integration
      </UButton>
    </div>

    <div
      v-if="pending"
      class="text-sm text-muted py-8 text-center"
    >
      Loading…
    </div>
    <div
      v-else-if="error"
      class="text-sm text-red-600 py-8 text-center"
    >
      Failed to load integrations.
    </div>
    <div
      v-else-if="!integrations?.length"
      class="py-16 text-center space-y-4"
    >
      <div class="text-muted text-sm">
        No integrations yet.
      </div>
      <UButton
        icon="i-lucide-plus"
        variant="soft"
        @click="showAddModal = true"
      >
        Add your first integration
      </UButton>
    </div>
    <div
      v-else
      class="space-y-2"
    >
      <NuxtLink
        v-for="integ in integrations"
        :key="integ.id"
        :to="`/integrations/${integ.id}`"
        class="flex items-center gap-4 p-4 rounded-lg border border-[var(--ui-border)] hover:bg-[var(--ui-bg-elevated)] transition-colors group"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="font-medium truncate">{{ integ.label }}</span>
            <UBadge
              size="xs"
              color="neutral"
              variant="subtle"
            >
              {{ integ.type }}
            </UBadge>
            <UBadge
              v-if="integ.maxScope === 'read'"
              size="xs"
              color="warning"
              variant="soft"
            >
              Read-only
            </UBadge>
          </div>
          <div class="mt-1 flex items-center gap-2 flex-wrap">
            <span
              v-if="healthStatus[integ.id] !== undefined"
              class="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded"
              :class="{
                'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400': healthStatus[integ.id] === 'connected',
                'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400': healthStatus[integ.id] === 'invalid_credentials' || healthStatus[integ.id] === 'disconnected',
              }"
            >
              <span
                class="inline-block w-1.5 h-1.5 rounded-full"
                :class="{
                  'bg-green-500': healthStatus[integ.id] === 'connected',
                  'bg-red-500': healthStatus[integ.id] === 'invalid_credentials' || healthStatus[integ.id] === 'disconnected',
                }"
              />
              <template v-if="healthStatus[integ.id] === 'connected'">Connected</template>
              <template v-else-if="healthStatus[integ.id] === 'invalid_credentials'">Invalid credentials</template>
              <template v-else>Not connected</template>
            </span>
            <span
              v-if="integ.enabledToolsets?.length"
              class="text-xs text-muted"
            >
              {{ integ.enabledToolsets.length }} toolset{{ integ.enabledToolsets.length === 1 ? '' : 's' }}
            </span>
            <span
              v-if="integ.disabledTools?.length"
              class="text-xs text-muted"
            >
              {{ integ.disabledTools.length }} tool{{ integ.disabledTools.length === 1 ? '' : 's' }} blocked
            </span>
          </div>
        </div>

        <div
          class="flex items-center gap-3"
          @click.prevent.stop
        >
          <USwitch
            :model-value="integ.enabled !== false"
            @update:model-value="toggleEnabled(integ, $event)"
          />
        </div>

        <UIcon
          name="i-lucide-chevron-right"
          class="text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        />
      </NuxtLink>
    </div>

    <AddIntegrationModal
      v-model:open="showAddModal"
      @created="onIntegrationCreated"
    />
  </UContainer>
</template>
