async (input) => {
  const res = await integration.fetch(`/calendars/${encodeURIComponent(input.calendarId)}`)
  return await res.json()
}
