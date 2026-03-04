import { z } from 'zod'

export const IntegrationConfigSchema = z.object({
  id: z.string().min(1).optional(),
  type: z.string().min(1),
  label: z.string().min(1).optional(),
  referenceId: z.string().min(1).optional(),
  spaceId: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  credentialId: z.string().min(1).optional(),
  credentialVariant: z.string().min(1).optional(),
  toolsets: z.array(z.string()).optional(),
  /** Cap the maximum scope tier. 'read' means only read tools; 'write' means read+write. */
  maxScope: z.enum(['read', 'write']).optional(),
  /** Individual tool names to block regardless of toolset or scope. */
  disabledTools: z.array(z.string()).optional(),
  config: z.record(z.string(), z.any()).optional(),
  credentials: z.record(z.string(), z.string()).optional(),
})

export const CommandableConfigSchema = z.object({
  spaceId: z.string().min(1).optional(),
  mode: z.enum(['static', 'create']).optional().default('static'),
  integrations: z.array(IntegrationConfigSchema).default([]),
})

export type CommandableConfig = z.infer<typeof CommandableConfigSchema>
export type IntegrationConfig = z.infer<typeof IntegrationConfigSchema>
