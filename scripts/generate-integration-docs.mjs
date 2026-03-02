#!/usr/bin/env node
// Generates per-integration README.md files from manifest + credentials data,
// and updates the integration table in the root README.md.
//
// Usage: node scripts/generate-integration-docs.mjs
// Run from the repo root.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const integrationsDir = resolve(root, 'packages/integration-data/integrations')

// Badge config — fill in scripts/badge-config.json after setting up the gist.
// See TESTING.md for setup instructions.
let badgeConfig = { gistOwner: null, gistId: null }
const badgeConfigPath = resolve(__dirname, 'badge-config.json')
if (existsSync(badgeConfigPath)) {
  const cfg = JSON.parse(readFileSync(badgeConfigPath, 'utf8'))
  if (cfg.gistOwner !== 'GIST_OWNER_PLACEHOLDER') badgeConfig.gistOwner = cfg.gistOwner
  if (cfg.gistId    !== 'GIST_ID_PLACEHOLDER')    badgeConfig.gistId    = cfg.gistId
}

// Display name overrides for integrations whose auto-capitalisation would be wrong.
const DISPLAY_NAMES = {
  'github':          'GitHub',
  'hubspot':         'HubSpot',
  'google-gmail':    'Gmail',
  'google-sheet':    'Google Sheets',
  'google-calendar': 'Google Calendar',
  'google-docs':     'Google Docs',
  'google-drive':    'Google Drive',
  'google-slides':   'Google Slides',
  'confluence':      'Confluence',
  'airtable':        'Airtable',
  'notion':          'Notion',
  'trello':          'Trello',
  'jira':            'Jira',
}

function getDisplayName(name) {
  return DISPLAY_NAMES[name] ?? name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function badgeUrl(integrationName) {
  const { gistOwner, gistId } = badgeConfig
  if (!gistOwner || !gistId) return null
  return `https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/${gistOwner}/${gistId}/raw/test-${integrationName}.json`
}

function truncate(str, max = 90) {
  if (!str) return ''
  str = str.replace(/\n/g, ' ').trim()
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

function scopeLabel(scope) {
  return scope === 'write' ? 'write' : scope === 'admin' ? 'admin' : 'read'
}

// ─── Per-integration README generator ────────────────────────────────────────

function generateIntegrationReadme(name, manifest, credentials) {
  const displayName = getDisplayName(name)
  const toolsets    = manifest.toolsets ?? {}
  const tools       = manifest.tools    ?? []
  const toolsetKeys = Object.keys(toolsets)
  const url         = badgeUrl(name)

  const lines = []

  // Header
  lines.push(`# ${displayName}`)
  lines.push('')
  lines.push(`**${tools.length} tools**${toolsetKeys.length ? ` across ${toolsetKeys.length} toolset${toolsetKeys.length > 1 ? 's' : ''}` : ''}`)
  lines.push('')

  // Badge
  if (url) {
    lines.push(`![${displayName} tests](${url})`)
    lines.push('')
  }

  // Credential variants
  if (credentials?.variants) {
    lines.push('## Credential variants')
    lines.push('')
    lines.push('| Variant | Label |')
    lines.push('|---|---|')
    for (const [key, variant] of Object.entries(credentials.variants)) {
      const isDefault = credentials.default === key ? ' _(default)_' : ''
      lines.push(`| \`${key}\` | ${variant.label}${isDefault} |`)
    }
    lines.push('')
  }

  // Toolsets
  if (toolsetKeys.length > 0) {
    lines.push('## Toolsets')
    lines.push('')
    lines.push('| Toolset | Description |')
    lines.push('|---|---|')
    for (const [key, ts] of Object.entries(toolsets)) {
      lines.push(`| \`${key}\` | ${ts.description ?? ts.label} |`)
    }
    lines.push('')
  }

  // Tools table
  lines.push('## Tools')
  lines.push('')
  if (toolsetKeys.length > 0) {
    lines.push('| Tool | Scope | Toolset | Description |')
    lines.push('|---|---|---|---|')
    for (const tool of tools) {
      const ts = tool.toolset ? `\`${tool.toolset}\`` : '—'
      lines.push(`| \`${tool.name}\` | ${scopeLabel(tool.scope)} | ${ts} | ${truncate(tool.description)} |`)
    }
  } else {
    lines.push('| Tool | Scope | Description |')
    lines.push('|---|---|---|')
    for (const tool of tools) {
      lines.push(`| \`${tool.name}\` | ${scopeLabel(tool.scope)} | ${truncate(tool.description)} |`)
    }
  }
  lines.push('')

  return lines.join('\n')
}

// ─── Root README table row ────────────────────────────────────────────────────

function buildRootTableRow(name, manifest) {
  const displayName = getDisplayName(name)
  const toolsets    = Object.keys(manifest.toolsets ?? {})
  const toolCount   = (manifest.tools ?? []).length
  const link        = `[${displayName}](packages/integration-data/integrations/${name}/)`
  const toolsetsStr = toolsets.length > 0 ? toolsets.map(t => `\`${t}\``).join(', ') : 'all tools'
  const url         = badgeUrl(name)
  const badge       = url ? `![${displayName} tests](${url})` : '—'

  return `| ${link} | ${toolCount} | ${toolsetsStr} | ${badge} |`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const integrationDirs = readdirSync(integrationsDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('.') && d.name !== '__tests__' && d.name !== 'README.md')
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(d => d.name)

const tableRows = []

for (const name of integrationDirs) {
  const dir          = resolve(integrationsDir, name)
  const manifestPath = resolve(dir, 'manifest.json')
  const credsPath    = resolve(dir, 'credentials.json')

  if (!existsSync(manifestPath)) {
    console.warn(`  skip ${name} — no manifest.json`)
    continue
  }

  const manifest    = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const credentials = existsSync(credsPath) ? JSON.parse(readFileSync(credsPath, 'utf8')) : null

  // Write per-integration README
  const readme    = generateIntegrationReadme(name, manifest, credentials)
  const outPath   = resolve(dir, 'README.md')
  writeFileSync(outPath, readme, 'utf8')
  console.log(`  wrote ${outPath.replace(root + '/', '')}`)

  tableRows.push(buildRootTableRow(name, manifest))
}

// ─── Update root README.md between sentinel comments ─────────────────────────

const rootReadmePath = resolve(root, 'README.md')
const rootReadme     = readFileSync(rootReadmePath, 'utf8')

const START = '<!-- INTEGRATION_TABLE_START -->'
const END   = '<!-- INTEGRATION_TABLE_END -->'

const header = '| Integration | Tools | Toolsets | Live Tests |\n|---|---|---|---|'
const table  = [START, header, ...tableRows, END].join('\n')

let updated
if (rootReadme.includes(START)) {
  updated = rootReadme.replace(new RegExp(`${START}[\\s\\S]*?${END}`), table)
} else {
  // Inject after "## Supported integrations" heading
  updated = rootReadme.replace(
    /^(## Supported integrations\s*\n)/m,
    `$1\n${table}\n`
  )
}

writeFileSync(rootReadmePath, updated, 'utf8')
console.log('  updated README.md integration table')
console.log(`\nDone. Generated READMEs for ${integrationDirs.length} integrations.`)
