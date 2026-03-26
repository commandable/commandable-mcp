async (input) => {
  const params = new URLSearchParams()
  if (input.timeMin)
    params.set('timeMin', input.timeMin)
  if (input.timeMax)
    params.set('timeMax', input.timeMax)
  if (input.q)
    params.set('q', input.q)
  if (input.maxResults)
    params.set('maxResults', String(input.maxResults))
  if (input.pageToken)
    params.set('pageToken', input.pageToken)
  if (input.singleEvents !== undefined)
    params.set('singleEvents', String(input.singleEvents))
  if (input.orderBy)
    params.set('orderBy', input.orderBy)
  if (input.fields)
    params.set('fields', input.fields)
  const qs = params.toString()
  const path = `/calendars/${encodeURIComponent(input.calendarId)}/events${qs ? `?${qs}` : ''}`
  const res = await integration.fetch(path)
  const data = await res.json()
  const events = Array.isArray(data?.items)
    ? data.items.map(event => ({
      id: event.id ?? null,
      iCalUID: event.iCalUID ?? null,
      status: event.status ?? null,
      summary: event.summary ?? null,
      start: event.start?.dateTime ?? event.start?.date ?? null,
      end: event.end?.dateTime ?? event.end?.date ?? null,
      updated: event.updated ?? null,
      recurringEventId: event.recurringEventId ?? null,
      organizerEmail: event.organizer?.email ?? null,
      htmlLink: event.htmlLink ?? null,
    }))
    : []
  return {
    calendarId: input.calendarId,
    count: events.length,
    nextPageToken: data?.nextPageToken ?? null,
    nextSyncToken: data?.nextSyncToken ?? null,
    note: 'Use event id with get_event for full event details.',
    events,
  }
}
