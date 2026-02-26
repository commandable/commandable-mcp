async (input) => {
  const params = new URLSearchParams({ destination: input.destination })
  const path = `/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}/move?${params.toString()}`
  const res = await integration.fetch(path, { method: 'POST' })
  return await res.json()
}
