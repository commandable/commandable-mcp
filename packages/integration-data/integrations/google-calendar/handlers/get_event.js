async (input) => {
  const params = new URLSearchParams()
  if (input.fields)
    params.set('fields', input.fields)
  const qs = params.toString()
  const path = `/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}${qs ? `?${qs}` : ''}`
  const res = await integration.fetch(path)
  return await res.json()
}
