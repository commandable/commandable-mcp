async (input) => {
  const { documentId, documentStyle, fields } = input
  const res = await integration.fetch(`https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`, {
    method: 'POST',
    body: { requests: [{ updateDocumentStyle: { documentStyle, fields: fields || Object.keys(documentStyle || {}).join(',') } }] },
  })
  return await res.json()
}
