async (input) => {
  const { presentationId, findText, replaceText, matchCase } = input
  const res = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}:batchUpdate`, {
    method: 'POST',
    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: Boolean(matchCase) }, replaceText } }] },
  })
  const out = await res.json()
  return out?.presentationId ? { ...out, applied: true } : { presentationId, applied: true, replies: out?.replies || [] }
}
