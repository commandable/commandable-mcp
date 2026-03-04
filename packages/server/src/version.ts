import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

type PackageJson = { version?: string }

// This file is compiled to dist/version.js, so ../package.json resolves to the
// package root package.json both in-repo and when installed from npm.
const pkg = require('../package.json') as PackageJson

export const COMMANDABLE_VERSION: string = String(pkg.version || '0.0.0')

