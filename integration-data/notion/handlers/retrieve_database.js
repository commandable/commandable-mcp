async (input) => {
  const res = await integration.fetch(`/databases/${encodeURIComponent(input.database_id)}`)
  return await res.json()
}
