async (creds, utils) => {
  const clientId = String(creds?.clientId || '').trim()
  const clientSecret = String(creds?.clientSecret || '').trim()
  const defaultScopes = [
    'accounting.settings.read',
    'accounting.contacts',
    'accounting.invoices',
    'accounting.payments',
    'accounting.banktransactions',
    'accounting.manualjournals',
    'accounting.attachments.read',
    'accounting.reports.aged.read',
    'accounting.reports.balancesheet.read',
    'accounting.reports.banksummary.read',
    'accounting.reports.budgetsummary.read',
    'accounting.reports.profitandloss.read',
    'accounting.reports.trialbalance.read',
  ].join(' ')
  const scopes = String(creds?.scopes || defaultScopes).trim()

  if (!clientId)
    throw new Error('Missing clientId')
  if (!clientSecret)
    throw new Error('Missing clientSecret')

  const response = await utils.tokenFetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: scopes,
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    const message = typeof data?.error_description === 'string'
      ? data.error_description
      : (typeof data?.error === 'string' ? data.error : `Token request failed with status ${response.status}`)
    throw new Error(message)
  }

  const token = typeof data?.access_token === 'string' ? data.access_token : ''
  if (!token)
    throw new Error('Xero token response did not include access_token')

  return {
    token,
    expiresIn: data?.expires_in,
  }
}
