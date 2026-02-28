## Gmail search query syntax

Gmail's `q` parameter supports a powerful search language. Key operators:

- `is:unread` / `is:read` — filter by read status
- `is:starred`, `is:important` — filter by markers
- `from:user@example.com` — sender filter
- `to:user@example.com`, `cc:user@example.com` — recipient filters
- `subject:keyword` — subject line search
- `has:attachment` — messages with attachments
- `filename:report.pdf` — specific attachment filename
- `label:INBOX` — filter by label (use label name or ID)
- `after:2024/01/01`, `before:2024/12/31` — date range (YYYY/MM/DD)
- `newer_than:7d`, `older_than:1y` — relative time (d=days, m=months, y=years)
- `in:sent`, `in:drafts`, `in:trash`, `in:spam` — folder filters
- `larger:5M`, `smaller:1M` — size filters

Combine operators with spaces (implicit AND): `from:alice is:unread has:attachment`

## Recommended workflows

**Reading emails:**
1. Use `list_messages` with a `q` query to find relevant message IDs
2. Use `read_email` on each ID to get decoded subject, from, to, date, and body text
3. For raw access or advanced format options, use `get_message` with `format='full'`

**Searching for threads:**
1. Use `list_threads` with `q` to find conversation threads
2. Use `get_thread` to retrieve all messages in a conversation at once

**Sending email:**
- Use `send_email` for the vast majority of cases -- it accepts plain `to`, `subject`, `body` fields
- Use `create_draft_email` + `send_draft` when you want to create a draft for review before sending

**Replying to an email:**
1. Get the original message with `read_email` to obtain its `threadId` and `id`
2. Call `send_email` with `replyToMessageId` = original message `id` and `threadId` = original `threadId`
3. The reply will appear in the same conversation thread

## Label IDs

System label IDs (always uppercase): `INBOX`, `UNREAD`, `STARRED`, `IMPORTANT`, `SENT`, `DRAFT`, `SPAM`, `TRASH`, `CATEGORY_PERSONAL`, `CATEGORY_SOCIAL`, `CATEGORY_PROMOTIONS`, `CATEGORY_UPDATES`, `CATEGORY_FORUMS`

User-created labels have auto-generated IDs. Use `list_labels` to discover them.

## Archiving and organizing

- Archive a message: `modify_message` with `removeLabelIds=['INBOX']`
- Mark as read: `modify_message` with `removeLabelIds=['UNREAD']`
- Star a message: `modify_message` with `addLabelIds=['STARRED']`
- Apply a label: `modify_message` with `addLabelIds=['<labelId>']`
- Use `modify_thread` to apply the same operation to all messages in a thread at once
