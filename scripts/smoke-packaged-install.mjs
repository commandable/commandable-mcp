#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import net from 'node:net'

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))

function run(command, args, options = {}) {
  const rendered = [command, ...args].join(' ')
  console.error(`\n$ ${rendered}`)
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: options.cwd || repoRoot,
    env: options.env || process.env,
  })
  if (result.status !== 0)
    process.exit(result.status || 1)
}

function getAvailablePort() {
  return new Promise((resolvePort, reject) => {
    const server = net.createServer()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Failed to allocate test port')))
        return
      }
      const { port } = address
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }
        resolvePort(port)
      })
    })
  })
}

function sanitizePackageNameForTarball(name) {
  return name.replace(/^@/, '').replace(/\//g, '-')
}

function getTarballPath(artifactsDir, packageName, version) {
  return join(artifactsDir, `${sanitizePackageNameForTarball(packageName)}-${version}.tgz`)
}

function getWorkspaceVersion(relativePkgPath) {
  const pkgPath = resolve(repoRoot, relativePkgPath)
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  return pkg.version
}

async function main() {
  const tmpBase = mkdtempSync(join(tmpdir(), 'commandable-packaged-smoke-'))
  const artifactsDir = join(tmpBase, 'artifacts')
  const smokeDir = join(tmpBase, 'smoke-project')
  const dataDir = join(tmpBase, 'data')
  mkdirSync(artifactsDir, { recursive: true })
  mkdirSync(smokeDir, { recursive: true })
  mkdirSync(dataDir, { recursive: true })

  const integrationVersion = getWorkspaceVersion('packages/integration-data/package.json')
  const coreVersion = getWorkspaceVersion('packages/core/package.json')
  const connectVersion = getWorkspaceVersion('packages/connect/package.json')
  const appVersion = getWorkspaceVersion('app/package.json')

  const integrationTarball = getTarballPath(artifactsDir, '@commandable/integration-data', integrationVersion)
  const coreTarball = getTarballPath(artifactsDir, '@commandable/mcp-core', coreVersion)
  const connectTarball = getTarballPath(artifactsDir, '@commandable/mcp-connect', connectVersion)
  const appTarball = getTarballPath(artifactsDir, '@commandable/mcp', appVersion)

  const port = String(await getAvailablePort())
  const smokeEnv = {
    ...process.env,
    COMMANDABLE_DATA_DIR: dataDir,
    COMMANDABLE_UI_PORT: port,
  }

  try {
    run('yarn', ['workspace', '@commandable/integration-data', 'pack', '--out', integrationTarball])
    run('yarn', ['workspace', '@commandable/mcp-core', 'pack', '--out', coreTarball])
    run('yarn', ['workspace', '@commandable/mcp-connect', 'pack', '--out', connectTarball])
    run('yarn', ['workspace', '@commandable/mcp', 'pack', '--out', appTarball])

    run('npm', ['init', '-y'], { cwd: smokeDir })
    run('npm', ['install', integrationTarball, coreTarball, connectTarball, appTarball], { cwd: smokeDir })

    run('npx', ['commandable-mcp', '--version'], { cwd: smokeDir, env: smokeEnv })
    run('npx', ['commandable-mcp-connect', '--version'], { cwd: smokeDir, env: smokeEnv })
    run('npx', ['commandable-mcp-connect', '--help'], { cwd: smokeDir, env: smokeEnv })
    run('npx', ['commandable-mcp', 'serve', '--restart'], { cwd: smokeDir, env: smokeEnv })
    run('npx', ['commandable-mcp', 'create'], { cwd: smokeDir, env: smokeEnv })
  }
  finally {
    spawnSync('npx', ['commandable-mcp', 'destroy', 'local', '--yes', '--keep-key'], {
      stdio: 'ignore',
      cwd: smokeDir,
      env: smokeEnv,
    })
    rmSync(tmpBase, { recursive: true, force: true })
  }

  console.error('\nPackaged smoke test completed successfully.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
