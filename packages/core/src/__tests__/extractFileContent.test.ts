import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSafeHandlerFromString } from '../integrations/sandbox.js'
import { buildSandboxUtils } from '../integrations/sandboxUtils.js'

function resolveCallback(
  maybeOpts: unknown,
  maybeCallback: unknown,
): (err: Error | null, result?: { stdout: string, stderr: string }) => void {
  return (typeof maybeCallback === 'function' ? maybeCallback : maybeOpts) as (err: Error | null, result?: { stdout: string, stderr: string }) => void
}

const execFileMock = vi.fn((file: string, args: string[], maybeOpts: unknown, maybeCallback?: unknown) => {
  const callback = resolveCallback(maybeOpts, maybeCallback)
  if (args.includes('-c')) {
    callback(null, { stdout: '', stderr: '' })
    return
  }
  const outputPath = args[args.indexOf('--output') + 1]
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, JSON.stringify({
    kind: 'pdf',
    content: 'Extracted body text',
    metadata: { pageCount: 3 },
  }))
  callback(null, { stdout: '', stderr: '' })
})

vi.mock('node:child_process', () => ({
  execFile: execFileMock,
}))

describe('extractFileContent utility', () => {
  const originalFetch = globalThis.fetch
  const originalFileProcessing = process.env.COMMANDABLE_FILE_PROCESSING
  const originalPython = process.env.COMMANDABLE_PYTHON

  afterEach(async () => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
    execFileMock.mockClear()
    if (originalFileProcessing === undefined) delete process.env.COMMANDABLE_FILE_PROCESSING
    else process.env.COMMANDABLE_FILE_PROCESSING = originalFileProcessing
    if (originalPython === undefined) delete process.env.COMMANDABLE_PYTHON
    else process.env.COMMANDABLE_PYTHON = originalPython
    const { resetFileProcessingCapabilityForTests } = await import('../integrations/fileProcessing.js')
    resetFileProcessingCapabilityForTests()
  })

  it('downloads a public/presigned absolute URL when auth is false', async () => {
    const { createExtractFileContent } = await import('../integrations/fileExtractor.js')
    const fetchSpy = vi.fn(async () => new Response('hello world', {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="report.pdf"',
      },
    }))
    globalThis.fetch = fetchSpy as any

    const util = createExtractFileContent(() => {
      throw new Error('getIntegration should not be called for auth=false')
    })

    const result = await util({ auth: false, source: 'https://files.example.com/report.pdf?sig=123' })

    expect(fetchSpy).toHaveBeenCalledWith('https://files.example.com/report.pdf?sig=123', { method: 'GET' })
    expect(result.kind).toBe('pdf')
    expect(result.content).toBe('Extracted body text')
  })

  it('uses integration auth for a relative source when auth is true', async () => {
    const { createExtractFileContent } = await import('../integrations/fileExtractor.js')
    const integrationFetch = vi.fn(async () => new Response('binary', {
      status: 200,
      headers: { 'content-type': 'application/pdf' },
    }))
    const util = createExtractFileContent(() => ({ fetch: integrationFetch }))

    const result = await util({ auth: true, integration: 'drive', source: '/files/abc?alt=media' })

    expect(integrationFetch).toHaveBeenCalledWith('/files/abc?alt=media', { method: 'GET' })
    expect(result.metadata?.pageCount).toBe(3)
  })

  it('uses integration auth for an absolute source when auth is true', async () => {
    const { createExtractFileContent } = await import('../integrations/fileExtractor.js')
    const integrationFetch = vi.fn(async () => new Response('binary', {
      status: 200,
      headers: { 'content-type': 'application/pdf' },
    }))
    const util = createExtractFileContent(() => ({ fetch: integrationFetch }))

    await util({ auth: true, integration: 'slack', source: 'https://files.slack.com/files-pri/T123/file.pdf' })

    expect(integrationFetch).toHaveBeenCalledWith('https://files.slack.com/files-pri/T123/file.pdf', { method: 'GET' })
  })

  it('injects extractFileContent into the sandbox utils object', async () => {
    const mockedUtil = vi.fn(async () => ({ kind: 'pdf', content: 'sandbox result' }))
    const utils = buildSandboxUtils([], { extractFileContent: mockedUtil })
    const handler = createSafeHandlerFromString(
      `async (_input) => {
        const result = await utils.extractFileContent({ auth: false, source: 'https://files.example.com/demo.pdf' })
        return { hasUtil: typeof utils.extractFileContent === 'function', result }
      }`,
      () => ({}),
      utils,
    )

    const res = await handler({})

    expect(res.success).toBe(true)
    expect(res.result?.hasUtil).toBe(true)
    expect(res.result?.result?.content).toBe('sandbox result')
  })

  it('cleans up its temporary workspace after extraction', async () => {
    const { createExtractFileContent } = await import('../integrations/fileExtractor.js')
    let outputPath = ''
    execFileMock.mockImplementation((_file: string, args: string[], maybeOpts: unknown, maybeCallback?: unknown) => {
      const callback = resolveCallback(maybeOpts, maybeCallback)
      if (args.includes('-c')) {
        callback(null, { stdout: '', stderr: '' })
        return
      }
      outputPath = args[args.indexOf('--output') + 1]
      mkdirSync(dirname(outputPath), { recursive: true })
      writeFileSync(outputPath, JSON.stringify({ kind: 'text', content: 'done' }))
      callback(null, { stdout: '', stderr: '' })
    })
    globalThis.fetch = vi.fn(async () => new Response('hello', {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    })) as any

    const util = createExtractFileContent(() => {
      throw new Error('getIntegration should not be called for auth=false')
    })

    await util({ auth: false, source: 'https://files.example.com/file.txt' })

    expect(outputPath).toBeTruthy()
    expect(existsSync(dirname(outputPath))).toBe(false)
  })

  it('returns a clear message when file processing is disabled by env', async () => {
    const { createExtractFileContent } = await import('../integrations/fileExtractor.js')
    process.env.COMMANDABLE_FILE_PROCESSING = 'off'
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as any

    const util = createExtractFileContent(() => {
      throw new Error('getIntegration should not be called')
    })

    await expect(util({ auth: false, source: 'https://files.example.com/demo.pdf' })).rejects.toThrow(
      /COMMANDABLE_FILE_PROCESSING=off/,
    )
    await expect(util({ auth: false, source: 'https://files.example.com/demo.pdf' })).rejects.toThrow(
      /pip3 install -r packages\/core\/src\/file-extractor\/requirements.txt/,
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns a clear message when python is missing', async () => {
    const { createExtractFileContent } = await import('../integrations/fileExtractor.js')
    execFileMock.mockImplementationOnce((_file: string, _args: string[], maybeOpts: unknown, maybeCallback?: unknown) => {
      const callback = resolveCallback(maybeOpts, maybeCallback)
      const error: NodeJS.ErrnoException = new Error('spawn python3 ENOENT')
      error.code = 'ENOENT'
      callback(error)
    })
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as any

    const util = createExtractFileContent(() => {
      throw new Error('getIntegration should not be called')
    })

    await expect(util({ auth: false, source: 'https://files.example.com/demo.pdf' })).rejects.toThrow(
      /requires Python 3/,
    )
    await expect(util({ auth: false, source: 'https://files.example.com/demo.pdf' })).rejects.toThrow(
      /Run Commandable with Docker/,
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns a clear message when markitdown is missing', async () => {
    const { createExtractFileContent } = await import('../integrations/fileExtractor.js')
    execFileMock.mockImplementationOnce((_file: string, _args: string[], maybeOpts: unknown, maybeCallback?: unknown) => {
      const callback = resolveCallback(maybeOpts, maybeCallback)
      const error: Error & { stderr?: string } = new Error('probe failed')
      error.stderr = 'ModuleNotFoundError: No module named \'markitdown\''
      callback(error)
    })
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as any

    const util = createExtractFileContent(() => {
      throw new Error('getIntegration should not be called')
    })

    await expect(util({ auth: false, source: 'https://files.example.com/demo.pdf' })).rejects.toThrow(
      /MarkItDown/,
    )
    await expect(util({ auth: false, source: 'https://files.example.com/demo.pdf' })).rejects.toThrow(
      /pip3 install -r packages\/core\/src\/file-extractor\/requirements.txt/,
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
