#!/usr/bin/env node

import { main } from './index.js'

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
