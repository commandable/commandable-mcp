import { z } from 'zod'

export const IntegrationConfigSchema = z.object({
  id: z.string().min(1).optional(),
  type: z.string().min(1),
  label: z.string().min(1).optional(),
  referenceId: z.string().min(1).optional(),
  spaceId: z.string().min(1).optional(),
  credentialId: z.string().min(1).optional(),
  config: z.record(z.string(), z.any()).optional(),
  credentials: z.record(z.string(), z.string()).optional(),
})

export const CommandableConfigSchema = z.object({
  spaceId: z.string().min(1).optional(),
  integrations: z.array(IntegrationConfigSchema).default([]),
})

export type CommandableConfig = z.infer<typeof CommandableConfigSchema>
export type IntegrationConfig = z.infer<typeof IntegrationConfigSchema>
