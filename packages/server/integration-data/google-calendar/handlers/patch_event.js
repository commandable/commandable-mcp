async (input) => {
  const path = `/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`
  const res = await integration.fetch(path, { method: 'PATCH', body: input.body })
  return await res.json()
}
