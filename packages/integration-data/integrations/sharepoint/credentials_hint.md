1. Create or use a Microsoft Entra app registration that can call Microsoft Graph on behalf of a user.
2. Grant delegated Microsoft Graph permissions for `Files.Read.All` and `Sites.Read.All`.
3. Because this integration also supports folder creation, moves, and deletes, also grant delegated `Files.ReadWrite.All` and `Sites.ReadWrite.All`.
4. Sign in as a user who can access the SharePoint sites and document libraries you want the integration to use.
5. Obtain a short-lived delegated Microsoft Graph access token for that user and paste it into the `token` field.
6. If calls fail with `401` or `403`, confirm the token is still valid, the delegated permissions were consented, and the signed-in user can access the target SharePoint site.
