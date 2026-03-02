async (input) => {
  const fields = { ...(input.fields || {}) }
  const update = input.update ? { ...(input.update || {}) } : undefined

  if (typeof input.summary === 'string')
    fields.summary = input.summary

  if (typeof input.descriptionText === 'string')
    fields.description = utils.adf?.fromMarkdown(input.descriptionText)

  if (Array.isArray(input.labels))
    fields.labels = input.labels

  if (input.priorityId)
    fields.priority = { id: input.priorityId }
  else if (input.priorityName)
    fields.priority = { name: input.priorityName }

  if (input.assigneeAccountId !== undefined) {
    fields.assignee = input.assigneeAccountId === null
      ? null
      : { accountId: input.assigneeAccountId }
  }

  const body = {}
  if (Object.keys(fields).length)
    body.fields = fields
  if (update && Object.keys(update).length)
    body.update = update

  const res = await integration.fetch(`/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}`, {
    method: 'PUT',
    body,
  })

  if (res.status === 204)
    return { success: true }
  return await res.json()
}

