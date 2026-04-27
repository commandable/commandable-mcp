async (input) => {
  const path = `/api.xro/2.0/${encodeURIComponent(input.resourceType)}/${encodeURIComponent(input.resourceId)}/Attachments/${encodeURIComponent(input.fileName)}`
  if (input.tenantId)
    throw new Error('read_attachment_content currently supports Custom Connections only because the shared file extractor cannot pass xero-tenant-id yet.')
  const extracted = await utils.extractFileContent({
    auth: true,
    source: path,
  })
  return {
    fileName: input.fileName,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    ...extracted,
  }
}
