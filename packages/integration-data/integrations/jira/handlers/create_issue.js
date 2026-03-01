(() => {
  function normalizeNewlines(s) {
    return String(s ?? '').replace(/\r\n/g, '\n')
  }

  function textToAdf(text) {
    const s = normalizeNewlines(text || '').trim()
    if (!s) {
      return {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [] }],
      }
    }
    const paragraphs = s.split(/\n{2,}/g).map(p => p.trim()).filter(Boolean)
    return {
      type: 'doc',
      version: 1,
      content: paragraphs.map(p => ({
        type: 'paragraph',
        content: [{ type: 'text', text: p }],
      })),
    }
  }

  return async (input) => {
    const fields = {
      project: { key: input.projectKey },
      summary: input.summary,
    }

    if (input.descriptionText)
      fields.description = textToAdf(input.descriptionText)

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
})()

