import { IntegrationProxy } from '../../../core/src/integrations/proxy.js'
import { loadIntegrationTools } from '../../../core/src/integrations/dataLoader.js'
import { createSafeHandlerFromString } from '../../../core/src/integrations/sandbox.js'
import { buildSandboxUtils } from '../../../core/src/integrations/sandboxUtils.js'
import { createGetIntegration } from '../../../core/src/integrations/getIntegration.js'
import { createExtractFileContent } from '../../../core/src/integrations/fileExtractor.js'

type ToolDef = {
  name: string
  handlerCode: string
  utils?: string[]
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
  const getIntegration = createGetIntegration([node], proxy)
  const wrapper = `async (input) => {\n  const integration = getIntegration('${String(node?.id || 'node')}');\n  const __inner = ${tool.handlerCode};\n  return await __inner(input);\n}`
  const utils = buildSandboxUtils(Array.isArray(tool.utils) ? tool.utils : undefined, {
    extractFileContent: createExtractFileContent(getIntegration),
  })
  const safeHandler = createSafeHandlerFromString(wrapper, () => integration, utils)
  return async (input: any) => {
    const res = await safeHandler(input)
    if (!res.success)
      throw res.result
    return res.result
  }
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
