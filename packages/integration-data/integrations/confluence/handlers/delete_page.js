export default (integration) => async (input) => {
  const pageId = encodeURIComponent(String(input.pageId))
  const params = new URLSearchParams()
  if (input.purge) params.set('purge', 'true')
  if (input.draft) params.set('draft', 'true')

  const res = await integration.fetch(`/wiki/api/v2/pages/${pageId}${params.toString() ? `?${params}` : ''}`, {
    method: 'DELETE',
  })

  if (res.status === 204)
    return { ok: true }

  // Some proxies/APIs may still return JSON; try to parse.
  try { return await res.json() } catch { return { ok: res.ok, status: res.status } }
}

