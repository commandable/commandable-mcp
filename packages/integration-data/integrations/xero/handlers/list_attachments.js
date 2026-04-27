async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const path = `/api.xro/2.0/${encodeURIComponent(input.resourceType)}/${encodeURIComponent(input.resourceId)}/Attachments`
  const res = await integration.get(path, { headers })
  const data = await res.json()
  const attachments = Array.isArray(data?.Attachments) ? data.Attachments : []
  return {
    attachments: attachments.map(attachment => ({
      attachmentId: attachment.AttachmentID,
      fileName: attachment.FileName,
      mimeType: attachment.MimeType,
      contentLength: attachment.ContentLength,
      includeOnline: attachment.IncludeOnline,
      url: attachment.Url,
    })),
    count: attachments.length,
  }
}
