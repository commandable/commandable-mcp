Provide a Google service account JSON key.

Optional fields:

1. `subject` if you are using domain-wide delegation and want to impersonate a user
2. `scopes` if you need to override the defaults

Default scopes for this integration:

- `https://www.googleapis.com/auth/drive`
- `https://www.googleapis.com/auth/documents`
- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/presentations`

For full Workspace access, make sure the service account has been granted access to the relevant Drive files or shared drives, or use domain-wide delegation where appropriate.
