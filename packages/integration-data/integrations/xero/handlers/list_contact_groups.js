async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const path = input.contactGroupId
    ? `/api.xro/2.0/ContactGroups/${encodeURIComponent(input.contactGroupId)}`
    : '/api.xro/2.0/ContactGroups'
  const res = await integration.get(path, { headers })
  const data = await res.json()
  const contactGroups = Array.isArray(data?.ContactGroups) ? data.ContactGroups : []

  return {
    contactGroups: contactGroups.map(group => ({
      contactGroupId: group.ContactGroupID,
      name: group.Name,
      status: group.Status,
      contacts: Array.isArray(group.Contacts)
        ? group.Contacts.map(contact => ({
            contactId: contact.ContactID,
            name: contact.Name,
            emailAddress: contact.EmailAddress,
          }))
        : [],
    })),
  }
}
