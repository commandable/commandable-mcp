async (input) => {
  const params = new URLSearchParams()
  if (input.start_cursor)
    params.set('start_cursor', input.start_cursor)
  if (input.page_size)
    params.set('page_size', String(input.page_size))
  const qs = params.toString()
  const res = await integration.fetch(`/pages/${encodeURIComponent(input.page_id)}/properties/${encodeURIComponent(input.property_id)}${qs ? `?${qs}` : ''}`)
  return await res.json()
}
