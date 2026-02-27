async (input) => {
  const path = `/calendars/${encodeURIComponent(input.calendarId)}/acl/${encodeURIComponent(input.ruleId)}`
  const res = await integration.fetch(path, { method: 'DELETE' })
  try { return await res.json() }
  catch { return { success: true } }
}
