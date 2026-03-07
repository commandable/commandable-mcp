import { describe, expect, it } from 'vitest'
import { makeClaudeCodeAddCommand, makeReadModeConfig } from '../cli/index.js'

describe('CLI create/connect helpers', () => {
  it('creates package Claude Code add command', () => {
    const cmd = makeClaudeCodeAddCommand('package')
    expect(cmd).toBe('claude mcp add commandable -- npx -y @commandable/mcp create-mode')
  })

  it('creates local Claude Code add command', () => {
    const prevArgv = process.argv
    process.argv = ['node', '/tmp/commandable/dist/cli/bin.js']
    try {
      const cmd = makeClaudeCodeAddCommand('local')
      expect(cmd).toBe('claude mcp add commandable -- node /tmp/commandable/dist/cli/bin.js create-mode')
    }
    finally {
      process.argv = prevArgv
    }
  })

  it('includes relevant env vars in Claude Code add command', () => {
    const prevArgv = process.argv
    const prevDataDir = process.env.COMMANDABLE_DATA_DIR
    const prevUiPort = process.env.COMMANDABLE_UI_PORT
    process.argv = ['node', '/tmp/commandable/dist/cli/bin.js']
    process.env.COMMANDABLE_DATA_DIR = '/tmp/dev state'
    process.env.COMMANDABLE_UI_PORT = '23433'
    try {
      const cmd = makeClaudeCodeAddCommand('local')
      expect(cmd).toBe("claude mcp add commandable -e 'COMMANDABLE_DATA_DIR=/tmp/dev state' -e COMMANDABLE_UI_PORT=23433 -- node /tmp/commandable/dist/cli/bin.js create-mode")
    }
    finally {
      process.argv = prevArgv
      if (prevDataDir === undefined) delete process.env.COMMANDABLE_DATA_DIR
      else process.env.COMMANDABLE_DATA_DIR = prevDataDir
      if (prevUiPort === undefined) delete process.env.COMMANDABLE_UI_PORT
      else process.env.COMMANDABLE_UI_PORT = prevUiPort
    }
  })

  it('creates package read-mode config', () => {
    expect(makeReadModeConfig('package')).toEqual({
      mcpServers: {
        commandable: {
          command: 'npx',
          args: ['-y', '@commandable/mcp'],
        },
      },
    })
  })

  it('creates local read-mode config', () => {
    const prevArgv = process.argv
    process.argv = ['node', '/tmp/commandable/dist/cli/bin.js']
    try {
      expect(makeReadModeConfig('local')).toEqual({
        mcpServers: {
          commandable: {
            command: 'node',
            args: ['/tmp/commandable/dist/cli/bin.js'],
          },
        },
      })
    }
    finally {
      process.argv = prevArgv
    }
  })
})
