Recommended: use a Google service account.

- Create a service account in Google Cloud
- Download a JSON key
- Paste the JSON into `serviceAccountJson`

Note: Calendar often needs Google Workspace domain-wide delegation if you want to impersonate a user (`subject`).
For simple setups, use a short-lived OAuth access token in `token`.

