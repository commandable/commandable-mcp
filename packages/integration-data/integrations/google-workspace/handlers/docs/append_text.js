async (input) => {
  const { documentId, text } = input
  // Get doc to find end index
  const metaRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)
  const meta = await metaRes.json()
  const endIndex = meta?.body?.content?.[meta.body.content.length - 1]?.endIndex || 1
  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {
    method: 'POST',
    body: { requests: [{ insertText: { text, location: { index: endIndex - 1 } } }] },
  })
  return await res.json()
}
