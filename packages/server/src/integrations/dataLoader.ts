import type { JSONSchema7 } from 'json-schema'
import type { ToolData } from '../types.js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface IntegrationCredentialConfig {
  schema: JSONSchema7
  injection: {
    headers?: Record<string, string>
    query?: Record<string, string>
  }
}

interface ToolRef {
  name: string
  description: string
  inputSchema: string
  handler: string
  scope?: 'read' | 'write' | 'admin'
}

type FlatTools = ToolRef[]

interface DisplayCardRef {
  name: string
  description: string
  inputSchema: string
  component: string
}

export interface DisplayCardData {
  name: string
  description: string
  inputSchema: JSONSchema7
  component: string
}

interface Manifest {
  name: string
  version?: string
  baseUrl?: string
  tools: FlatTools
  displayCards?: DisplayCardRef[]
}

function integrationDataRoot(): string {
  // Allow overriding for consumers (tests, packaged CLI, etc.)
  return process.env.COMMANDABLE_INTEGRATION_DATA_DIR
    ? resolve(process.env.COMMANDABLE_INTEGRATION_DATA_DIR)
    : resolve(process.cwd(), 'integration-data')
}

function integrationDir(type: string): string {
  return resolve(integrationDataRoot(), type)
}

function readJsonFile(path: string): any {
  const content = readFileSync(path, 'utf8')
  return JSON.parse(content)
}

function ensureSchemaObject(schema: any): any {
  if (!schema)
    return {}
  if (typeof schema === 'string') {
    try { return JSON.parse(schema) }
    catch { return {} }
  }
  return schema
}

export function loadIntegrationManifest(type: string): Manifest | null {
  const dir = integrationDir(type)
  const manifestPath = resolve(dir, 'manifest.json')
  if (!existsSync(manifestPath))
    return null
  return readJsonFile(manifestPath)
}

export function loadIntegrationPrompt(type: string): string | null {
  const dir = integrationDir(type)
  const promptPath = resolve(dir, 'prompt.md')
  if (!existsSync(promptPath))
    return null
  try {
    return readFileSync(promptPath, 'utf8')
  }
  catch {
    return null
  }
}

function materializeTool(type: string, ref: ToolRef): ToolData {
  const dir = integrationDir(type)
  const schemaPath = resolve(dir, ref.inputSchema)
  const handlerPath = resolve(dir, ref.handler)

  const schema = readJsonFile(schemaPath)
  const handlerCode = readFileSync(handlerPath, 'utf8').trim()

  return {
    name: ref.name,
    description: ref.description,
    inputSchema: ensureSchemaObject(schema),
    handlerCode,
  }
}

export function loadIntegrationDisplayCards(type: string): DisplayCardData[] {
  const manifest = loadIntegrationManifest(type)
  if (!manifest?.displayCards?.length)
    return []
  const dir = integrationDir(type)
  return manifest.displayCards.map((ref) => {
    const schemaPath = resolve(dir, ref.inputSchema)
    const schema = existsSync(schemaPath) ? ensureSchemaObject(readJsonFile(schemaPath)) : {}
    return {
      name: ref.name,
      description: ref.description,
      inputSchema: schema as JSONSchema7,
      component: ref.component,
    }
  })
}

export function loadIntegrationTools(type: string): { read: ToolData[], write: ToolData[], admin: ToolData[] } | null {
  const manifest = loadIntegrationManifest(type)
  if (!manifest)
    return null

  const flat = manifest.tools as FlatTools
  const readRefs: ToolRef[] = []
  const writeRefs: ToolRef[] = []
  const adminRefs: ToolRef[] = []
  for (const t of flat) {
    const scope = t.scope || 'read'
    if (scope === 'read') readRefs.push(t)
    else if (scope === 'write') writeRefs.push(t)
    else if (scope === 'admin') adminRefs.push(t)
    else readRefs.push(t)
  }
  const read = readRefs.map(t => materializeTool(type, t))
  const write = writeRefs.map(t => materializeTool(type, t))
  const admin = adminRefs.map(t => materializeTool(type, t))
  return { read, write, admin }
}

export function loadIntegrationCredentialConfig(type: string): IntegrationCredentialConfig | null {
  const dir = integrationDir(type)
  const path = resolve(dir, 'credentials.json')
  if (!existsSync(path))
    return null

  try {
    const raw = readJsonFile(path)
    const schema = ensureSchemaObject(raw?.schema) as JSONSchema7
    const injection = raw?.injection || {}
    const cfg: IntegrationCredentialConfig = {
      schema,
      injection: {
        headers: injection?.headers || undefined,
        query: injection?.query || undefined,
      },
    }
    return cfg
  }
  catch {
    return null
  }
}

