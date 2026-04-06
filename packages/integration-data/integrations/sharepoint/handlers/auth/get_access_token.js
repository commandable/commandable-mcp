async (creds, utils) => {
  const tenantId = String(creds?.tenantId || '').trim()
  const clientId = String(creds?.clientId || '').trim()
  const clientSecret = String(creds?.clientSecret || '').trim()

  if (!tenantId)
    throw new Error('Missing tenantId')
  if (!clientId)
    throw new Error('Missing clientId')
  if (!clientSecret)
    throw new Error('Missing clientSecret')

  const response = await utils.tokenFetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
    {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
      }),
    },
  )

  const data = await response.json()
  if (!response.ok) {
    const message = typeof data?.error_description === 'string'
      ? data.error_description
      : (typeof data?.error === 'string' ? data.error : `Token request failed with status ${response.status}`)
    throw new Error(message)
  }

  const token = typeof data?.access_token === 'string' ? data.access_token : ''
  if (!token)
    throw new Error('Microsoft token response did not include access_token')

  return {
    token,
    expiresIn: data?.expires_in,
  }
}
