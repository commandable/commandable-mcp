async (input) => {
  const path = `/calendars/${encodeURIComponent(input.calendarId)}/acl/${encodeURIComponent(input.ruleId)}`
  const res = await integration.fetch(path)
  return await res.json()
}
