async (input) => {
  const { documentId, findText, replaceText, matchCase } = input
  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {
    method: 'POST',
    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: Boolean(matchCase) }, replaceText } }] },
  })
  return await res.json()
}
