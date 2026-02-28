async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const body = { name: input.name }
  if (input.messageListVisibility)
    body.messageListVisibility = input.messageListVisibility
  if (input.labelListVisibility)
    body.labelListVisibility = input.labelListVisibility
  if (input.color)
    body.color = input.color
  const res = await integration.fetch(`/users/${userId}/labels`, { method: 'POST', body })
  return await res.json()
}
