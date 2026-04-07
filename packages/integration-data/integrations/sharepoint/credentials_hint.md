1. Create or use a Microsoft Entra app registration for Microsoft Graph at https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
2. Create a client secret for that app and copy the **tenant ID**, **client ID**, and **client secret value**.
3. In Microsoft Graph **Application permissions**, grant at least `Sites.Read.All` and `Files.Read.All`.
4. If you intend to use write actions such as folder creation, moves, and deletes, also grant `Sites.ReadWrite.All` and `Files.ReadWrite.All`.
5. Grant admin consent for those application permissions in the tenant.
6. Paste the tenant ID, client ID, and client secret into this integration. The integration exchanges them for short-lived Microsoft Graph access tokens automatically.
