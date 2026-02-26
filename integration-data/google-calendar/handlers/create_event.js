async (input) => {
  const { calendarId, ...body } = input
  const path = `/calendars/${encodeURIComponent(calendarId)}/events`
  const res = await integration.fetch(path, { method: 'POST', body })
  return await res.json()
}
