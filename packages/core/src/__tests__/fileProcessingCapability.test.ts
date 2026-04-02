import { describe, expect, it } from 'vitest'
import type { IntegrationData } from '../types.js'
import { applyFileProcessingCapabilityToIntegrations, type FileProcessingCapability } from '../integrations/fileProcessing.js'
import { loadIntegrationToolList } from '../integrations/dataLoader.js'

function makeDriveIntegration(): IntegrationData {
  return {
    id: 'drive-node-1',
    referenceId: 'drive_ref',
    type: 'google-drive',
    label: 'Drive Test',
    disabledTools: [],
  }
}

function capability(enabled: boolean): FileProcessingCapability {
  return {
    enabled,
    mode: 'auto',
    message: enabled ? 'enabled' : 'disabled',
    reason: enabled ? undefined : 'python_missing',
    installCommand: 'pip3 install -r packages/core/src/file-extractor/requirements.txt',
    dockerHint: 'Run Commandable with Docker.',
    pythonExecutable: 'python3',
    extractorScriptPath: '/tmp/extract_file.py',
  }
}

describe('file processing capability gating', () => {
  it('hides google-drive read_file_content from runtime and advertised tool lists when disabled', () => {
    const integrations = applyFileProcessingCapabilityToIntegrations([makeDriveIntegration()], capability(false))
    const integration = integrations[0]!
    const advertisedTools = loadIntegrationToolList(integration.type, {
      credentialVariant: integration.credentialVariant ?? undefined,
      toolsets: integration.enabledToolsets ?? undefined,
      maxScope: integration.maxScope ?? undefined,
      disabledTools: integration.disabledTools ?? undefined,
    })

    expect(integration.disabledTools).toContain('read_file_content')
    expect(advertisedTools.some(tool => tool.name === 'read_file_content')).toBe(false)
  })

  it('does not inject google-drive file-processing disables when capability is enabled', () => {
    const integrations = applyFileProcessingCapabilityToIntegrations([makeDriveIntegration()], capability(true))
    const integration = integrations[0]!

    expect(integration.disabledTools).not.toContain('read_file_content')
  })
})
