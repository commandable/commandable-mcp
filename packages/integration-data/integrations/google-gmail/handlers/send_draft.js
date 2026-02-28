async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
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
