import type { ExecutableTool, IntegrationData } from '../types.js'
import type { IntegrationProxy } from './proxy.js'
import { loadIntegrationDisplayCards, loadIntegrationTools } from './dataLoader.js'
import { makeIntegrationToolName, sanitizeJsonSchema } from './tools.js'
import { createSafeHandlerFromString } from './sandbox.js'
import { createGetIntegration } from './getIntegration.js'
import { pathToFileURL } from 'node:url'

type Scope = 'read' | 'write' | 'admin'

export interface BuildToolsOptions {
  requireWriteConfirmation?: boolean
}

export function buildToolsByIntegration(
  spaceId: string,
  integrations: IntegrationData[],
  proxy: IntegrationProxy,
  opts: BuildToolsOptions = {},
): Record<string, { read: ExecutableTool[], write: ExecutableTool[], admin: ExecutableTool[] }> {
  const { requireWriteConfirmation = false } = opts
  const getIntegration = createGetIntegration(integrations, proxy)
  const toolsByIntegration: Record<string, { read: ExecutableTool[], write: ExecutableTool[], admin: ExecutableTool[] }> = {}

  for (const integ of integrations) {
    const loaded = loadIntegrationTools(integ.type, {
      credentialVariant: integ.credentialVariant ?? undefined,
      toolsets: integ.enabledToolsets ?? undefined,
    })
    const read = loaded?.read || []
    const write = loaded?.write || []
    const admin = loaded?.admin || []

    const buildActions = (arr: any[], scope: Scope): ExecutableTool[] => arr.map((t) => {
      const humanize = (s: string) => (s || '')
        .replace(/_/g, ' ')
        .split(/\s+/g)
        .filter(Boolean)
        .map(w => w.length ? `${w[0]!.toUpperCase()}${w.slice(1).toLowerCase()}` : w)
        .join(' ')

      const rawSchema = typeof t.inputSchema === 'string' ? JSON.parse(t.inputSchema) : t.inputSchema
      const schemaObj = sanitizeJsonSchema(rawSchema)
      const toolName = makeIntegrationToolName(integ.type, t.name, integ.id)
      const description = `[${integ.label} | ${integ.type}] ${t.description}`

      // Module handlers run in-process (real ES modules). Everything else runs sandboxed.
      if (t.handlerMode === 'module' && typeof t.handlerPath === 'string' && t.handlerPath.length) {
        let moduleFactory: any | null = null
        const run: ExecutableTool['run'] = async (input: any) => {
          try {
            if (!moduleFactory) {
              const mod: any = await import(pathToFileURL(t.handlerPath).href)
              moduleFactory = mod?.default
              if (typeof moduleFactory !== 'function')
                throw new Error(`Invalid module handler: missing default export factory (${t.handlerPath})`)
            }

            const integration = getIntegration(integ.id)
            const handler = moduleFactory(integration)
            if (typeof handler !== 'function')
              throw new Error(`Invalid module handler: default export did not return a function (${t.handlerPath})`)

            const result = await handler(input)
            return { success: true, result, logs: [] }
          }
          catch (err: any) {
            return { success: false, result: err, logs: [err?.stack || String(err)] }
          }
        }

        return {
          name: toolName,
          displayName: `${t.displayName || humanize(t.name)}`,
          description,
          inputSchema: schemaObj,
          run,
          integrations: [integ],
          requireConfirmation: scope === 'write' && requireWriteConfirmation,
        }
      }

      const wrapper = `async (input) => {\n  const integration = getIntegration('${integ.id}');\n  const __inner = ${t.handlerCode};\n  return await __inner(input);\n}`
      const safeHandler = createSafeHandlerFromString(wrapper, getIntegration)
      return {
        name: toolName,
        displayName: `${t.displayName || humanize(t.name)}`,
        description,
        inputSchema: schemaObj,
        run: safeHandler,
        integrations: [integ],
        requireConfirmation: scope === 'write' && requireWriteConfirmation,
      }
    })

    toolsByIntegration[integ.referenceId] = {
      read: buildActions(read, 'read'),
      write: buildActions(write, 'write'),
      admin: buildActions(admin, 'admin'),
    }
  }

  return toolsByIntegration
}

export function buildDisplayCardTools(
  spaceId: string,
  integrations: IntegrationData[],
): Record<string, ExecutableTool[]> {
  const displayToolsByIntegration: Record<string, ExecutableTool[]> = {}

  for (const integ of integrations) {
    const cards = loadIntegrationDisplayCards(integ.type)
    if (!cards.length)
      continue

    const tools: ExecutableTool[] = []
    for (const card of cards) {
      const schemaObj = sanitizeJsonSchema(card.inputSchema)
      const toolName = makeIntegrationToolName(integ.type, card.name, integ.id)
      const description = `[${integ.label} | ${integ.type}] ${card.description}`

      tools.push({
        name: toolName,
        displayName: card.component,
        description,
        inputSchema: schemaObj,
        run: async (args: any) => ({ success: true, result: args, logs: [] }),
      })
    }

    displayToolsByIntegration[integ.referenceId] = tools
  }

  return displayToolsByIntegration
}

