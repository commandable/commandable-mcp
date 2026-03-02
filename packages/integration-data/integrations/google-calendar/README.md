# Google Calendar

**17 tools** across 2 toolsets

![Google Calendar tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-google-calendar.json)

## Credential variants

| Variant | Label |
|---|---|
| `service_account` | Service Account (recommended) _(default)_ |
| `oauth_token` | OAuth Access Token (short-lived) |

## Toolsets

| Toolset | Description |
|---|---|
| `events` | Browse, schedule, and manage calendar events |
| `sharing` | Control who can access calendars |

## Tools

| Tool | Scope | Toolset | Description |
|---|---|---|---|
| `list_calendars` | read | `events` | List all calendars in the authenticated user's calendar list, including the primary calen… |
| `get_calendar` | read | `events` | Get details for a specific calendar by ID, including its summary, description, timezone, … |
| `list_events` | read | `events` | List events in a calendar with optional time range, text search, and pagination. Use cale… |
| `get_event` | read | `events` | Get a specific event by its ID from a calendar. Returns full event details including summ… |
| `list_colors` | read | `events` | Get the set of color definitions available for calendars and events. Returns colorId valu… |
| `freebusy_query` | read | `events` | Query free/busy availability for one or more calendars within a time range. Useful for fi… |
| `list_settings` | read | `events` | List the authenticated user's Google Calendar settings, such as timezone, date format, an… |
| `create_event` | write | `events` | Create a new event in a calendar. Required fields: calendarId, summary, start, end. Use {… |
| `patch_event` | write | `events` | Partially update an event by providing only the fields to change. All other fields are pr… |
| `delete_event` | write | `events` | Delete an event from a calendar. This permanently removes the event. For recurring events… |
| `move_event` | write | `events` | Move an event from one calendar to another. Provide the source calendarId, eventId, and t… |
| `quick_add` | write | `events` | Create an event using a natural language text string. Parses the text to extract event de… |
| `list_acl` | admin | `sharing` | List the Access Control List (ACL) rules for a calendar. Returns rules defining who has a… |
| `get_acl` | admin | `sharing` | Get a specific ACL rule by its rule ID for a calendar. Use list_acl to find rule IDs. |
| `insert_acl` | admin | `sharing` | Add a new ACL rule to grant a user or group access to a calendar. Roles: 'reader' (view),… |
| `update_acl` | admin | `sharing` | Update an existing ACL rule to change a user's or group's permission level on a calendar.… |
| `delete_acl` | admin | `sharing` | Remove an ACL rule from a calendar, revoking the associated user's or group's access. Use… |
