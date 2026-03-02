#!/usr/bin/env node
'use strict'

// Updates per-integration badge JSON files in a GitHub Gist.
// Called by the update-badges CI job after all integration matrix jobs finish.
// Requires: GIST_SECRET (PAT with gist scope), BADGE_GIST_ID (target gist ID).

const https = require('https')
const fs    = require('fs')
const path  = require('path')

const GIST_SECRET  = process.env.GIST_SECRET
const BADGE_GIST_ID = process.env.BADGE_GIST_ID

if (!GIST_SECRET || !BADGE_GIST_ID) {
  console.log('GIST_SECRET or BADGE_GIST_ID not set — skipping badge update')
  process.exit(0)
}

const integrations = [
  { name: 'github',          label: 'GitHub'         },
  { name: 'jira',            label: 'Jira'           },
  { name: 'notion',          label: 'Notion'         },
  { name: 'airtable',        label: 'Airtable'       },
  { name: 'trello',          label: 'Trello'         },
  { name: 'hubspot',         label: 'HubSpot'        },
  { name: 'google-calendar', label: 'Google Calendar'},
  { name: 'google-docs',     label: 'Google Docs'   },
  { name: 'google-drive',    label: 'Google Drive'  },
  { name: 'google-gmail',    label: 'Gmail'          },
  { name: 'google-sheet',    label: 'Google Sheets' },
  { name: 'google-slides',   label: 'Google Slides' },
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
    return { schemaVersion: 1, label, message: 'skipped', color: 'lightgrey' }
  }
  if (failed > 0) {
    return { schemaVersion: 1, label, message: `${passed}/${passed + failed} passed`, color: 'red' }
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
