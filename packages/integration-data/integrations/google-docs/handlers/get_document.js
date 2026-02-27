async (input) => {
  const { documentId, suggestionsViewMode, includeTabsAndSpaces } = input
  const params = new URLSearchParams()
  if (suggestionsViewMode)
    params.set('suggestionsViewMode', String(suggestionsViewMode))
  if (includeTabsAndSpaces !== undefined)
    params.set('includeTabsAndSpaces', String(includeTabsAndSpaces))
  const qs = params.toString()
  const path = `/documents/${encodeURIComponent(documentId)}${qs ? `?${qs}` : ''}`
  const res = await integration.fetch(path)
  return await res.json()
}
