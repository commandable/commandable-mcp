/**
 * Static, browser-safe export of all integration credential configs and hints.
 * Import this from @commandable/integration-data/credentials in browser/Vite contexts
 * where Node.js fs access is not available.
 */

import type { CredentialVariantsFile } from './loader.js'

export type { CredentialVariantConfig, CredentialVariantsFile } from './loader.js'

export interface IntegrationCredentials {
  variants: CredentialVariantsFile
  hints: Record<string, string>
}

export const credentialConfigs: Record<string, IntegrationCredentials> = {
  airtable: {
    variants: {
      variants: {
        personal_access_token: {
          label: 'Personal Access Token',
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                title: 'Personal Access Token',
                description: 'Airtable personal access token.',
              },
            },
            required: ['token'],
            additionalProperties: false,
          },
          injection: { headers: { Authorization: 'Bearer {{token}}' } },
        },
      },
      default: 'personal_access_token',
    },
    hints: {
      personal_access_token: `Create an Airtable personal access token and paste it here.

You can generate one in Airtable account settings under developer tools / personal access tokens.`,
    },
  },

  github: {
    variants: {
      variants: {
        classic_pat: {
          label: 'Classic Personal Access Token',
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                title: 'Classic PAT',
                description: 'GitHub classic personal access token. Supports all GitHub API operations including creating and deleting repositories.',
              },
            },
            required: ['token'],
            additionalProperties: false,
          },
          injection: { headers: { Authorization: 'Bearer {{token}}' } },
        },
        fine_grained_pat: {
          label: 'Fine-Grained Personal Access Token',
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                title: 'Fine-Grained PAT',
                description: 'GitHub fine-grained personal access token scoped to specific repositories and permissions.',
              },
            },
            required: ['token'],
            additionalProperties: false,
          },
          injection: { headers: { Authorization: 'Bearer {{token}}' } },
        },
      },
      default: 'classic_pat',
    },
    hints: {
      classic_pat: `Create a GitHub Classic Personal Access Token:

1. Go to https://github.com/settings/tokens → Tokens (classic)
2. Click Generate new token (classic)
3. Select the scopes you need: \`repo\`, \`delete_repo\` (if needed), \`read:user\`, etc.
4. Copy the token and paste it here.

Classic PATs support all GitHub API operations including creating and deleting repositories.`,
      fine_grained_pat: `Create a GitHub Fine-Grained Personal Access Token:

1. Go to https://github.com/settings/tokens → Fine-grained tokens
2. Click Generate new token
3. Set the resource owner and repository access
4. Grant the permissions your use case requires
5. Copy the token and paste it here.

Note: Fine-grained PATs do not support creating or deleting repositories.`,
    },
  },

  jira: {
    variants: {
      variants: {
        api_token: {
          label: 'API Token (Email + Token)',
          schema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                title: 'Jira site domain',
                description: 'The subdomain of your Jira Cloud site. Example: for https://mycompany.atlassian.net, enter "mycompany".',
              },
              email: {
                type: 'string',
                title: 'Atlassian account email',
                description: 'Email address of the Atlassian account that owns the API token.',
              },
              apiToken: {
                type: 'string',
                title: 'Atlassian API token',
                description: 'Atlassian API token for Jira Cloud. The server will convert this into the required Basic auth header.',
              },
            },
            required: ['domain', 'email', 'apiToken'],
            additionalProperties: false,
          },
          baseUrlTemplate: 'https://{{domain}}.atlassian.net',
          injection: { headers: { Authorization: 'Basic {{basicAuth}}', Accept: 'application/json' } },
          preprocess: 'jira_api_token',
        },
        oauth_token: {
          label: 'OAuth Access Token (3LO)',
          schema: {
            type: 'object',
            properties: {
              cloudId: {
                type: 'string',
                title: 'Jira Cloud ID',
                description: 'Your Jira Cloud resource ID (cloudId). Discover it via GET https://api.atlassian.com/oauth/token/accessible-resources using your access token.',
              },
              token: {
                type: 'string',
                title: 'OAuth access token',
                description: 'OAuth 2.0 access token with Jira scopes (read:jira-work, write:jira-work, read:jira-user).',
              },
            },
            required: ['cloudId', 'token'],
            additionalProperties: false,
          },
          baseUrlTemplate: 'https://api.atlassian.com/ex/jira/{{cloudId}}',
          injection: { headers: { Authorization: 'Bearer {{token}}', Accept: 'application/json' } },
        },
      },
      default: 'api_token',
    },
    hints: {
      api_token: `Set up Jira Cloud API token auth:

1. Open your Jira site (it looks like https://YOUR_DOMAIN.atlassian.net)
2. Copy YOUR_DOMAIN (the subdomain) and use it as \`domain\`
3. Create an Atlassian API token: https://id.atlassian.com/manage-profile/security/api-tokens
4. Use the Atlassian account email as \`email\` and paste the token as \`apiToken\`

Note: The server computes the required Basic auth header for you.`,
      oauth_token: `Set up Jira Cloud OAuth (3LO):

1. Create an OAuth 2.0 (3LO) app in the Atlassian developer console
2. Add scopes (typical minimum): read:jira-work, write:jira-work, read:jira-user (plus offline_access if you want refresh tokens)
3. Complete the OAuth flow to obtain an access token
4. Call GET https://api.atlassian.com/oauth/token/accessible-resources with Authorization: Bearer <access_token> to get \`cloudId\`
5. Paste \`cloudId\` and the OAuth access \`token\` here`,
    },
  },

  confluence: {
    variants: {
      variants: {
        api_token: {
          label: 'API Token (Email + Token)',
          schema: {
            type: 'object',
            properties: {
              domain: {
                type: 'string',
                title: 'Confluence site domain',
                description: 'The subdomain of your Confluence Cloud site. Example: for https://mycompany.atlassian.net/wiki, enter "mycompany".',
              },
              email: {
                type: 'string',
                title: 'Atlassian account email',
                description: 'Email address of the Atlassian account that owns the API token.',
              },
              apiToken: {
                type: 'string',
                title: 'Atlassian API token',
                description: 'Atlassian API token for Confluence Cloud. The server will convert this into the required Basic auth header.',
              },
            },
            required: ['domain', 'email', 'apiToken'],
            additionalProperties: false,
          },
          baseUrlTemplate: 'https://{{domain}}.atlassian.net',
          injection: { headers: { Authorization: 'Basic {{basicAuth}}', Accept: 'application/json' } },
          preprocess: 'confluence_api_token',
        },
        oauth_token: {
          label: 'OAuth Access Token (3LO)',
          schema: {
            type: 'object',
            properties: {
              cloudId: {
                type: 'string',
                title: 'Atlassian Cloud ID',
                description: 'Your Atlassian Cloud resource ID (cloudId). Discover it via GET https://api.atlassian.com/oauth/token/accessible-resources using your access token.',
              },
              token: {
                type: 'string',
                title: 'OAuth access token',
                description: 'OAuth 2.0 access token with Confluence scopes (read:page:confluence, write:page:confluence, read:space:confluence, etc.).',
              },
            },
            required: ['cloudId', 'token'],
            additionalProperties: false,
          },
          baseUrlTemplate: 'https://api.atlassian.com/ex/confluence/{{cloudId}}',
          injection: { headers: { Authorization: 'Bearer {{token}}', Accept: 'application/json' } },
        },
      },
      default: 'api_token',
    },
    hints: {
      api_token: `Set up Confluence Cloud API token auth:

1. Open your Confluence site (it looks like https://YOUR_DOMAIN.atlassian.net/wiki)
2. Copy YOUR_DOMAIN (the subdomain) and use it as \`domain\`
3. Create an Atlassian API token: https://id.atlassian.com/manage-profile/security/api-tokens
4. Use the Atlassian account email as \`email\` and paste the token as \`apiToken\`

Note: The server computes the required Basic auth header for you.`,
      oauth_token: `Set up Confluence Cloud OAuth (3LO):

1. Create an OAuth 2.0 (3LO) app in the Atlassian developer console
2. Add Confluence scopes (typical minimum): read:page:confluence, write:page:confluence, read:space:confluence (plus offline_access if you want refresh tokens)
3. Complete the OAuth flow to obtain an access token
4. Call GET https://api.atlassian.com/oauth/token/accessible-resources with Authorization: Bearer <access_token> to get \`cloudId\`
5. Paste \`cloudId\` and the OAuth access \`token\` here`,
    },
  },

  'google-calendar': {
    variants: {
      variants: {
        service_account: {
          label: 'Service Account (recommended)',
          schema: {
            type: 'object',
            properties: {
              serviceAccountJson: {
                type: 'string',
                title: 'Service Account JSON',
                description: 'Full service account key JSON (contents of the downloaded JSON file from Google Cloud).',
              },
              subject: {
                type: 'string',
                title: 'Subject / impersonated user (optional)',
                description: 'User email to impersonate via Google Workspace domain-wide delegation.',
              },
              scopes: {
                type: 'array',
                title: 'OAuth scopes (optional)',
                description: 'Optional override for OAuth scopes. Defaults to calendar.',
                items: { type: 'string' },
              },
            },
            required: ['serviceAccountJson'],
            additionalProperties: false,
          },
          injection: { headers: { Authorization: 'Bearer {{token}}' } },
          preprocess: 'google_service_account',
        },
        oauth_token: {
          label: 'OAuth Access Token (short-lived)',
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                title: 'OAuth Access Token',
                description: 'Short-lived Google OAuth access token with calendar scope.',
              },
            },
            required: ['token'],
            additionalProperties: false,
          },
          injection: { headers: { Authorization: 'Bearer {{token}}' } },
        },
      },
      default: 'service_account',
    },
    hints: {
      service_account: `Set up a Google Cloud Service Account:

1. Enable the Google Calendar API for your project
2. Go to IAM & Admin → Service Accounts and create a new service account
3. Download a JSON key and paste its full contents here
4. For Google Workspace: configure domain-wide delegation and set \`subject\` to the calendar owner's email.`,
      oauth_token: `Obtain a short-lived Google OAuth access token with the scope:
https://www.googleapis.com/auth/calendar

Note: OAuth access tokens expire (typically after 1 hour). Prefer Service Account for long-running use.`,
    },
  },

  'google-docs': {
    variants: {
      variants: {
        service_account: {
          label: 'Service Account (recommended)',
          schema: {
            type: 'object',
            properties: {
              serviceAccountJson: {
                type: 'string',
                title: 'Service Account JSON',
                description: 'Full service account key JSON (contents of the downloaded JSON file from Google Cloud).',
              },
              subject: {
                type: 'string',
                title: 'Subject / impersonated user (optional)',
                description: 'Optional user email to impersonate when using Google Workspace domain-wide delegation.',
              },
              scopes: {
                type: 'array',
                title: 'OAuth scopes (optional)',
                description: 'Optional override for OAuth scopes. Defaults to documents + drive.',
                items: { type: 'string' },
              },
            },
            required: ['serviceAccountJson'],
            additionalProperties: false,
          },
          injection: { headers: { Authorization: 'Bearer {{token}}' } },
          preprocess: 'google_service_account',
        },
        oauth_token: {
          label: 'OAuth Access Token (short-lived)',
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                title: 'OAuth Access Token',
                description: 'Short-lived Google OAuth access token with documents and drive scopes.',
              },
            },
            required: ['token'],
            additionalProperties: false,
          },
          injection: { headers: { Authorization: 'Bearer {{token}}' } },
        },
      },
      default: 'service_account',
    },
    hints: {
      service_account: `Set up a Google Cloud Service Account:

1. Enable the Google Docs API and Google Drive API
2. Go to IAM & Admin → Service Accounts and create a new service account
3. Download a JSON key and paste its full contents here
4. Share your target Google Docs documents with the service account's \`client_email\``,
      oauth_token: `Obtain a short-lived Google OAuth access token with the scopes:
https://www.googleapis.com/auth/documents
https://www.googleapis.com/auth/drive

Note: OAuth access tokens expire (typically after 1 hour). Prefer Service Account for long-running use.`,
    },
  },

  'google-drive': {
    variants: {
      variants: {
        service_account: {
          label: 'Service Account (recommended)',
          schema: {
            type: 'object',
            properties: {
              serviceAccountJson: {
                type: 'string',
                title: 'Service Account JSON',
                description: 'Full service account key JSON (contents of the downloaded JSON file from Google Cloud).',
              },
              subject: {
                type: 'string',
                title: 'Subject / impersonated user (optional)',
                description: 'Optional user email to impersonate when using Google Workspace domain-wide delegation.',
              },
              scopes: {
                type: 'array',
                title: 'OAuth scopes (optional)',
                description: 'Optional override for OAuth scopes. Defaults to drive.',
                items: { type: 'string' },
              },
            },
            required: ['serviceAccountJson'],
            additionalProperties: false,
          },
          injection: { headers: { Authorization: 'Bearer {{token}}' } },
          preprocess: 'google_service_account',
        },
        oauth_token: {
          label: 'OAuth Access Token (short-lived)',
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                title: 'OAuth Access Token',
                description: 'Short-lived Google OAuth access token with drive scope.',
              },
            },
            required: ['token'],
            additionalProperties: false,
          },
          injection: { headers: { Authorization: 'Bearer {{token}}' } },
        },
      },
      default: 'service_account',
    },
    hints: {
      service_account: `Set up a Google Cloud Service Account:

1. Enable the Google Drive API
2. Go to IAM & Admin → Service Accounts and create a new service account
3. Download a JSON key and paste its full contents here
4. Share the Drive folders/files you want to access with the service account's \`client_email\``,
      oauth_token: `Obtain a short-lived Google OAuth access token with the scope:
https://www.googleapis.com/auth/drive

Note: OAuth access tokens expire (typically after 1 hour). Prefer Service Account for long-running use.`,
    },
  },

  'google-sheet': {
    variants: {
      variants: {
        service_account: {
          label: 'Service Account (recommended)',
          schema: {
            type: 'object',
            properties: {
              serviceAccountJson: {
                type: 'string',
                title: 'Service Account JSON',
                description: 'Full service account key JSON (contents of the downloaded JSON file from Google Cloud).',
              },
              subject: {
                type: 'string',
                title: 'Subject / impersonated user (optional)',
                description: 'Optional user email to impersonate when using Google Workspace domain-wide delegation.',
              },
              scopes: {
                type: 'array',
                title: 'OAuth scopes (optional)',
                description: 'Optional override for OAuth scopes. Defaults to spreadsheets.',
                items: { type: 'string' },
              },
            },
            required: ['serviceAccountJson'],
            additionalProperties: false,
          },
          injection: { headers: { Authorization: 'Bearer {{token}}' } },
          preprocess: 'google_service_account',
        },
        oauth_token: {
          label: 'OAuth Access Token (short-lived)',
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                title: 'OAuth Access Token',
                description: 'Short-lived Google OAuth access token with spreadsheets scope.',
              },
            },
            required: ['token'],
            additionalProperties: false,
          },
          injection: { headers: { Authorization: 'Bearer {{token}}' } },
        },
      },
      default: 'service_account',
    },
    hints: {
      service_account: `Set up a Google Cloud Service Account:

1. Enable the Google Sheets API
2. Go to IAM & Admin → Service Accounts and create a new service account
3. Download a JSON key and paste its full contents here
4. Share your target spreadsheets with the service account's \`client_email\``,
      oauth_token: `Obtain a short-lived Google OAuth access token with the scope:
https://www.googleapis.com/auth/spreadsheets

Note: OAuth access tokens expire (typically after 1 hour). Prefer Service Account for long-running use.`,
    },
  },

  'google-slides': {
    variants: {
      variants: {
        service_account: {
          label: 'Service Account (recommended)',
          schema: {
            type: 'object',
            properties: {
              serviceAccountJson: {
                type: 'string',
                title: 'Service Account JSON',
                description: 'Full service account key JSON (contents of the downloaded JSON file from Google Cloud).',
              },
              subject: {
                type: 'string',
                title: 'Subject / impersonated user (optional)',
                description: 'Optional user email to impersonate when using Google Workspace domain-wide delegation.',
              },
              scopes: {
                type: 'array',
                title: 'OAuth scopes (optional)',
                description: 'Optional override for OAuth scopes. Defaults to presentations + drive.',
                items: { type: 'string' },
              },
            },
            required: ['serviceAccountJson'],
            additionalProperties: false,
          },
          injection: { headers: { Authorization: 'Bearer {{token}}' } },
          preprocess: 'google_service_account',
        },
        oauth_token: {
          label: 'OAuth Access Token (short-lived)',
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                title: 'OAuth Access Token',
                description: 'Short-lived Google OAuth access token with presentations and drive scopes.',
              },
            },
            required: ['token'],
            additionalProperties: false,
          },
          injection: { headers: { Authorization: 'Bearer {{token}}' } },
        },
      },
      default: 'service_account',
    },
    hints: {
      service_account: `Set up a Google Cloud Service Account:

1. Enable the Google Slides API and Google Drive API
2. Go to IAM & Admin → Service Accounts and create a new service account
3. Download a JSON key and paste its full contents here
4. Share your target presentations with the service account's \`client_email\``,
      oauth_token: `Obtain a short-lived Google OAuth access token with the scopes:
https://www.googleapis.com/auth/presentations
https://www.googleapis.com/auth/drive

Note: OAuth access tokens expire (typically after 1 hour). Prefer Service Account for long-running use.`,
    },
  },

  'google-gmail': {
    variants: {
      variants: {
        service_account: {
          label: 'Service Account (recommended)',
          schema: {
            type: 'object',
            properties: {
              serviceAccountJson: {
                type: 'string',
                title: 'Service Account JSON',
                description: 'Full service account key JSON (contents of the downloaded JSON file from Google Cloud).',
              },
              subject: {
                type: 'string',
                title: 'Subject / impersonated user (optional)',
                description: 'User email to impersonate via Google Workspace domain-wide delegation. Usually required for mailbox access.',
              },
              scopes: {
                type: 'array',
                title: 'OAuth scopes (optional)',
                description: 'Optional override for OAuth scopes. Defaults to full Gmail access.',
                items: { type: 'string' },
              },
            },
            required: ['serviceAccountJson'],
            additionalProperties: false,
          },
          injection: { headers: { Authorization: 'Bearer {{token}}' } },
          preprocess: 'google_service_account',
        },
        oauth_token: {
          label: 'OAuth Access Token (short-lived)',
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                title: 'OAuth Access Token',
                description: 'Short-lived Google OAuth access token with Gmail scopes.',
              },
            },
            required: ['token'],
            additionalProperties: false,
          },
          injection: { headers: { Authorization: 'Bearer {{token}}' } },
        },
      },
      default: 'service_account',
    },
    hints: {
      service_account: `Set up a Google Cloud Service Account:

1. Enable the Gmail API
2. Go to IAM & Admin -> Service Accounts and create a new service account
3. Download a JSON key and paste its full contents here
4. For Google Workspace mailboxes, configure domain-wide delegation and set \`subject\` to the target user's email`,
      oauth_token: `Obtain a short-lived Google OAuth access token with scopes such as:
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/gmail.send

Note: OAuth access tokens expire (typically after 1 hour). Prefer Service Account for long-running use.`,
    },
  },

  notion: {
    variants: {
      variants: {
        internal_integration: {
          label: 'Internal Integration Token',
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                title: 'Internal Integration Token',
                description: 'Notion internal integration token (starts with "secret_").',
              },
            },
            required: ['token'],
            additionalProperties: false,
          },
          injection: {
            headers: {
              Authorization: 'Bearer {{token}}',
              'Notion-Version': '2022-06-28',
            },
          },
        },
      },
      default: 'internal_integration',
    },
    hints: {
      internal_integration: `1. Go to https://www.notion.so/profile/integrations/internal
2. Create a Notion integration in Notion's developer settings
3. Share your target pages/databases with that integration so it has access
4. Copy the Internal Integration Token (usually starts with \`secret_\`)`,
    },
  },

  trello: {
    variants: {
      variants: {
        api_key_token: {
          label: 'API Key + Token',
          schema: {
            type: 'object',
            properties: {
              apiKey: {
                type: 'string',
                title: 'API Key',
                description: 'Your Trello API key from https://trello.com/power-ups/admin',
              },
              apiToken: {
                type: 'string',
                title: 'API Token',
                description: 'Your Trello API token ("token" param). Generate one via Trello\'s authorize flow.',
              },
            },
            required: ['apiKey', 'apiToken'],
            additionalProperties: false,
          },
          injection: {
            query: {
              key: '{{apiKey}}',
              token: '{{apiToken}}',
            },
          },
        },
      },
      default: 'api_key_token',
    },
    hints: {
      api_key_token: `1. Go to https://trello.com/power-ups/admin
2. Create a new app
3. Navigate to API Key and copy your API key
4. Click Generate a Token and copy the token value`,
    },
  },
}
