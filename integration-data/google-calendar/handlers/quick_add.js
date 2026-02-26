async (input) => {
  const params = new URLSearchParams({ text: input.text })
  const path = `/calendars/${encodeURIComponent(input.calendarId)}/events/quickAdd?${params.toString()}`
  const res = await integration.fetch(path, { method: 'POST' })
  return await res.json()
}
