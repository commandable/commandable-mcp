1. Create an OAuth 2.0 (3LO) app in the Atlassian developer console.
2. Add Jira scopes (typical minimum): `read:jira-work`, `write:jira-work`, `read:jira-user` (and `offline_access` if you want refresh tokens).
3. Complete the OAuth flow to obtain an access token.
4. Discover your `cloudId` by calling `GET https://api.atlassian.com/oauth/token/accessible-resources` with `Authorization: Bearer <access_token>` and using the returned `id`.
5. Paste `cloudId` and the current OAuth `token` here.

