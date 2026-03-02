import { adfToMarkdown, adfToPlainText } from './adf_helpers.js'

export default (integration) => async (input) => {
  const params = new URLSearchParams()
  params.set('startAt', String(input.startAt ?? 0))
  params.set('maxResults', String(input.maxResults ?? 50))

  const path = `/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}/comment?${params.toString()}`
  const res = await integration.fetch(path)
  const data = await res.json()
  const comments = Array.isArray(data.comments) ? data.comments : []

  return {
    startAt: data.startAt ?? (input.startAt ?? 0),
    maxResults: data.maxResults ?? (input.maxResults ?? 50),
    total: data.total ?? comments.length,
    comments: comments.map((c) => {
      const md = adfToMarkdown(c.body)
      const text = md ? '' : adfToPlainText(c.body)
      return {
        id: c.id ?? null,
        created: c.created ?? null,
        updated: c.updated ?? null,
        author: c.author
          ? { accountId: c.author.accountId ?? null, displayName: c.author.displayName ?? null }
          : null,
        bodyMarkdown: md || null,
        bodyText: md ? null : (text || null),
      }
    }),
  }
}

