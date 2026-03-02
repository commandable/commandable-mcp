import { adfToMarkdown, adfToPlainText } from './adf_helpers.js'

export default (integration) => async (input) => {
  const defaultFields = [
    'summary',
    'status',
    'assignee',
    'priority',
    'issuetype',
    'project',
    'description',
    'created',
    'updated',
    'labels',
  ]

  const fields = Array.isArray(input.fields) && input.fields.length ? input.fields : defaultFields
  const params = new URLSearchParams()
  if (fields?.length)
    params.set('fields', fields.join(','))
  if (Array.isArray(input.expand) && input.expand.length)
    params.set('expand', input.expand.join(','))

  const path = `/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}${params.toString() ? `?${params.toString()}` : ''}`
  const res = await integration.fetch(path)
  const data = await res.json()

  const descAdf = data?.fields?.description
  const descMarkdown = adfToMarkdown(descAdf)
  const descText = descMarkdown ? '' : adfToPlainText(descAdf)

  return {
    id: data.id ?? null,
    key: data.key ?? null,
    self: data.self ?? null,
    summary: data.fields?.summary ?? null,
    status: data.fields?.status
      ? {
          id: data.fields.status.id ?? null,
          name: data.fields.status.name ?? null,
          category: data.fields.status.statusCategory
            ? {
                key: data.fields.status.statusCategory.key ?? null,
                name: data.fields.status.statusCategory.name ?? null,
              }
            : null,
        }
      : null,
    assignee: data.fields?.assignee
      ? {
          accountId: data.fields.assignee.accountId ?? null,
          displayName: data.fields.assignee.displayName ?? null,
        }
      : null,
    priority: data.fields?.priority ? { id: data.fields.priority.id ?? null, name: data.fields.priority.name ?? null } : null,
    issueType: data.fields?.issuetype ? { id: data.fields.issuetype.id ?? null, name: data.fields.issuetype.name ?? null } : null,
    project: data.fields?.project ? { id: data.fields.project.id ?? null, key: data.fields.project.key ?? null, name: data.fields.project.name ?? null } : null,
    labels: Array.isArray(data.fields?.labels) ? data.fields.labels : [],
    descriptionMarkdown: descMarkdown || null,
    descriptionText: descMarkdown ? null : (descText || null),
    created: data.fields?.created ?? null,
    updated: data.fields?.updated ?? null,
  }
}

