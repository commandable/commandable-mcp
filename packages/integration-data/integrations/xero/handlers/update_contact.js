async (input) => {
  if (!input.contactId)
    throw new Error('contactId is required for update_contact')
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const contact = {
    ContactID: input.contactId,
    ...(input.name ? { Name: input.name } : {}),
    ...(input.emailAddress ? { EmailAddress: input.emailAddress } : {}),
    ...(input.firstName ? { FirstName: input.firstName } : {}),
    ...(input.lastName ? { LastName: input.lastName } : {}),
    ...(input.contact || {}),
  }
  const res = await integration.post(`/api.xro/2.0/Contacts/${encodeURIComponent(input.contactId)}`, { Contacts: [contact] }, { headers })
  const data = await res.json()
  return {
    contact: Array.isArray(data?.Contacts) ? data.Contacts[0] : null,
  }
}
