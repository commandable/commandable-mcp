import { IntegrationProxy } from '../../../core/src/integrations/proxy.js'
import { loadIntegrationManifest, loadIntegrationTools } from '../../src/loader.js'
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

type LiveToolCoverage = {
  record: (scope: keyof ToolSet, name: string) => void
}

export function createLiveToolCoverage(opts: {
  integrationName: string
  credentialVariant?: string
  skippedTools?: Record<string, string>
}) {
  const invoked = new Set<string>()
  const skippedTools = opts.skippedTools || {}

  return {
    record: (_scope: keyof ToolSet, name: string) => {
      invoked.add(name)
    },
    assertComplete: () => {
      const manifest = loadIntegrationManifest(opts.integrationName)
      if (!manifest)
        throw new Error(`Missing integration manifest for '${opts.integrationName}'`)

      const relevantTools = (manifest.tools as any[]).filter((tool) => {
        if (!tool.credentialVariants || !Array.isArray(tool.credentialVariants) || tool.credentialVariants.length === 0)
          return true
        return opts.credentialVariant ? tool.credentialVariants.includes(opts.credentialVariant) : false
      })
      const manifestToolNames = relevantTools.map(tool => String(tool.name))
      const manifestToolSet = new Set(manifestToolNames)

      const skipsWithoutReasons = Object.entries(skippedTools)
        .filter(([, reason]) => !String(reason || '').trim())
        .map(([name]) => name)
      if (skipsWithoutReasons.length) {
        throw new Error(
          `Live tool coverage skips must include reasons: ${skipsWithoutReasons.join(', ')}`,
        )
      }

      const unknownSkips = Object.keys(skippedTools).filter(name => !manifestToolSet.has(name))
      if (unknownSkips.length)
        throw new Error(`Live tool coverage skips unknown tools: ${unknownSkips.join(', ')}`)

      const missing = manifestToolNames.filter(name => !invoked.has(name) && !skippedTools[name])
      if (missing.length) {
        throw new Error(
          [
            `Missing live tool coverage for ${opts.integrationName}: ${missing.join(', ')}`,
            'Execute each tool in a live test, or add an explicit skippedTools reason.',
          ].join('\n'),
        )
      }

      return {
        invoked: [...invoked].sort(),
        skipped: Object.entries(skippedTools)
          .map(([name, reason]) => ({ name, reason }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }
    },
  }
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
  const getIntegration = createGetIntegration([node], proxy)
  const wrapper = `async (input) => {\n  const integration = getIntegration('${String(node?.id || 'node')}');\n  const __inner = ${tool.handlerCode};\n  return await __inner(input);\n}`
  const utils = buildSandboxUtils(Array.isArray(tool.utils) ? tool.utils : undefined, {
    extractFileContent: createExtractFileContent(getIntegration, node?.id),
  })
  const safeHandler = createSafeHandlerFromString(wrapper, getIntegration, utils)
  return async (input: any) => {
    const res = await safeHandler(input)
    if (!res.success)
      throw res.result
    return res.result
  }
}

export function createToolbox(type: string, proxy: IntegrationProxy, node: any, credentialVariant?: string, opts?: { coverage?: LiveToolCoverage }) {
  const tools = getTools(type, credentialVariant)

  const findTool = (scope: keyof ToolSet, name: string) => tools[scope].find(t => t.name === name)
  const compileCoveredTool = (scope: keyof ToolSet, name: string, tool: ToolDef) => {
    const run = compileTool(proxy, node, tool)
    return async (input: any) => {
      const result = await run(input)
      opts?.coverage?.record(scope, name)
      return result
    }
  }

  return {
    /** Returns true if the tool exists in this variant's toolset. */
    hasTool: (scope: keyof ToolSet, name: string) => !!findTool(scope, name),

    read: (name: string) => {
      const tool = findTool('read', name)
      if (!tool)
        throw new Error(`Missing read tool '${name}' for '${type}' (variant: ${credentialVariant ?? 'default'})`)
      return compileCoveredTool('read', name, tool)
    },
    write: (name: string) => {
      const tool = findTool('write', name)
      if (!tool)
        throw new Error(`Missing write tool '${name}' for '${type}' (variant: ${credentialVariant ?? 'default'})`)
      return compileCoveredTool('write', name, tool)
    },
    admin: (name: string) => {
      const tool = findTool('admin', name) || findTool('write', name) || findTool('read', name)
      if (!tool)
        throw new Error(`Missing admin tool '${name}' for '${type}' (variant: ${credentialVariant ?? 'default'})`)
      return compileCoveredTool('admin', name, tool)
    },
  }
}
