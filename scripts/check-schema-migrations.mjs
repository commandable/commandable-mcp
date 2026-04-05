#!/usr/bin/env node

import { execFileSync } from 'node:child_process'

const SCHEMA_PATH = 'packages/core/src/db/schema.ts'
const MIGRATIONS_PREFIX = 'packages/core/src/db/migrations/'
const ZERO_SHA = '0000000000000000000000000000000000000000'

function parseArgs(argv) {
  const parsed = new Map()
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith('--'))
      continue

    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      parsed.set(arg, 'true')
      continue
    }

    parsed.set(arg, next)
    index += 1
  }
  return parsed
}

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function tryRunGit(args) {
  try {
    return runGit(args)
  }
  catch {
    return null
  }
}

function resolveRange(args) {
  const base = args.get('--base')
    || process.env.MIGRATION_CHECK_BASE_SHA
    || ''
  const head = args.get('--head')
    || process.env.MIGRATION_CHECK_HEAD_SHA
    || 'HEAD'

  if (base && base !== ZERO_SHA)
    return { base, head }

  const mergeBase = tryRunGit(['merge-base', 'origin/main', 'HEAD'])
  if (mergeBase)
    return { base: mergeBase, head: 'HEAD' }

  const previousHead = tryRunGit(['rev-parse', 'HEAD~1'])
  if (previousHead)
    return { base: previousHead, head: 'HEAD' }

  return null
}

function getChangedFiles(range) {
  if (!range)
    return runGit(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD']).split('\n').filter(Boolean)

  return runGit([
    'diff',
    '--name-only',
    '--diff-filter=ACMR',
    range.base,
    range.head,
  ]).split('\n').filter(Boolean)
}

const args = parseArgs(process.argv.slice(2))
const range = resolveRange(args)
const changedFiles = getChangedFiles(range)

const schemaChanged = changedFiles.includes(SCHEMA_PATH)
const migrationsChanged = changedFiles.some(file => file.startsWith(MIGRATIONS_PREFIX))

if (!schemaChanged || migrationsChanged)
  process.exit(0)

const comparedRange = range
  ? `${range.base}..${range.head}`
  : 'working tree'

console.error(
  [
    'Detected a database schema change without a matching migration update.',
    '',
    `Compared range: ${comparedRange}`,
    `Changed schema file: ${SCHEMA_PATH}`,
    `Expected at least one changed file under: ${MIGRATIONS_PREFIX}`,
    '',
    'Run your migration generator, review the SQL, and commit the migration files with the schema change.',
  ].join('\n'),
)

process.exit(1)
