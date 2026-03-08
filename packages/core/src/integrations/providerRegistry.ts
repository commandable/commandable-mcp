export const PROVIDERS: Record<string, any> = {
  'trello': {
    baseUrl: 'https://api.trello.com/1',
    makeAuth: (token: string, apiKey: string) => ({ key: apiKey, token }),
  },
  // 'slack': {
  //   baseUrl: 'https://slack.com/api',
  //   makeAuth: (token: string) => ({ Authorization: `Bearer ${token}` }),
  // },
  'airtable': {
    baseUrl: 'https://api.airtable.com/v0',
    makeAuth: (token: string) => ({ Authorization: `Bearer ${token}` }),
  },
  'github': {
    baseUrl: 'https://api.github.com',
    makeAuth: (token: string) => ({ Authorization: `Bearer ${token}` }),
  },
  'hubspot': {
    baseUrl: 'https://api.hubapi.com',
    makeAuth: (token: string) => ({ Authorization: `Bearer ${token}` }),
  },
  'notion': {
    baseUrl: 'https://api.notion.com/v1',
    makeAuth: (token: string) => ({
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
    }),
  },
  'google-calendar': {
    baseUrl: 'https://www.googleapis.com/calendar/v3',
    makeAuth: (token: string) => ({ Authorization: `Bearer ${token}` }),
  },
  'google-sheet': {
    baseUrl: 'https://sheets.googleapis.com/v4',
    makeAuth: (token: string) => ({ Authorization: `Bearer ${token}` }),
  },
  'google-docs': {
    baseUrl: 'https://docs.googleapis.com/v1',
    makeAuth: (token: string) => ({ Authorization: `Bearer ${token}` }),
  },
  'google-slides': {
    baseUrl: 'https://slides.googleapis.com/v1',
    makeAuth: (token: string) => ({ Authorization: `Bearer ${token}` }),
  },
  'google-drive': {
    baseUrl: 'https://www.googleapis.com/drive/v3',
    makeAuth: (token: string) => ({ Authorization: `Bearer ${token}` }),
  },
  'google-gmail': {
    baseUrl: 'https://gmail.googleapis.com/gmail/v1',
    makeAuth: (token: string) => ({ Authorization: `Bearer ${token}` }),
  },
  'jira': {
    baseUrl: (integration: any, creds?: any) => {
      const cloudId = creds?.cloudId || integration?.config?.cloudId || integration?.config?.sub
      return cloudId
        ? `https://api.atlassian.com/ex/jira/${cloudId}`
        : 'https://api.atlassian.com/ex/jira'
    },
    makeAuth: (token: string) => ({ Authorization: `Bearer ${token}` }),
  },
  'confluence': {
    baseUrl: (integration: any, creds?: any) => {
      const cloudId = creds?.cloudId || integration?.config?.cloudId || integration?.config?.sub
      return cloudId
        ? `https://api.atlassian.com/ex/confluence/${cloudId}`
        : 'https://api.atlassian.com/ex/confluence'
    },
    makeAuth: (token: string) => ({ Authorization: `Bearer ${token}` }),
  },
}

