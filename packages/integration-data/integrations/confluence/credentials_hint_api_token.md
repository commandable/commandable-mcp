Set up Confluence Cloud API token auth:

1. Open your Confluence site (it looks like `https://YOUR_DOMAIN.atlassian.net/wiki`)
2. Copy `YOUR_DOMAIN` (the subdomain) and use it as `domain`
3. Create an Atlassian API token at `https://id.atlassian.com/manage-profile/security/api-tokens`
4. Use the Atlassian account email as `email` and paste the token as `apiToken`

Note: The server computes the required Basic auth header for you.

