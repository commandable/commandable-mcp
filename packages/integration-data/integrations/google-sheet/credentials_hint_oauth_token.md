Obtain a short-lived Google OAuth access token:

1. Use the Google OAuth 2.0 Playground (`https://developers.google.com/oauthplayground/`) or your own OAuth flow
2. Select the scope: `https://www.googleapis.com/auth/spreadsheets`
3. Exchange the authorization code for an access token
4. Paste the access token here

Note: OAuth access tokens are short-lived (typically 1 hour). For long-running use, prefer the Service Account variant.
