#!/usr/bin/env node
'use strict'

// Updates per-integration badge JSON files in a GitHub Gist.
// Called by the update-badges CI job after all integration matrix jobs finish.
// Requires: GIST_SECRET (PAT with gist scope).
// Gist ID and owner are read from scripts/badge-config.json.

const https = require('https')
const fs    = require('fs')
const path  = require('path')

const GIST_SECRET = process.env.GIST_SECRET

if (!GIST_SECRET) {
  console.log('GIST_SECRET not set — skipping badge update')
  process.exit(0)
}

const badgeConfigPath = path.join(__dirname, 'badge-config.json')
const badgeConfig     = JSON.parse(fs.readFileSync(badgeConfigPath, 'utf8'))
const BADGE_GIST_ID   = badgeConfig.gistId

if (!BADGE_GIST_ID || BADGE_GIST_ID === 'GIST_ID_PLACEHOLDER') {
  console.log('badge-config.json gistId not configured — skipping badge update')
  process.exit(0)
}

const integrations = [
  { name: 'github',          label: 'GitHub'         },
  { name: 'jira',            label: 'Jira'           },
  { name: 'notion',          label: 'Notion'         },
  { name: 'airtable',        label: 'Airtable'       },
  { name: 'trello',          label: 'Trello'         },
  { name: 'hubspot',         label: 'HubSpot'        },
  { name: 'confluence',      label: 'Confluence'     },
  { name: 'google-calendar', label: 'Google Calendar'},
  { name: 'google-gmail',    label: 'Gmail'          },
  { name: 'google-workspace', label: 'Google Workspace' },
  { name: 'sharepoint',       label: 'SharePoint'       },
]

function readResults(name) {
  const file = path.join('test-results', `test-results-${name}`, 'test-results.json')
  if (!fs.existsSync(file)) return null
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) }
  catch { return null }
}

function buildBadge(label, data) {
  if (!data) {
    return { schemaVersion: 1, label, message: 'no results', color: 'lightgrey' }
  }
  const passed  = data.numPassedTests  ?? 0
  const failed  = data.numFailedTests  ?? 0
  const skipped = data.numSkippedTests ?? 0
  const total   = data.numTotalTests   ?? 0

  if (total === 0 || (passed === 0 && failed === 0 && skipped > 0)) {
    return { schemaVersion: 1, label, message: 'untested', color: 'lightgrey' }
  }
  if (failed > 0) {
    return { schemaVersion: 1, label, message: `${passed}/${passed + failed} passed`, color: 'red' }
  }
  if (skipped > 0) {
    return { schemaVersion: 1, label, message: `${passed} passed (partial)`, color: 'yellow' }
  }
  return { schemaVersion: 1, label, message: `${passed} passed`, color: 'brightgreen' }
}

const files = {}
for (const { name, label } of integrations) {
  const data  = readResults(name)
  const badge = buildBadge(`${label} tests`, data)
  files[`test-${name}.json`] = { content: JSON.stringify(badge) }
  console.log(`${name.padEnd(16)} ${badge.message} (${badge.color})`)
}

const body = JSON.stringify({ files })

const options = {
  hostname: 'api.github.com',
  path:     `/gists/${BADGE_GIST_ID}`,
  method:   'PATCH',
  headers: {
    'Authorization':        `Bearer ${GIST_SECRET}`,
    'Content-Type':         'application/json',
    'User-Agent':           'commandable-badge-updater',
    'Content-Length':       Buffer.byteLength(body),
    'X-GitHub-Api-Version': '2022-11-28',
  },
}

const req = https.request(options, (res) => {
  let raw = ''
  res.on('data', chunk => { raw += chunk })
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('\nAll badges updated successfully.')
    } else {
      console.error(`\nFailed to update badges: HTTP ${res.statusCode}`)
      console.error(raw)
      process.exit(1)
    }
  })
})

req.on('error', (err) => { console.error(err); process.exit(1) })
req.write(body)
req.end()
