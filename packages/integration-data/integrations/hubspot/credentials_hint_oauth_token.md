## HubSpot credentials (OAuth access token)

1. Create (or use an existing) HubSpot public app that can issue OAuth 2.0 access tokens.
2. Ensure the app requests the scopes you need (for example):
   - `crm.objects.contacts.read` / `crm.objects.contacts.write`
   - `crm.objects.companies.read` / `crm.objects.companies.write`
   - `crm.objects.deals.read` / `crm.objects.deals.write`
   - `tickets`
   - `crm.objects.owners.read`
   - relevant `crm.schemas.*.read` scopes if you want to list properties
3. Complete the OAuth authorization code flow to obtain an **access token**.
4. Paste the access token into this integration's `token` credential field.

Notes:
- HubSpot OAuth access tokens are short-lived. If calls start failing with 401, refresh and provide a new access token.

