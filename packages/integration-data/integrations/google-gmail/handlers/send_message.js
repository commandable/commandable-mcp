async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const body = { raw: input.raw }
  if (input.threadId)
    body.threadId = input.threadId
  if (Array.isArray(input.labelIds))
    body.labelIds = input.labelIds
  const res = await integration.fetch(`/users/${userId}/messages/send`, { method: 'POST', body })
  return await res.json()
}
