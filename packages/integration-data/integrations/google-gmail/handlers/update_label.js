async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const labelId = encodeURIComponent(input.labelId)
  const body = {}
  if (input.name !== undefined)
    body.name = input.name
  if (input.messageListVisibility !== undefined)
    body.messageListVisibility = input.messageListVisibility
  if (input.labelListVisibility !== undefined)
    body.labelListVisibility = input.labelListVisibility
  if (input.color !== undefined)
    body.color = input.color
  const res = await integration.fetch(`/users/${userId}/labels/${labelId}`, { method: 'PATCH', body })
  return await res.json()
}
