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
