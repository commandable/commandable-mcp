async (input) => {
  const { calendarId, ...body } = input
  const path = `/calendars/${encodeURIComponent(calendarId)}/acl`
  const res = await integration.fetch(path, { method: 'POST', body })
  return await res.json()
}
