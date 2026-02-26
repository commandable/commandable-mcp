async (input) => {
  const path = `/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`
  const res = await integration.fetch(path, { method: 'DELETE' })
  // Google Calendar delete returns 204 No Content, but proxy returns Response; handle empty body
  try { return await res.json() }
  catch { return { success: true } }
}
