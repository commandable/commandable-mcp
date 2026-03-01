async (input) => {
  const res = await integration.fetch(`/rest/agile/1.0/sprint/${encodeURIComponent(String(input.sprintId))}`)
  return await res.json()
}

