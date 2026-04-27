1. Go to https://developer.xero.com/ and sign in with your free Xero developer account.
2. Open My Apps, create an app, and choose a Custom Connection when testing against the Xero demo company.
3. Authorise the Custom Connection for the demo company. Demo-company Custom Connections can be used for development testing without charge.
4. Copy the Client ID and Client Secret into Commandable.
5. Ensure the app is authorised for the Accounting API scopes used by this integration.
6. For future public OAuth apps, use `offline_access`, store refresh tokens securely, and select a tenant from the `/connections` response before calling tenant-scoped Accounting API tools.
