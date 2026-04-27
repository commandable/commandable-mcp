async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  if (input.raw && !input.draftId) {
    const message = { raw: input.raw }
    if (input.threadId)
      message.threadId = input.threadId
    if (Array.isArray(input.labelIds))
      message.labelIds = input.labelIds
    const res = await integration.fetch(`/users/${userId}/messages/send`, { method: 'POST', body: message })
    return await res.json()
  }

  const body = {}
  if (input.draftId)
    body.id = input.draftId
  if (input.raw) {
    body.message = { raw: input.raw }
    if (input.threadId)
      body.message.threadId = input.threadId
    if (Array.isArray(input.labelIds))
      body.message.labelIds = input.labelIds
  }
  const res = await integration.fetch(`/users/${userId}/drafts/send`, { method: 'POST', body })
  return await res.json()
}
