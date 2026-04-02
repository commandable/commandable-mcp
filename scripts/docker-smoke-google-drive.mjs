import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { execFile as execFileCb } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'
import { JWT } from 'google-auth-library'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const execFile = promisify(execFileCb)
const INTEGRATION_TEST_MARKER = 'Commandable Integration Test'
const DEFAULT_IMAGE = 'commandable-mcp:smoke'
const DEFAULT_PORT = Number(process.env.COMMANDABLE_SMOKE_PORT || '3300')
const DEFAULT_TIMEOUT_MS = 90_000
const DEFAULT_MCP_API_KEY = String(process.env.COMMANDABLE_SMOKE_API_KEY || 'commandable-docker-smoke-key').trim() || 'commandable-docker-smoke-key'
const FIXTURE_NAME = 'sample.pdf'
const FIXTURE_MIME_TYPE = 'application/pdf'
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, '..')
const INTEGRATION_DATA_DIR = resolve(REPO_ROOT, 'packages/integration-data')
const DRIVE_UPLOAD_SCOPES = ['https://www.googleapis.com/auth/drive']
const DRIVE_UPLOAD_FIELDS = 'id,name,mimeType,size,parents'

/** Respect https://no-color.org/ — set NO_COLOR=1 to disable ANSI. */
const useAnsi = !process.env.NO_COLOR && (process.stdout.isTTY || process.stderr.isTTY || process.env.FORCE_COLOR)
function ansi(code, s) {
  return useAnsi ? `\x1b[${code}m${s}\x1b[0m` : s
}
const bold = s => ansi('1', s)
const green = s => ansi('32', s)
const red = s => ansi('31', s)
const yellow = s => ansi('33', s)
const dim = s => ansi('2', s)

function printSmokeSuccessBanner() {
  const line = '══════════════════════════════════════════════════════════════════'
  console.log('')
  console.log(green(bold(line)))
  console.log(green(bold('  PASSED — Docker Google Drive smoke test')))
  console.log(green(bold(line)))
  console.log('')
}

async function printSmokeFailureBanner(error, containerStarted, containerName) {
  const line = '══════════════════════════════════════════════════════════════════'
  const msg = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : ''

  console.error('')
  console.error(red(bold(line)))
  console.error(red(bold('  FAILED — Docker Google Drive smoke test')))
  console.error(red(bold(line)))
  console.error('')
  console.error(red(bold('Reason')), red(msg))
  if (process.env.DEBUG_SMOKE && stack) {
    console.error('')
    console.error(dim(stack))
  }

  if (containerStarted) {
    const logs = await readContainerLogs(containerName)
    console.error('')
    console.error(yellow(bold('--- Container logs (for debugging) ---')))
    if (logs)
      console.error(logs)
    else
      console.error(dim('(empty)'))
    console.error('')
  }
  else {
    console.error('')
    console.error(dim('No container was started or it exited before logs could be read.'))
    console.error('')
  }
}

async function loadEnvFile(filePath, override = false) {
  if (!existsSync(filePath))
    return
  loadDotenv({ path: filePath, override })
}

async function loadSmokeEnv() {
  const explicit = String(process.env.INTEGRATION_TESTS_ENV_FILE || '').trim()
  if (explicit) {
    const resolved = isAbsolute(explicit) ? explicit : resolve(process.cwd(), explicit)
    await loadEnvFile(resolved, true)
    return
  }

  await loadEnvFile(resolve(REPO_ROOT, '.env.test'))
  await loadEnvFile(resolve(INTEGRATION_DATA_DIR, '.env.test'))
  await loadEnvFile(resolve(INTEGRATION_DATA_DIR, '.env.test.google'))
}

