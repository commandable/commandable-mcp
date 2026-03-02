# Google Drive

**9 tools**

![Google Drive tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-google-drive.json)

## Credential variants

| Variant | Label |
|---|---|
| `service_account` | Service Account (recommended) _(default)_ |
| `oauth_token` | OAuth Access Token (short-lived) |

## Tools

| Tool | Scope | Description |
|---|---|---|
| `list_files` | read | List files in a Google Drive folder or across all of Drive. Returns id, name, mimeType, m… |
| `search_files` | read | Search Google Drive for files by name, MIME type, or raw Drive query syntax. Use the 'nam… |
| `get_file` | read | Get metadata for a Drive file or folder by ID. Returns id, name, mimeType, modifiedTime, … |
| `get_file_content` | read | Read the text content of a Drive file. For Google Workspace files (Docs, Sheets, Slides),… |
| `create_folder` | write | Create a new folder in Google Drive. Optionally nest it inside a parent folder using pare… |
| `create_file` | write | Create a new Drive file (metadata only -- no content upload). To create a Google Workspac… |
| `move_file` | write | Move a file or folder to a different parent folder by updating its parents. Provide the d… |
| `share_file` | write | Share a Drive file or folder with a specific user, group, domain, or make it publicly acc… |
| `delete_file` | write | Permanently and immediately delete a Drive file or folder by ID. This bypasses Trash and … |
