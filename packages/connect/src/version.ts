import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

type PackageJson = { version?: string }

const pkg = require('../package.json') as PackageJson

export const COMMANDABLE_CONNECT_VERSION: string = String(pkg.version || '0.0.0')
