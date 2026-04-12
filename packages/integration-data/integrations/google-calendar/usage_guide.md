## Calendar IDs

- Use `calendarId='primary'` for the authenticated user's main calendar
- Use `list_calendars` to discover other calendar IDs (work, shared, subscribed calendars)
- Calendar IDs typically look like email addresses (e.g. `user@example.com`) or opaque strings for subscribed calendars

## Date and time format

All times must be in RFC3339 format:
- Timed events: `'2024-01-15T10:00:00-05:00'` (with timezone offset) or `'2024-01-15T15:00:00Z'` (UTC)
- All-day events use date-only format: `'2024-01-15'`

## Creating events

For `create_event`, required fields are `calendarId`, `summary`, `start`, and `end`:

**Timed event:**
```json
{
  "calendarId": "primary",
  "summary": "Team Meeting",
  "start": { "dateTime": "2024-01-15T10:00:00", "timeZone": "America/New_York" },
  "end":   { "dateTime": "2024-01-15T11:00:00", "timeZone": "America/New_York" }
}
```

**All-day event:**
```json
{
  "calendarId": "primary",
  "summary": "Company Holiday",
  "start": { "date": "2024-01-15" },
  "end":   { "date": "2024-01-16" }
}
```

Note: For all-day events, `end.date` should be the day *after* the last day (exclusive end).

## Listing events in chronological order

To list upcoming events in start-time order (e.g. "what's on my calendar this week"):
- Set `singleEvents=true` to expand recurring events into individual instances
- Set `orderBy='startTime'` (requires `singleEvents=true`)
- Set `timeMin` to now (current ISO timestamp) and `timeMax` to the end of the desired range

## Quick add

`quick_add` parses natural language:
- `"Meeting with Bob tomorrow at 3pm for 1 hour"`
- `"Dentist appointment on Friday at 2pm"`
- `"Weekly standup every Monday at 9am"`

## Free/busy queries

Use `freebusy_query` to check availability before scheduling:
```json
{
  "timeMin": "2024-01-15T00:00:00Z",
  "timeMax": "2024-01-15T23:59:59Z",
  "items": [{ "id": "primary" }, { "id": "colleague@example.com" }]
}
```

## Updating events

- Use `update_event` for a full replacement (all fields must be provided)
- Use `patch_event` for partial updates (only provide the fields you want to change in `body`)
- `patch_event` is preferred when modifying one or two fields to avoid accidentally clearing others