function parseArgs(argv) {
  const out = {
    image: DEFAULT_IMAGE,
    port: DEFAULT_PORT,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--image' && argv[i + 1]) {
      out.image = argv[++i]
      continue
    }
    if (arg === '--port' && argv[i + 1]) {
      out.port = Number(argv[++i])
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }

  if (!Number.isFinite(out.port) || out.port <= 0)
    throw new Error(`Invalid --port value: ${out.port}`)

  return out
}

function fixturePath() {
  return resolve(INTEGRATION_DATA_DIR, 'integrations/__tests__/fixtures/file-extraction', FIXTURE_NAME)
}

async function ensureFixtureReady() {
  const path = fixturePath()
  if (!existsSync(path))
    throw new Error(`Missing integration test fixture: ${path}`)
  const bytes = await readFile(path)
  if (!bytes.length) {
    throw new Error(`Integration test fixture is still an empty placeholder: ${path}. Replace it with a real file that contains "${INTEGRATION_TEST_MARKER}" in extractable text.`)
  }
  return path
}

function getCredentialConfig() {
  const serviceAccountJson = String(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '').trim()
  const subject = String(process.env.GOOGLE_IMPERSONATE_SUBJECT || '').trim()
  const token = String(process.env.GOOGLE_TOKEN || '').trim()

  if (serviceAccountJson) {
    return {
      credentialVariant: 'service_account',
      credentials: {
        serviceAccountJson,
        ...(subject ? { subject } : {}),
      },
    }
  }

  if (token) {
    return {
      credentialVariant: 'oauth_token',
      credentials: { token },
    }
  }

  throw new Error('Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_TOKEN before running the Docker smoke test.')
}

async function resolveDriveUploadToken(credentialConfig) {
  if (credentialConfig.credentialVariant === 'service_account') {
    const jwt = new JWT({
      email: JSON.parse(credentialConfig.credentials.serviceAccountJson).client_email,
      key: JSON.parse(credentialConfig.credentials.serviceAccountJson).private_key,
      scopes: DRIVE_UPLOAD_SCOPES,
      subject: credentialConfig.credentials.subject,
    })
    const res = await jwt.authorize()
    if (!res?.access_token)
      throw new Error('Failed to mint Google access token for Docker smoke upload.')
    return res.access_token
  }

  const token = String(credentialConfig.credentials.token || '').trim()
  if (!token)
    throw new Error('Missing GOOGLE_TOKEN for Docker smoke upload.')
  return token
}

async function uploadDriveFixture(args) {
  const bytes = await readFile(args.fixturePath)
  const boundary = `commandable-drive-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const metadata = JSON.stringify({
    name: args.fileName,
    parents: [args.parentId],
  })

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${FIXTURE_MIME_TYPE}\r\n\r\n`),
    bytes,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])

  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=${encodeURIComponent(DRIVE_UPLOAD_FIELDS)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  })

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    throw new Error(`Drive fixture upload failed (${res.status})${bodyText ? `: ${bodyText}` : ''}`)
  }

  return await res.json()
}

function parseToolResult(response) {
  const text = response?.content?.find?.(part => typeof part?.text === 'string')?.text
  if (!text)
    throw new Error(`Tool response did not include a text payload: ${JSON.stringify(response)}`)
  return JSON.parse(text)
}

async function createMcpClient(baseUrl, apiKey) {
  const transport = new StreamableHTTPClientTransport(
    new URL(`${baseUrl}/mcp/static`),
    { requestInit: { headers: { Authorization: `Bearer ${apiKey}` } } },
  )

  const client = new Client(
    { name: 'docker-smoke', version: '0.0.0' },
    { capabilities: {} },
  )

  // SSE GET errors are non-fatal; the server uses JSON-response mode.
  // AbortError / "SSE stream disconnected" fire when client.close() tears down the transport.
  transport.onerror = (err) => {
    const msg = String(err?.message || err)
    const benign
      = msg.includes('Failed to open SSE stream')
        || msg.includes('405')
        || msg.includes('AbortError')
        || msg.includes('aborted')
        || msg.includes('SSE stream disconnected')
    if (!benign)
      console.error('[mcp transport error]', msg)
  }

  await client.connect(transport)
  return { client, transport }
}

