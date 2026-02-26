async (input) => {
  const { presentationId } = input
  const path = `/presentations/${encodeURIComponent(presentationId)}`
  const res = await integration.fetch(path)
  return await res.json()
}
