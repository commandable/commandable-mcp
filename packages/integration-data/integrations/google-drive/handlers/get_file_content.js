async (input) => {
  const fileId = encodeURIComponent(input.fileId)
  const googleExportMap = {
    'application/vnd.google-apps.document': 'text/plain',
    'application/vnd.google-apps.spreadsheet': 'text/csv',
    'application/vnd.google-apps.presentation': 'text/plain',
    'application/vnd.google-apps.drawing': 'image/svg+xml',
    'application/vnd.google-apps.script': 'application/vnd.google-apps.script+json',
  }
  const exportMimeType = input.exportMimeType
    || (input.mimeType ? googleExportMap[input.mimeType] : null)
    || null

  let res
  if (exportMimeType) {
    res = await integration.fetch(`/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`)
  }
  else {
    res = await integration.fetch(`/files/${fileId}?alt=media`)
  }

  const contentType = res.headers?.get?.('content-type') || ''
  const isText = contentType.startsWith('text/')
    || contentType.includes('json')
    || contentType.includes('csv')
    || contentType.includes('xml')
    || contentType.includes('javascript')

  if (isText) {
    const content = await res.text()
    return { fileId: input.fileId, mimeType: contentType, content }
  }

  // Binary content: inform the agent it needs a text export
  return {
    fileId: input.fileId,
    mimeType: contentType,
    content: null,
    message: `Binary content (${contentType}). To get readable text, provide exportMimeType='text/plain' for documents, 'text/csv' for spreadsheets, or 'text/html'. For PDFs and images this is not possible via export.`,
  }
}
