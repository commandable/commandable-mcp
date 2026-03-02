async (input) => {
  const params = new URLSearchParams()
  params.set('query', input.query)
  params.set('maxResults', String(input.maxResults ?? 50))

  const res = await integration.fetch(`/rest/api/3/user/search?${params.toString()}`)
  const data = await res.json()
  const users = Array.isArray(data) ? data : []

  return {
    users: users.map(u => ({
      accountId: u.accountId ?? null,
      displayName: u.displayName ?? null,
      active: u.active ?? null,
      accountType: u.accountType ?? null,
      emailAddress: u.emailAddress ?? null,
      timeZone: u.timeZone ?? null,
    })),
  }
}

