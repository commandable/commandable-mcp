# Google Workspace

Combined Google Drive, Docs, Sheets, and Slides integration.

## Toolsets

- `drive`
- `docs`
- `sheets`
- `slides`

## Credential variants

- `service_account`
- `oauth_token`

## Notes

- Managed OAuth launch mode should request `drive.file`, `documents`, `spreadsheets`, and `presentations`.
- The integration allows explicit cross-origin calls to `https://*.googleapis.com` so one workspace integration can reach the product-specific Google APIs safely.
