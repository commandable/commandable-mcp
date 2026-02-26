async (input) => {
  const { documentId } = input
  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)
  const doc = await res.json()
  const content = doc?.body?.content || []
  let text = ''
  for (const el of content) {
    const paragraphs = el.paragraph ? [el.paragraph] : []
    for (const p of paragraphs) {
      for (const e of p.elements || []) {
        text += e.textRun?.content || ''
      }
      text += '\n'
    }
  }
  return { documentId: doc?.documentId || documentId, text }
}
