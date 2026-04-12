## HubSpot guidance

This integration uses HubSpot CRM v3 object endpoints and CRM v4 association endpoints.

- Prefer `search_*` tools for discovery (they support free-text `query` and structured `filters`).
- Use `get_*` tools when you already have an object ID and want full details / associations.

### Search filters

All `search_*` tools accept:

- `query`: free-text search (optional)
- `filters`: property-based filtering. Each filter is `{ propertyName, operator, value? }`.

Common operators:

- `EQ`, `NEQ`
- `LT`, `LTE`, `GT`, `GTE` (numbers or millisecond timestamps)
- `CONTAINS_TOKEN` (tokenized contains)
- `HAS_PROPERTY`, `NOT_HAS_PROPERTY` (value ignored)
- `BETWEEN` (pass `value` as a string `"low,high"`; timestamps in ms recommended)

### Common property names (quick reference)

Contacts:
- `firstname`, `lastname`, `email`

Companies:
- `name`, `domain`

Deals:
- `dealname`, `amount`, `pipeline`, `dealstage`, `closedate`

Tickets:
- `subject`, `content`, `hs_pipeline`, `hs_pipeline_stage`

### Pipelines and stages (deals/tickets)

Pipelines and stages are stored as IDs (not human-friendly names). Recommended workflow:

1. Call `list_pipelines` with `objectType: "deals"` or `objectType: "tickets"`.
2. Pick a pipeline ID and stage ID from the response.
3. Use those IDs when calling `create_deal` / `update_deal` (via `pipeline` / `dealstage`) or `create_ticket` / `update_ticket` (via `hs_pipeline` / `hs_pipeline_stage`).

### Associations

- Use `get_associations` to list linked records (returns associated IDs).
- Use `create_association` to link two records (default/unlabeled association).
- Use `remove_association` to unlink records.

### Engagement objects

Notes:
- Content: `hs_note_body`
- Timestamp: `hs_timestamp` (milliseconds)

Tasks:
- Subject: `hs_task_subject`
- Body: `hs_task_body`
- Status: `hs_task_status` (`NOT_STARTED` or `COMPLETED`)
- Priority: `hs_task_priority` (`LOW`, `MEDIUM`, `HIGH`)
- Due timestamp: `hs_timestamp` (milliseconds)

The `create_note` and `create_task` tools can also associate the engagement to CRM records in the same call.

### Pagination

HubSpot uses cursor-based pagination. When a response includes `paging.next.after`, pass that value back as `after` in your next call.

