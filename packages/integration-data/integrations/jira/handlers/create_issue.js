import { markdownToAdf } from './adf_helpers.js'

export default (integration) => async (input) => {
  const fields = {
    project: { key: input.projectKey },
    summary: input.summary,
  }

  if (input.descriptionText)
    fields.description = markdownToAdf(input.descriptionText)

  if (input.issueTypeId)
    fields.issuetype = { id: input.issueTypeId }
  else if (input.issueTypeName)
    fields.issuetype = { name: input.issueTypeName }

  if (input.priorityId)
    fields.priority = { id: input.priorityId }
  else if (input.priorityName)
    fields.priority = { name: input.priorityName }

  if (Array.isArray(input.labels))
    fields.labels = input.labels

  if (input.assigneeAccountId)
    fields.assignee = { accountId: input.assigneeAccountId }

  const res = await integration.fetch('/rest/api/3/issue', {
    method: 'POST',
    body: { fields },
  })

  return await res.json()
}

