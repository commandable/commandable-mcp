async (input) => {
  const res = await integration.fetch(`/crm/v3/pipelines/${encodeURIComponent(input.objectType)}`)
  return await res.json()
}

