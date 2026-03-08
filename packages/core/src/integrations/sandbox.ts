import { URL, URLSearchParams } from 'node:url'
import vm from 'node:vm'
import * as zodLib from 'zod'
import type { SandboxUtils } from './sandboxUtils.js'

function makeSyntheticFromObject(pkg: any, context: vm.Context): vm.Module {
  const exportNames = Array.from(new Set(['default', ...Object.keys(pkg)]))
  return new vm.SyntheticModule(exportNames, function () {
    this.setExport('default', pkg)
    for (const key of Object.keys(pkg))
      this.setExport(key, pkg[key])
  }, { context })
}

const ALLOWED_PACKAGES: Record<string, any> = {
  zod: zodLib,
}

export async function loadWorkflowModule(source: string, getIntegration?: Function): Promise<any> {
  const realConsole = console
  const isolatedConsole: any = {
    log: (...args: any[]) => realConsole.log(...args),
    info: (...args: any[]) => realConsole.info(...args),
    warn: (...args: any[]) => realConsole.warn(...args),
    error: (...args: any[]) => realConsole.error(...args),
    debug: (...args: any[]) => realConsole.debug?.(...args) ?? realConsole.log(...args),
  }

  const safeAtob = (base64String: string): string => {
    if (typeof base64String !== 'string')
      throw new TypeError('atob expects a string')
    try {
      const buffer = Buffer.from(base64String, 'base64')
      return buffer.toString('binary')
    }
    catch {
      throw new Error('Invalid base64 string')
    }
  }

  const safeEscape = (str: string): string => {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
      return `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    })
  }

  const safeBtoa = (binaryString: string): string => {
    if (typeof binaryString !== 'string')
      throw new TypeError('btoa expects a string')
    try {
      const buffer = Buffer.from(binaryString, 'binary')
      return buffer.toString('base64')
    }
    catch {
      throw new Error('Invalid binary string')
    }
  }

  const context = vm.createContext({
    console: isolatedConsole,
    getIntegration: getIntegration || (() => ({ fetch: undefined, post: undefined })),
    URL,
    URLSearchParams,
    atob: safeAtob,
    btoa: safeBtoa,
    escape: safeEscape,
    unescape,
    decodeURIComponent,
    encodeURIComponent,
    fetch: undefined,
    integrationFetch: undefined,
    process: undefined,
    require: undefined,
    Buffer: undefined,
    global: undefined,
    globalThis: undefined,
    setImmediate: undefined,
    setInterval: undefined,
    setTimeout: undefined,
    clearImmediate: undefined,
    clearInterval: undefined,
    clearTimeout: undefined,
    eval: undefined,
    Function: undefined,
  })

  const userModule = new vm.SourceTextModule(source, { context })
  const moduleCache: Record<string, vm.Module> = {}

  await userModule.link((specifier) => {
    const pkg = ALLOWED_PACKAGES[specifier]
    if (!pkg)
      throw new Error(`Import "${specifier}" is not allowed in workflow modules.`)
    if (!moduleCache[specifier])
      moduleCache[specifier] = makeSyntheticFromObject(pkg, context)
    return moduleCache[specifier]
  })

  await userModule.evaluate({ timeout: 5000 })
  return userModule.namespace
}

export function createSafeHandlerFromString(
  handlerString: string,
  getIntegration: Function,
  utils?: SandboxUtils,
): (args: any) => Promise<{ success: boolean, result: any, logs: string[] }> {
  const realConsole = console
  const isolatedConsole: any = {
    log: (...args: any[]) => realConsole.log(...args),
    info: (...args: any[]) => realConsole.info(...args),
    warn: (...args: any[]) => realConsole.warn(...args),
    error: (...args: any[]) => realConsole.error(...args),
    debug: (...args: any[]) => realConsole.debug?.(...args) ?? realConsole.log(...args),
  }

  const safeAtob = (base64String: string): string => {
    if (typeof base64String !== 'string')
      throw new TypeError('atob expects a string')
    try {
      const buffer = Buffer.from(base64String, 'base64')
      return buffer.toString('binary')
    }
    catch {
      throw new Error('Invalid base64 string')
    }
  }

  const safeBtoa = (binaryString: string): string => {
    if (typeof binaryString !== 'string')
      throw new TypeError('btoa expects a string')
    try {
      const buffer = Buffer.from(binaryString, 'binary')
      return buffer.toString('base64')
    }
    catch {
      throw new Error('Invalid binary string')
    }
  }

  const safeEscape = (str: string): string => {
    return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
      return `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    })
  }

  const context = vm.createContext({
    console: isolatedConsole,
    getIntegration,
    utils: utils || {},
    module: {},
    URL,
    URLSearchParams,
    atob: safeAtob,
    btoa: safeBtoa,
    escape: safeEscape,
    unescape,
    decodeURIComponent,
    encodeURIComponent,
    fetch: undefined,
    integrationFetch: undefined,
    process: undefined,
    require: undefined,
    Buffer: undefined,
    global: undefined,
    globalThis: undefined,
    setImmediate: undefined,
    setInterval: undefined,
    setTimeout: undefined,
    clearImmediate: undefined,
    clearInterval: undefined,
    clearTimeout: undefined,
    eval: undefined,
    Function: undefined,
  })

  const code = `module.exports = async function(input) { return (${handlerString})(input) }`
  const script = new vm.Script(code)
  script.runInContext(context)
  return withLogging((context.module as any).exports, isolatedConsole)
}

function withLogging(handler: (args: any) => Promise<any>, vmConsole: any) {
  function safeSerializeForLog(value: any): string {
    if (typeof value === 'string')
      return value
    try {
      if (value && typeof value === 'object' && typeof value.json === 'function' && typeof value.text === 'function') {
        const resp = value
        const summary: any = {
          type: 'FetchResponse',
          ok: !!resp.ok,
          status: resp.status,
          statusText: resp.statusText,
          url: resp.url,
          bodyUsed: !!resp.bodyUsed,
        }
        return JSON.stringify(summary)
      }
      return JSON.stringify(value)
    }
    catch {
      try { return String(value) }
      catch { return '[Unserializable]' }
    }
  }

  return async function wrappedHandler(args: any) {
    const logs: string[] = []
    const originalLog = vmConsole.log
    try {
      vmConsole.log = (...args2: any[]) => {
        const line = args2.map(a => safeSerializeForLog(a)).join(' ')
        if (logs.join('\n').length < 10_000)
          logs.push(line)
        originalLog.apply(vmConsole, args2)
      }

      const result = await handler(args)
      return { success: true, result, logs }
    }
    catch (err: any) {
      logs.push(err?.stack || String(err))
      // Serialize Error objects into plain objects so JSON.stringify captures all fields
      // including message (which is non-enumerable on Error).
      const result = (err && typeof err === 'object')
        ? {
            ...err,
            message: err.message,
            ...(err.statusCode !== undefined ? { statusCode: err.statusCode } : {}),
            ...(err.data !== undefined ? { data: err.data } : {}),
          }
        : err
      return { success: false, result, logs }
    }
    finally {
      vmConsole.log = originalLog
    }
  }
}

