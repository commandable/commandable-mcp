async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const params = new URLSearchParams()
  if (input.page) params.set('page', String(input.page))
  if (input.where) params.set('where', input.where)
  if (input.order) params.set('order', input.order)
  if (input.modifiedAfter) params.set('If-Modified-Since', input.modifiedAfter)
  if (input.includeArchived !== undefined) params.set('includeArchived', String(input.includeArchived))
  const res = await integration.get(`/api.xro/2.0/Contacts${params.toString() ? `?${params}` : ''}`, { headers })
  const data = await res.json()
  const contacts = Array.isArray(data?.Contacts) ? data.Contacts : []

  return {
    contacts: contacts.map(contact => ({
      contactId: contact.ContactID,
      name: contact.Name,
      emailAddress: contact.EmailAddress,
      contactStatus: contact.ContactStatus,
      isSupplier: contact.IsSupplier,
      isCustomer: contact.IsCustomer,
      balances: contact.Balances,
      updatedDateUtc: contact.UpdatedDateUTC,
    })),
    count: contacts.length,
    page: input.page || 1,
    next: contacts.length ? 'Call list_contacts with the next page number to continue.' : null,
  }
}
