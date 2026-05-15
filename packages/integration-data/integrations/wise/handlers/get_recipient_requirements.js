async (input) => {
  const res = await integration.get(`/v1/quotes/${encodeURIComponent(input.quoteId)}/account-requirements`)
  const responseBodyText = await res.text()
  const responseBodyTrimmed = responseBodyText.trim()
  const requirements = responseBodyTrimmed ? JSON.parse(responseBodyTrimmed) : null

  return {
    quoteId: input.quoteId,
    requirements,
  }
}
