export const PROVIDERS: Record<string, any> = {
  'http': {
    baseUrl: '',
    makeAuth: () => ({}),
  },
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
  // 'jira': {
  //   baseUrl: (sub: string) => `https://api.atlassian.com/ex/jira/${sub}`,
  //   makeAuth: (token: string) => ({ Authorization: `Bearer ${token}` }),
  // },
}

