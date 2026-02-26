Recommended: use a Google service account.

- Create a service account in Google Cloud
- Download a JSON key
- Paste the JSON into `serviceAccountJson` (or use `env:GOOGLE_SERVICE_ACCOUNT_JSON`)
- Share your test spreadsheet with the service account `client_email`

You can also paste a short-lived OAuth access token into `token`, but it will expire.

