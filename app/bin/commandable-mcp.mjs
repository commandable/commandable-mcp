#!/usr/bin/env node

import { main } from './cli.mjs'

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
