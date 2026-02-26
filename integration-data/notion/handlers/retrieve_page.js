async (input) => {
  const res = await integration.fetch(`/pages/${encodeURIComponent(input.page_id)}`)
  return await res.json()
}
