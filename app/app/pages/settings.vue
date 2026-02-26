<template>
  <UContainer class="py-10 space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-semibold">
          Settings
        </h1>
        <p class="text-sm text-muted">
          Local runtime configuration.
        </p>
      </div>

      <div class="flex gap-2">
        <UButton to="/" icon="i-lucide-home" variant="soft" color="neutral">
          Dashboard
        </UButton>
        <UButton to="/integrations" icon="i-lucide-plug" variant="soft" color="neutral">
          Integrations
        </UButton>
      </div>
    </div>

    <UCard>
      <template #header>
        <div class="font-medium">
          Optional environment variables
        </div>
      </template>

      <div class="space-y-3 text-sm">
        <div>
          <div class="font-mono">COMMANDABLE_ENCRYPTION_SECRET</div>
          <div class="text-muted">Provide an encryption secret via env instead of using the local key file.</div>
        </div>
        <div>
          <div class="font-mono">COMMANDABLE_DATA_DIR</div>
          <div class="text-muted">Override where local data is stored (default: ~/.commandable/).</div>
        </div>
        <div>
          <div class="font-mono">DATABASE_URL</div>
          <div class="text-muted">If set, uses Postgres. Otherwise uses SQLite.</div>
        </div>
        <div>
          <div class="font-mono">COMMANDABLE_MCP_SQLITE_PATH</div>
          <div class="text-muted">Optional SQLite file path override (default: ~/.commandable/credentials.sqlite).</div>
        </div>
        <div>
          <div class="font-mono">COMMANDABLE_INTEGRATION_DATA_DIR</div>
          <div class="text-muted">Optional override for integration manifests/handlers directory.</div>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>

