<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'Commandable MCP'
const description = 'One MCP server for all your apps. Connect GitHub, Notion, Google, Trello and more to any AI assistant — Claude Desktop, Cursor, Cline — in under 5 minutes.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary'
})
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="flex items-center gap-4">
          <AppLogo class="w-auto h-6 shrink-0" />
        </NuxtLink>

        <nav class="flex items-center gap-1 ml-4">
          <UButton to="/integrations" icon="i-lucide-plug" variant="ghost" color="neutral" size="sm">
            Integrations
          </UButton>
        </nav>
      </template>

      <template #right>
        <UColorModeButton />

        <UButton
          to="https://github.com/commandable/commandable-mcp"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          © {{ new Date().getFullYear() }} Commandable
        </p>
      </template>

      <template #right>
        <UButton
          to="https://github.com/commandable/commandable-mcp"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </UApp>
</template>
