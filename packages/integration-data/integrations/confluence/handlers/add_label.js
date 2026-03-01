async (input) => {
  const pageId = encodeURIComponent(String(input.pageId))
  const labels = Array.isArray(input.labels) ? input.labels : []

  const body = labels
    .map((name) => String(name).trim())
    .filter(Boolean)
    .map((name) => ({ prefix: 'global', name }))

  const res = await integration.fetch(`/wiki/rest/api/content/${pageId}/label`, {
    method: 'POST',
    body,
  })
  return await res.json()
}

