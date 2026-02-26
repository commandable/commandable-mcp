async (input) => {
  const { documentId } = input
  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)
  const doc = await res.json()
  return { documentId: doc?.documentId || documentId, body: doc?.body }
}
