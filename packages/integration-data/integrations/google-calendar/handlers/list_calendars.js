async (input) => {
  const res = await integration.fetch('/users/me/calendarList')
  const data = await res.json()
  const calendars = Array.isArray(data?.items)
    ? data.items.map(cal => ({
      id: cal.id ?? null,
      summary: cal.summary ?? null,
      description: cal.description ?? null,
      primary: !!cal.primary,
      accessRole: cal.accessRole ?? null,
      timeZone: cal.timeZone ?? null,
      backgroundColor: cal.backgroundColor ?? null,
      foregroundColor: cal.foregroundColor ?? null,
    }))
    : []
  return {
    count: calendars.length,
    nextPageToken: data?.nextPageToken ?? null,
    nextSyncToken: data?.nextSyncToken ?? null,
    note: 'Use calendar id with get_calendar for full calendar details.',
    calendars,
  }
}
