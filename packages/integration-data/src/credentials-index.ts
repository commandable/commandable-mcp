/**
 * Static, browser-safe export of all integration credential configs and hints.
 * Import this from @commandable/integration-data/credentials in browser/Vite contexts
 * where Node.js fs access is not available.
 */

export interface CredentialConfig {
  schema: {
    type: string
    properties: Record<string, {
      type: string
      title?: string
      description?: string
      items?: { type: string }
    }>
    required: string[]
    additionalProperties: boolean
  }
  injection: {
    headers?: Record<string, string>
    query?: Record<string, string>
  }
}

export interface IntegrationCredentials {
  config: CredentialConfig
  hint: string
}

export const credentialConfigs: Record<string, IntegrationCredentials> = {
  airtable: {
    config: {
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
      injection: {
        headers: { Authorization: 'Bearer {{token}}' },
      },
    },
    hint: `Create an Airtable personal access token and paste it here.

You can generate one in Airtable account settings under developer tools / personal access tokens.
`,
  },

  github: {
    config: {
      schema: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            title: 'Personal Access Token',
            description: 'GitHub personal access token (classic or fine-grained) with appropriate scopes.',
          },
        },
        required: ['token'],
        additionalProperties: false,
      },
      injection: {
        headers: { Authorization: 'Bearer {{token}}' },
      },
    },
    hint: `Create a GitHub personal access token and paste it here.

- Fine-grained PAT: Settings → Developer settings → Personal access tokens → Fine-grained tokens
- Classic PAT: Settings → Developer settings → Personal access tokens → Tokens (classic)

Minimum scopes depend on the tools you use (repo read/write, issues, pull requests, etc.).
`,
  },

  'google-calendar': {
    config: {
      schema: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            title: 'OAuth Access Token (optional)',
            description: 'Google OAuth access token to use as a Bearer token (typically short-lived).',
          },
          serviceAccountJson: {
            type: 'string',
            title: 'Service Account JSON (recommended)',
            description: 'Full service account key JSON (contents of the downloaded JSON file).',
          },
          subject: {
            type: 'string',
            title: 'Subject / impersonated user (optional)',
            description: 'Optional user email to impersonate when using Google Workspace domain-wide delegation.',
          },
          scopes: {
            type: 'array',
            title: 'OAuth scopes (optional)',
            description: 'Optional override for OAuth scopes.',
            items: { type: 'string' },
          },
        },
        required: [],
        additionalProperties: false,
      },
      injection: {
        headers: { Authorization: 'Bearer {{token}}' },
      },
    },
    hint: `Recommended: use a Google service account.

- Create a service account in Google Cloud
- Download a JSON key
- Paste the JSON into \`serviceAccountJson\` (or use \`env:GOOGLE_SERVICE_ACCOUNT_JSON\`)

Note: Calendar often needs Google Workspace domain-wide delegation if you want to impersonate a user (\`subject\`).
For simple setups, use a short-lived OAuth access token in \`token\`.
`,
  },

  'google-docs': {
    config: {
      schema: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            title: 'OAuth Access Token (optional)',
            description: 'Google OAuth access token to use as a Bearer token (typically short-lived).',
          },
          serviceAccountJson: {
            type: 'string',
            title: 'Service Account JSON (recommended)',
            description: 'Full service account key JSON (contents of the downloaded JSON file).',
          },
          subject: {
            type: 'string',
            title: 'Subject / impersonated user (optional)',
            description: 'Optional user email to impersonate when using Google Workspace domain-wide delegation.',
          },
          scopes: {
            type: 'array',
            title: 'OAuth scopes (optional)',
            description: 'Optional override for OAuth scopes.',
            items: { type: 'string' },
          },
        },
        required: [],
        additionalProperties: false,
      },
      injection: {
        headers: { Authorization: 'Bearer {{token}}' },
      },
    },
    hint: `Recommended: use a Google service account.

- Create a service account in Google Cloud
- Download a JSON key
- Paste the JSON into \`serviceAccountJson\` (or use \`env:GOOGLE_SERVICE_ACCOUNT_JSON\`)
- Share your test document with the service account \`client_email\`

You can also paste a short-lived OAuth access token into \`token\`, but it will expire.
`,
  },

  'google-sheet': {
    config: {
      schema: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            title: 'OAuth Access Token (optional)',
            description: 'Google OAuth access token to use as a Bearer token (typically short-lived).',
          },
          serviceAccountJson: {
            type: 'string',
            title: 'Service Account JSON (recommended)',
            description: 'Full service account key JSON (contents of the downloaded JSON file).',
          },
          subject: {
            type: 'string',
            title: 'Subject / impersonated user (optional)',
            description: 'Optional user email to impersonate when using Google Workspace domain-wide delegation.',
          },
          scopes: {
            type: 'array',
            title: 'OAuth scopes (optional)',
            description: 'Optional override for OAuth scopes.',
            items: { type: 'string' },
          },
        },
        required: [],
        additionalProperties: false,
      },
      injection: {
        headers: { Authorization: 'Bearer {{token}}' },
      },
    },
    hint: `Recommended: use a Google service account.

- Create a service account in Google Cloud
- Download a JSON key
- Paste the JSON into \`serviceAccountJson\` (or use \`env:GOOGLE_SERVICE_ACCOUNT_JSON\`)
- Share your test spreadsheet with the service account \`client_email\`

You can also paste a short-lived OAuth access token into \`token\`, but it will expire.
`,
  },

  'google-slides': {
    config: {
      schema: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            title: 'OAuth Access Token (optional)',
            description: 'Google OAuth access token to use as a Bearer token (typically short-lived).',
          },
          serviceAccountJson: {
            type: 'string',
            title: 'Service Account JSON (recommended)',
            description: 'Full service account key JSON (contents of the downloaded JSON file).',
          },
          subject: {
            type: 'string',
            title: 'Subject / impersonated user (optional)',
            description: 'Optional user email to impersonate when using Google Workspace domain-wide delegation.',
          },
          scopes: {
            type: 'array',
            title: 'OAuth scopes (optional)',
            description: 'Optional override for OAuth scopes.',
            items: { type: 'string' },
          },
        },
        required: [],
        additionalProperties: false,
      },
      injection: {
        headers: { Authorization: 'Bearer {{token}}' },
      },
    },
    hint: `Recommended: use a Google service account.

- Create a service account in Google Cloud
- Download a JSON key
- Paste the JSON into \`serviceAccountJson\` (or use \`env:GOOGLE_SERVICE_ACCOUNT_JSON\`)
- Share your test presentation with the service account \`client_email\`

You can also paste a short-lived OAuth access token into \`token\`, but it will expire.
`,
  },

  notion: {
    config: {
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
    hint: `1. Go to \`https://www.notion.so/profile/integrations/internal\`
2. Create a Notion integration in Notion's developer settings
3. Share your target pages/databases with that integration so it has access
4. Copy the **Internal Integration Token** (usually starts with \`secret_\`)
`,
  },

  trello: {
    config: {
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
    hint: `1. Go to \`https://trello.com/power-ups/admin\`
2. Create a new app
3. Navigate to **API Key** and copy your API key
4. Click **Generate a Token** and copy the token value
`,
  },
}
