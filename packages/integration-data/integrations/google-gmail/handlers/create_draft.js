async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const message = { raw: input.raw }
  if (input.threadId)
    message.threadId = input.threadId
  if (Array.isArray(input.labelIds))
    message.labelIds = input.labelIds
  const res = await integration.fetch(`/users/${userId}/drafts`, { method: 'POST', body: { message } })
  return await res.json()
}
