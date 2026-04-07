import { existsSync, statSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { execFile as execFileCb } from 'node:child_process'
import { promisify } from 'node:util'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const execFile = promisify(execFileCb)

const SCRIPT = fileURLToPath(new URL('../file-extractor/extract_file.py', import.meta.url))

function fixturePath(name: string): string {
  return fileURLToPath(
    new URL(
      `../../../integration-data/integrations/__tests__/fixtures/file-extraction/${name}`,
      import.meta.url,
    ),
  )
}

function fixtureReady(name: string): boolean {
  const p = fixturePath(name)
  return existsSync(p) && statSync(p).size > 0
}

async function runExtractor(inputPath: string, extraArgs: string[] = []): Promise<any> {
  const tmp = await mkdtemp(join(tmpdir(), 'cmdbl-py-test-'))
  try {
    const out = join(tmp, 'result.json')
    await execFile('python3', [SCRIPT, '--input', inputPath, '--output', out, ...extraArgs], {
      maxBuffer: 50 * 1024 * 1024,
    })
    const raw = await readFile(out, 'utf8')
    return JSON.parse(raw)
  }
  finally {
    await rm(tmp, { recursive: true, force: true }).catch(() => {})
  }
}

const MSG_INTEGRATION_TEST_MARKER = 'Commandable Integration Test'

const msgOrSkip = fixtureReady('sample.msg') ? describe : describe.skip
const zipOrSkip = fixtureReady('sample.zip') ? describe : describe.skip
const emlOrSkip = fixtureReady('sample.eml') ? describe : describe.skip

msgOrSkip('extract_file.py — MSG extraction', () => {
  let result: any

  it('extracts the MSG and returns expected shape', async () => {
    result = await runExtractor(fixturePath('sample.msg'))
    expect(result.kind).toBe('msg')
    expect(typeof result.content).toBe('string')
    expect(result.content.length).toBeGreaterThan(0)
    expect(result.metadata).toBeTruthy()
  }, 60000)

  it('surfaces subject and sender in metadata', async () => {
    result ??= await runExtractor(fixturePath('sample.msg'))
    expect(typeof result.metadata.subject).toBe('string')
    expect(result.metadata.subject.length).toBeGreaterThan(0)
    expect(result.metadata.sender).toBeTruthy()
  }, 60000)

  it('reports attachment count and names', async () => {
    result ??= await runExtractor(fixturePath('sample.msg'))
    expect(result.metadata.attachmentCount).toBeGreaterThan(0)
    expect(Array.isArray(result.metadata.attachmentNames)).toBe(true)
    expect(result.metadata.attachmentNames.length).toBeGreaterThan(0)
  }, 60000)

  it('includes email header block in content', async () => {
    result ??= await runExtractor(fixturePath('sample.msg'))
    expect(result.content).toMatch(/From:|Date:/i)
  }, 60000)

  it('recursively extracts attachment content containing integration test marker', async () => {
    result ??= await runExtractor(fixturePath('sample.msg'))
    expect(result.content).toContain(MSG_INTEGRATION_TEST_MARKER)
  }, 60000)
})

emlOrSkip('extract_file.py — EML extraction', () => {
  let result: any

  it('extracts the EML and returns expected shape', async () => {
    result = await runExtractor(fixturePath('sample.eml'))
    expect(result.kind).toBe('eml')
    expect(typeof result.content).toBe('string')
    expect(result.content.length).toBeGreaterThan(0)
    expect(result.metadata).toBeTruthy()
  }, 60000)

  it('surfaces subject and sender in metadata', async () => {
    result ??= await runExtractor(fixturePath('sample.eml'))
    expect(typeof result.metadata.subject).toBe('string')
    expect(result.metadata.subject.length).toBeGreaterThan(0)
    expect(result.metadata.sender).toBeTruthy()
  }, 60000)

  it('reports attachment count and names', async () => {
    result ??= await runExtractor(fixturePath('sample.eml'))
    expect(result.metadata.attachmentCount).toBeGreaterThan(0)
    expect(Array.isArray(result.metadata.attachmentNames)).toBe(true)
    expect(result.metadata.attachmentNames.length).toBeGreaterThan(0)
  }, 60000)

  it('includes email header block in content', async () => {
    result ??= await runExtractor(fixturePath('sample.eml'))
    expect(result.content).toMatch(/From:|Date:/i)
  }, 60000)

  it('recursively extracts attachment content containing integration test marker', async () => {
    result ??= await runExtractor(fixturePath('sample.eml'))
    expect(result.content).toContain(MSG_INTEGRATION_TEST_MARKER)
  }, 60000)
})

zipOrSkip('extract_file.py — ZIP extraction', () => {
  let result: any

  it('extracts the ZIP and returns expected shape', async () => {
    result = await runExtractor(fixturePath('sample.zip'))
    expect(result.kind).toBe('zip')
    expect(typeof result.content).toBe('string')
    expect(result.content.length).toBeGreaterThan(0)
    expect(result.metadata).toBeTruthy()
  }, 60000)

  it('reports file count and names', async () => {
    result ??= await runExtractor(fixturePath('sample.zip'))
    expect(result.metadata.fileCount).toBeGreaterThan(0)
    expect(Array.isArray(result.metadata.fileNames)).toBe(true)
    expect(result.metadata.fileNames.length).toBe(result.metadata.fileCount)
  }, 60000)

  it('includes section headers for each file in content', async () => {
    result ??= await runExtractor(fixturePath('sample.zip'))
    expect(result.content).toMatch(/^## /m)
  }, 60000)

  it('recursively extracts file content containing integration test marker', async () => {
    result ??= await runExtractor(fixturePath('sample.zip'))
    expect(result.content).toContain(MSG_INTEGRATION_TEST_MARKER)
  }, 60000)
})
