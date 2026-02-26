async (input) => {
  const path = `/calendars/${encodeURIComponent(input.calendarId)}/acl`
  const res = await integration.fetch(path)
  return await res.json()
}
