import { z } from 'zod'

const envRefString = z.string()

export const IntegrationConfigSchema = z.object({
  id: z.string().min(1).optional(),
  type: z.string().min(1),
  label: z.string().min(1).optional(),
  referenceId: z.string().min(1).optional(),
  spaceId: z.string().min(1).optional(),
  credentialId: z.string().min(1).optional(),
  config: z.record(z.string(), z.any()).optional(),
  credentials: z.record(z.string(), envRefString).optional(),
})

export const ServerConfigSchema = z.object({
  port: z.number().int().positive().optional(),
  encryptionSecret: envRefString.optional(),
  requireAuth: z.boolean().optional(),
}).optional()

export const CommandableConfigSchema = z.object({
  spaceId: z.string().min(1).optional(),
  server: ServerConfigSchema,
  integrations: z.array(IntegrationConfigSchema).default([]),
})

export type CommandableConfig = z.infer<typeof CommandableConfigSchema>
export type IntegrationConfig = z.infer<typeof IntegrationConfigSchema>

