async (input) => {
  const res = await integration.get(`/v1/quotes/${encodeURIComponent(input.quoteId)}/account-requirements`)
  const requirements = await res.json()

  return {
    quoteId: input.quoteId,
    requirements,
  }
}
