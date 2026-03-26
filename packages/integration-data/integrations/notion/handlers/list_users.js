async (input) => {
  const params = new URLSearchParams()
  if (input.start_cursor)
    params.set('start_cursor', input.start_cursor)
  if (input.page_size)
    params.set('page_size', String(input.page_size))
  const qs = params.toString()
  const res = await integration.fetch(`/users${qs ? `?${qs}` : ''}`)
  const data = await res.json()
  const users = Array.isArray(data?.results)
    ? data.results.map(user => ({
      id: user?.id ?? null,
      type: user?.type ?? null,
      name: user?.name ?? null,
      avatar_url: user?.avatar_url ?? null,
      person_email: user?.person?.email ?? null,
    }))
    : []
  return {
    count: users.length,
    has_more: !!data?.has_more,
    next_cursor: data?.next_cursor ?? null,
    note: 'Use id with retrieve_user for full user details.',
    users,
  }
}
