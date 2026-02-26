<template>
  <UContainer class="py-10 space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold">
          Commandable MCP
        </h1>
        <p class="text-sm text-muted">
          Local management UI for integrations + credentials (stored encrypted in SQLite/Postgres).
        </p>
      </div>

      <div class="flex gap-2">
        <UButton to="/integrations" icon="i-lucide-plug" color="primary">
          Integrations
        </UButton>
        <UButton to="/settings" icon="i-lucide-settings" variant="soft" color="neutral">
          Settings
        </UButton>
      </div>
    </div>

    <UCard>
      <template #header>
        <div class="font-medium">
          Connected integrations
        </div>
      </template>

      <div v-if="pending" class="text-sm text-muted">
        Loading…
      </div>
      <div v-else-if="error" class="text-sm text-red-600">
        Failed to load integrations.
      </div>
      <div v-else class="space-y-2">
        <div v-if="!integrations?.length" class="text-sm text-muted">
          None yet. Add one on the Integrations page.
        </div>

        <div v-for="i in integrations" :key="i.id" class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="font-medium truncate">
              {{ i.label }}
            </div>
            <div class="text-xs text-muted truncate">
              {{ i.type }} · {{ i.referenceId }}
            </div>
          </div>
          <UButton to="/integrations" size="sm" variant="soft" color="neutral">
            Manage
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="font-medium">
          Next step: connect your MCP client
        </div>
      </template>
      <div class="text-sm text-muted space-y-2">
        <div>Run the setup wizard, then paste the printed snippet into Claude Desktop / Cursor.</div>
        <pre class="text-xs bg-muted/40 p-3 rounded overflow-auto">npx @commandable/mcp init</pre>
        <div class="text-xs">To run the server manually (rare): <span class="font-mono">npx @commandable/mcp</span></div>
      </div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
const { data: integrations, pending, error } = await useFetch('/api/integrations')
</script>
