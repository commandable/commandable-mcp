async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const contact = {
    ...(input.name ? { Name: input.name } : {}),
    ...(input.emailAddress ? { EmailAddress: input.emailAddress } : {}),
    ...(input.firstName ? { FirstName: input.firstName } : {}),
    ...(input.lastName ? { LastName: input.lastName } : {}),
    ...(input.contact || {}),
  }
  const res = await integration.post('/api.xro/2.0/Contacts', { Contacts: [contact] }, { headers })
  const data = await res.json()
  return {
    contact: Array.isArray(data?.Contacts) ? data.Contacts[0] : null,
  }
}
