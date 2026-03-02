import { IntegrationProxy } from '../../../server/src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../server/src/integrations/dataLoader.js'
import { pathToFileURL } from 'node:url'

type ToolDef = {
  name: string
  handlerCode: string
  handlerMode?: 'sandbox' | 'module'
  handlerPath?: string
}

type ToolSet = {
  read: ToolDef[]
  write: ToolDef[]
  admin: ToolDef[]
}

export function hasEnv(...keys: string[]) {
  const env = process.env as Record<string, string | undefined>
  return keys.every(k => Boolean(env[k] && String(env[k]).trim().length > 0))
}

export function safeCleanup(fn: () => Promise<any>) {
  return fn().catch(() => {})
}

export function createCredentialStore(getCredentials: () => Promise<any>) {
  return { getCredentials }
}

export function createIntegrationNode(type: string, opts?: { id?: string, label?: string, credentialId?: string, credentialVariant?: string }) {
  const id = opts?.id || `node-${type}`
  return {
    spaceId: 'ci',
    id,
    referenceId: id,
    type,
    label: opts?.label || type,
    connectionMethod: 'credentials',
    credentialId: opts?.credentialId || `${type}-creds`,
    credentialVariant: opts?.credentialVariant,
  } as any
}

export function createProxy(credentialStore: { getCredentials: () => Promise<any> }) {
  return new IntegrationProxy({ credentialStore })
}

function getTools(type: string, credentialVariant?: string): ToolSet {
  const tools = loadIntegrationTools(type, { credentialVariant })
  if (!tools)
    throw new Error(`Missing integration tools for '${type}'`)
  return tools as any
}

function compileTool(proxy: IntegrationProxy, node: any, tool: ToolDef) {
  const integration = { fetch: (path: string, init?: RequestInit) => proxy.call(node, path, init) }

  if (tool.handlerMode === 'module' && typeof tool.handlerPath === 'string' && tool.handlerPath.length) {
    let compiled: null | ((input: any) => Promise<any>) = null
    return async (input: any) => {
      if (!compiled) {
        const mod: any = await import(pathToFileURL(tool.handlerPath!).href)
        const factory = mod?.default
        if (typeof factory !== 'function')
          throw new Error(`Invalid module handler: missing default export factory (${tool.handlerPath})`)
        const handler = factory(integration)
        if (typeof handler !== 'function')
          throw new Error(`Invalid module handler: factory did not return a function (${tool.handlerPath})`)
        compiled = handler
      }
      return await compiled(input)
    }
  }

  const build = new Function('integration', `return (${tool.handlerCode});`)
  return build(integration) as (input: any) => Promise<any>
}

export function createToolbox(type: string, proxy: IntegrationProxy, node: any, credentialVariant?: string) {
  const tools = getTools(type, credentialVariant)

  const findTool = (scope: keyof ToolSet, name: string) => tools[scope].find(t => t.name === name)

  return {
    /** Returns true if the tool exists in this variant's toolset. */
    hasTool: (scope: keyof ToolSet, name: string) => !!findTool(scope, name),

    read: (name: string) => {
      const tool = findTool('read', name)
      if (!tool)
        throw new Error(`Missing read tool '${name}' for '${type}' (variant: ${credentialVariant ?? 'default'})`)
      return compileTool(proxy, node, tool)
    },
    write: (name: string) => {
      const tool = findTool('write', name)
      if (!tool)
        throw new Error(`Missing write tool '${name}' for '${type}' (variant: ${credentialVariant ?? 'default'})`)
      return compileTool(proxy, node, tool)
    },
    admin: (name: string) => {
      const tool = findTool('admin', name) || findTool('write', name) || findTool('read', name)
      if (!tool)
        throw new Error(`Missing admin tool '${name}' for '${type}' (variant: ${credentialVariant ?? 'default'})`)
      return compileTool(proxy, node, tool)
    },
  }
}
