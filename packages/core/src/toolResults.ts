import type { ToolRunResult } from './types.js'

export interface HoistedToolArtifact {
  type: 'image'
  mimeType: string
  data?: string
  url?: string
  title?: string
}

const hoistedArtifactsByResult = new WeakMap<ToolRunResult, HoistedToolArtifact[]>()

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function attachHoistedArtifacts(result: ToolRunResult, artifacts: HoistedToolArtifact[]): ToolRunResult {
  if (artifacts.length)
    hoistedArtifactsByResult.set(result, artifacts)
  return result
}

export function getHoistedArtifacts(result: ToolRunResult): HoistedToolArtifact[] {
  return hoistedArtifactsByResult.get(result) ?? []
}

export function hoistExtractFileContentArtifacts(result: unknown): {
  cleanedResult: unknown
  artifacts: HoistedToolArtifact[]
} {
  if (!result || typeof result !== 'object' || Array.isArray(result))
    return { cleanedResult: result, artifacts: [] }

  const images = Array.isArray((result as Record<string, unknown>).pageImages)
    ? ((result as Record<string, unknown>).pageImages as unknown[]).filter((value): value is string => typeof value === 'string')
    : []

  if (!images.length)
    return { cleanedResult: result, artifacts: [] }

  const { pageImages: _dropped, ...rest } = result as Record<string, unknown>
  return {
    cleanedResult: rest,
    artifacts: images.map(data => ({
      type: 'image',
      mimeType: 'image/jpeg',
      data,
    })),
  }
}
