async (input) => {
  const fileId = encodeURIComponent(input.fileId)
  const params = new URLSearchParams()
  if (input.sendNotificationEmail !== undefined)
    params.set('sendNotificationEmail', String(input.sendNotificationEmail))
  if (input.emailMessage)
    params.set('emailMessage', input.emailMessage)
  const body = {
    role: input.role,
    type: input.type,
  }
  if (input.emailAddress) body.emailAddress = input.emailAddress
  if (input.domain) body.domain = input.domain
  const qs = params.toString()
  const res = await integration.fetch(`/files/${fileId}/permissions${qs ? `?${qs}` : ''}`, {
    method: 'POST',
    body,
  })
  return await res.json()
}
