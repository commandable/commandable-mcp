## HubSpot credentials (Private App Token)

1. In HubSpot, open **Settings**.
2. Go to **Integrations** → **Private Apps**.
3. Click **Create private app**.
4. Name the app (e.g. "Commandable MCP") and save.
5. In **Scopes**, enable at least:
   - `crm.objects.contacts.read` / `crm.objects.contacts.write`
   - `crm.objects.companies.read` / `crm.objects.companies.write`
   - `crm.objects.deals.read` / `crm.objects.deals.write`
   - `tickets` (for tickets read/write)
   - `crm.objects.owners.read`
   - `crm.schemas.contacts.read`, `crm.schemas.companies.read`, `crm.schemas.deals.read`, `crm.schemas.tickets.read` (for listing properties)
6. Create the app and copy the generated **Access token**.
7. Paste the token into this integration's `token` credential field.

Notes:
- Keep this token secret. Anyone with the token can access your HubSpot account within the app's scopes.
- If you get 401/403 errors, double-check the app scopes and that the token is still active.

