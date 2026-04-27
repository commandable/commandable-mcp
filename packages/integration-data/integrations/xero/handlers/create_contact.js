async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const getShortCode = async () => {
    try {
      const orgRes = await integration.get('/api.xro/2.0/Organisation', { headers })
      const orgData = await orgRes.json()
      return Array.isArray(orgData?.Organisations) ? orgData.Organisations[0]?.ShortCode : ''
    }
    catch {
      return ''
    }
  }
  const summarizeContact = async (contact) => {
    const contactId = contact?.ContactID || ''
    const shortCode = contactId ? await getShortCode() : ''
    return {
      contactId,
      name: contact?.Name,
      emailAddress: contact?.EmailAddress,
      contactStatus: contact?.ContactStatus,
      isCustomer: contact?.IsCustomer,
      isSupplier: contact?.IsSupplier,
      xeroUrl: shortCode && contactId ? `https://go.xero.com/app/${encodeURIComponent(shortCode)}/contacts/contact/${encodeURIComponent(contactId)}` : null,
    }
  }
  const contact = {
    ...(input.name ? { Name: input.name } : {}),
    ...(input.emailAddress ? { EmailAddress: input.emailAddress } : {}),
    ...(input.firstName ? { FirstName: input.firstName } : {}),
    ...(input.lastName ? { LastName: input.lastName } : {}),
    ...(input.extraFields || {}),
  }
  const res = await integration.post('/api.xro/2.0/Contacts', { Contacts: [contact] }, { headers })
  const data = await res.json()
  const created = Array.isArray(data?.Contacts) ? data.Contacts[0] : null
  return {
    contact: created ? await summarizeContact(created) : null,
  }
}
