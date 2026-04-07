async (input) => {
  const googleNativeExports = {
    'application/vnd.google-apps.document': 'text/markdown',
    'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.google-apps.presentation': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.google-apps.drawing': 'image/svg+xml',
    'application/vnd.google-apps.script': 'application/vnd.google-apps.script+json',
  }
  const isTextLikeMimeType = (value) => {
    const mimeType = String(value || '').split(';', 1)[0].trim().toLowerCase()
    return mimeType.startsWith('text/')
      || mimeType.includes('json')
      || mimeType.includes('csv')
      || mimeType === 'application/xml'
      || mimeType === 'text/xml'
      || mimeType.endsWith('+xml')
      || mimeType.includes('javascript')
      || mimeType.includes('svg')
  }
  const resolveMimeType = async () => {
    if (typeof input.mimeType === 'string' && input.mimeType.trim())
      return input.mimeType.trim()

    const metaRes = await integration.fetch(`/files/${fileId}?fields=id,name,mimeType`)
    const meta = await metaRes.json()
    return meta?.mimeType || ''
  }
  const readTextContent = async (source) => {
    const res = await integration.fetch(source)
    const contentMimeType = res.headers?.get?.('content-type') || ''
    const content = await res.text()
    return { contentMimeType, content }
  }

  const fileId = encodeURIComponent(input.fileId)
  const mimeType = await resolveMimeType()

  if (!mimeType) {
    return {
      fileId: input.fileId,
      mimeType: null,
      content: null,
      message: 'Could not determine the Drive file MIME type.',
    }
  }

  if (mimeType === 'application/vnd.google-apps.folder') {
    return {
      fileId: input.fileId,
      mimeType,
      content: null,
      message: 'Folders do not have readable file content.',
    }
  }

  const isGoogleNative = mimeType.startsWith('application/vnd.google-apps.')
  const exportMimeType = isGoogleNative
    ? (typeof input.exportMimeType === 'string' && input.exportMimeType.trim())
        ? input.exportMimeType.trim()
        : googleNativeExports[mimeType] || null
    : null

  if (isGoogleNative && !exportMimeType) {
    return {
      fileId: input.fileId,
      mimeType,
      content: null,
      message: 'This Google-native file type does not have a configured export path for read_file_content.',
    }
  }

  const source = isGoogleNative
    ? `/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`
    : `/files/${fileId}?alt=media`

  if (isTextLikeMimeType(exportMimeType || mimeType)) {
    const textResult = await readTextContent(source)
    return {
      fileId: input.fileId,
      mimeType,
      contentMimeType: textResult.contentMimeType || exportMimeType || mimeType,
      content: textResult.content,
    }
  }

  const extracted = await utils.extractFileContent({
    auth: true,
    source,
    previewPages: input.previewPages || 0,
  })

  return {
    fileId: input.fileId,
    mimeType,
    contentMimeType: exportMimeType || mimeType,
    ...extracted,
  }
}
