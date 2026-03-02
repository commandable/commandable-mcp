Set up Confluence Cloud OAuth (3LO):

1. Create an OAuth 2.0 (3LO) app in the Atlassian developer console
2. Add Confluence scopes (typical minimum): read:page:confluence, write:page:confluence, read:space:confluence (plus offline_access if you want refresh tokens)
3. Complete the OAuth flow to obtain an access token
4. Call `GET https://api.atlassian.com/oauth/token/accessible-resources` with `Authorization: Bearer <access_token>` to get `cloudId`
5. Paste `cloudId` and the OAuth access `token` here