async function waitFor(check, timeoutMs, label) {
  const started = Date.now()
  let lastError = null

  while ((Date.now() - started) < timeoutMs) {
    try {
      return await check()
    }
    catch (error) {
      lastError = error
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  throw new Error(`${label} did not become ready within ${timeoutMs}ms.${lastError ? ` Last error: ${lastError.message}` : ''}`)
}

async function docker(args, options = {}) {
  return await execFile('docker', args, options)
}

async function readContainerLogs(containerName) {
  try {
    const { stdout, stderr } = await docker(['logs', containerName])
    return `${stdout}\n${stderr}`.trim()
  }
  catch {
    return ''
  }
}

async function main() {
  let exitCode = 0
  let containerName = ''
  let containerStarted = false
  let folderId = ''
  let uploadedId = ''
  let mcpClient = null
  let tempDir = null

  try {
  await loadSmokeEnv()
  const opts = parseArgs(process.argv.slice(2))
  const sourcePath = await ensureFixtureReady()
  const credentialConfig = getCredentialConfig()
  const uploadToken = await resolveDriveUploadToken(credentialConfig)
  const encryptionSecret = String(process.env.COMMANDABLE_ENCRYPTION_SECRET || 'docker-smoke-secret').trim() || 'docker-smoke-secret'
  const mcpApiKey = DEFAULT_MCP_API_KEY
  tempDir = await mkdtemp(join(tmpdir(), 'commandable-docker-smoke-'))
  const configPath = join(tempDir, 'commandable.config.json')
  containerName = `commandable-smoke-${Date.now()}`
  const baseUrl = `http://127.0.0.1:${opts.port}`

  const config = {
    mode: 'static',
    integrations: [
      {
        id: 'google-drive:smoke',
        referenceId: 'google-drive-smoke',
        type: 'google-drive',
        label: 'Google Drive Smoke',
        credentialVariant: credentialConfig.credentialVariant,
        maxScope: 'write',
        credentials: credentialConfig.credentials,
      },
    ],
  }

    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8')

    await docker([
      'run',
      '--detach',
      '--rm',
      '--name',
      containerName,
      '--publish',
      `${opts.port}:3000`,
      '--env',
      `COMMANDABLE_ENCRYPTION_SECRET=${encryptionSecret}`,
      '--env',
      `COMMANDABLE_BOOTSTRAP_API_KEY=${mcpApiKey}`,
      '--env',
      'COMMANDABLE_CONFIG_FILE=/app/commandable.config.json',
      '--volume',
      `${configPath}:/app/commandable.config.json:ro`,
      opts.image,
    ])
    containerStarted = true

    await waitFor(async () => {
      const res = await fetch(`${baseUrl}/health`)
      if (!res.ok)
        throw new Error(`Health check returned ${res.status}`)
      return true
    }, DEFAULT_TIMEOUT_MS, 'Docker health check')

    const status = await waitFor(async () => {
      const res = await fetch(`${baseUrl}/api/_commandable/status`)
      if (!res.ok)
        throw new Error(`Status check returned ${res.status}`)
      const json = await res.json()
      if (!json?.fileProcessing?.enabled)
        throw new Error(`fileProcessing.enabled was not true: ${JSON.stringify(json?.fileProcessing || null)}`)
      return json
    }, DEFAULT_TIMEOUT_MS, 'Docker file-processing status check')

    mcpClient = await createMcpClient(baseUrl, mcpApiKey)
    const { client } = mcpClient

    const toolList = await waitFor(async () => {
      const res = await client.listTools()
      const names = (res.tools || []).map(tool => tool.name)
      const createFolderTool = names.find(name => name.includes('google_drive__create_folder'))
      const getMetaTool = names.find(name => name.includes('google_drive__get_file_meta'))
      const readFileTool = names.find(name => name.includes('google_drive__read_file_content'))
      const deleteFileTool = names.find(name => name.includes('google_drive__delete_file'))
      if (!createFolderTool || !getMetaTool || !readFileTool || !deleteFileTool)
        throw new Error(`Drive smoke tools not available yet. Saw: ${names.join(', ')}`)
      return { createFolderTool, getMetaTool, readFileTool, deleteFileTool }
    }, DEFAULT_TIMEOUT_MS, 'Static MCP tool list')

    const folder = parseToolResult(await client.callTool({
      name: toolList.createFolderTool,
      arguments: { name: `Cmd Docker Smoke ${Date.now()}` },
    }))
    folderId = String(folder?.id || '')
    if (!folderId)
      throw new Error(`create_folder did not return a folder id: ${JSON.stringify(folder)}`)

    const uploaded = await uploadDriveFixture({
      token: uploadToken,
      parentId: folderId,
      fileName: FIXTURE_NAME,
      fixturePath: sourcePath,
    })
    uploadedId = String(uploaded?.id || '')
    if (!uploadedId)
      throw new Error(`Fixture upload did not return a file id: ${JSON.stringify(uploaded)}`)

    const meta = parseToolResult(await client.callTool({
      name: toolList.getMetaTool,
      arguments: { fileId: uploadedId },
    }))
    if (meta?.id !== uploadedId)
      throw new Error(`get_file_meta returned unexpected id: ${JSON.stringify(meta)}`)

    const readResult = parseToolResult(await client.callTool({
      name: toolList.readFileTool,
      arguments: { fileId: uploadedId, mimeType: meta?.mimeType },
    }))

    if (!String(readResult?.content || '').includes(INTEGRATION_TEST_MARKER))
      throw new Error(`read_file_content response did not include the integration test marker: ${JSON.stringify(readResult)}`)

    console.log(JSON.stringify({
      ok: true,
      image: opts.image,
      port: opts.port,
      fixture: FIXTURE_NAME,
      folderId,
      fileId: uploadedId,
      mimeType: meta?.mimeType || null,
      kind: readResult?.kind || null,
      fileProcessing: status?.fileProcessing || null,
    }, null, 2))
    printSmokeSuccessBanner()
  }
  catch (error) {
    exitCode = 1
    await printSmokeFailureBanner(error, containerStarted, containerName)
  }
  finally {
    if (mcpClient) {
      const { client } = mcpClient
      try {
        if (uploadedId) {
          const list = await client.listTools()
          const deleteTool = (list.tools || []).map(t => t.name).find(n => n.includes('google_drive__delete_file'))
          if (deleteTool)
            await client.callTool({ name: deleteTool, arguments: { fileId: uploadedId } })
        }
      }
      catch {}
      try {
        if (folderId) {
          const list = await client.listTools()
          const deleteTool = (list.tools || []).map(t => t.name).find(n => n.includes('google_drive__delete_file'))
          if (deleteTool)
            await client.callTool({ name: deleteTool, arguments: { fileId: folderId } })
        }
      }
      catch {}
      await client.close().catch(() => {})
    }
    try {
      if (containerStarted)
        await docker(['rm', '-f', containerName])
    }
    catch {}
    if (tempDir)
      await rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }

  process.exit(exitCode)
}

main().catch((error) => {
  console.error('')
  console.error(red(bold('══════════════════════════════════════════════════════════════════')))
  console.error(red(bold('  FAILED — Docker Google Drive smoke test (unexpected error)')))
  console.error(red(bold('══════════════════════════════════════════════════════════════════')))
  console.error('')
  console.error(red(error instanceof Error ? error.message : String(error)))
  if (process.env.DEBUG_SMOKE && error instanceof Error && error.stack)
    console.error(dim(error.stack))
  console.error('')
  process.exit(1)
})
