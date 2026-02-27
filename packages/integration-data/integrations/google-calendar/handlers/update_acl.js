async (input) => {
  const { calendarId, ruleId, role } = input
  const body = { role }
  const path = `/calendars/${encodeURIComponent(calendarId)}/acl/${encodeURIComponent(ruleId)}`
  const res = await integration.fetch(path, { method: 'PUT', body })
  return await res.json()
}
