async (input) => {
  const path = `/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`
  const res = await integration.fetch(path)
  return await res.json()
}
