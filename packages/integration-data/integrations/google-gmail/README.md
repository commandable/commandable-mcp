# Gmail

**25 tools** across 2 toolsets

![Gmail tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-google-gmail.json)

## Credential variants

| Variant | Label |
|---|---|
| `service_account` | Service Account (recommended) _(default)_ |
| `oauth_token` | OAuth Access Token (short-lived) |

## Toolsets

| Toolset | Description |
|---|---|
| `email` | Search, read, compose, and send emails and drafts |
| `organize` | Label, archive, trash, and delete messages and threads |

## Tools

| Tool | Scope | Toolset | Description |
|---|---|---|---|
| `get_profile` | read | `email` | Get mailbox profile details for the authenticated user, including email address, messages… |
| `list_messages` | read | `email` | List message IDs matching a Gmail search query or label filters. Returns only IDs and thr… |
| `read_email` | read | `email` | Read an email by message ID and return a flat, decoded result with subject, from, to, cc,… |
| `get_message` | read | `email` | Get the raw Gmail message resource by message ID. Returns the full nested payload includi… |
| `list_threads` | read | `email` | List thread IDs matching a Gmail search query or label filters. Similar to list_messages … |
| `get_thread` | read | `email` | Get a full thread resource by thread ID, including all messages in the conversation. Use … |
| `list_drafts` | read | `email` | List drafts in the mailbox. Returns draft IDs and the nested message ID. Use get_draft to… |
| `get_draft` | read | `email` | Get a draft by draft ID. Returns the draft object including the nested message resource. … |
| `send_email` | write | `email` | Send an email by providing flat fields: to, subject, and body. Handles MIME encoding and … |
| `create_draft_email` | write | `email` | Create a draft email using flat fields: subject, body, and optionally to, cc, bcc. Handle… |
| `delete_draft` | write | `email` | Permanently delete a draft by its draft ID. Use list_drafts to find draft IDs. This canno… |
| `send_draft` | write | `email` | Send an existing draft by draft ID, or send a one-off draft payload (provide raw instead … |
| `list_labels` | read | `organize` | List all labels in the user's mailbox, including system labels (INBOX, SENT, DRAFT, SPAM,… |
| `get_label` | read | `organize` | Get details for a specific label by its label ID. Returns name, type, visibility settings… |
| `modify_message` | write | `organize` | Add or remove labels on a single message. Provide addLabelIds, removeLabelIds, or both. C… |
| `trash_message` | write | `organize` | Move a message to the Trash. The message is not permanently deleted and can be restored w… |
| `untrash_message` | write | `organize` | Restore a message from Trash back to the Inbox. Use list_messages with labelIds=['TRASH']… |
| `delete_message` | write | `organize` | Permanently and immediately delete a message by ID. This cannot be undone. For recoverabl… |
| `modify_thread` | write | `organize` | Add or remove labels on all messages in a thread at once. Provide addLabelIds, removeLabe… |
| `trash_thread` | write | `organize` | Move an entire thread to Trash. All messages in the thread are trashed. Can be reversed w… |
| `untrash_thread` | write | `organize` | Restore an entire thread from Trash. Use list_threads with labelIds=['TRASH'] to find tra… |
| `delete_thread` | write | `organize` | Permanently and immediately delete an entire thread and all its messages. This cannot be … |
| `create_label` | admin | `organize` | Create a new mailbox label with optional visibility and color settings. Label names must … |
| `update_label` | admin | `organize` | Update (patch) an existing mailbox label's name, color, or visibility settings by label I… |
| `delete_label` | admin | `organize` | Permanently delete a mailbox label by label ID. Messages with this label will have it rem… |
