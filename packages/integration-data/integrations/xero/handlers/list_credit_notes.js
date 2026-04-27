async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const params = new URLSearchParams()
  if (input.page) params.set('page', String(input.page))
  if (input.where) params.set('where', input.where)
  if (input.order) params.set('order', input.order)
  if (input.status) params.set('Statuses', input.status)
  if (input.modifiedAfter) params.set('If-Modified-Since', input.modifiedAfter)
  const res = await integration.get(`/api.xro/2.0/CreditNotes${params.toString() ? `?${params}` : ''}`, { headers })
  const data = await res.json()
  const creditNotes = Array.isArray(data?.CreditNotes) ? data.CreditNotes : []
  return {
    creditNotes: creditNotes.map(note => ({
      creditNoteId: note.CreditNoteID,
      creditNoteNumber: note.CreditNoteNumber,
      type: note.Type,
      status: note.Status,
      contact: note.Contact ? { contactId: note.Contact.ContactID, name: note.Contact.Name } : null,
      date: note.DateString || note.Date,
      total: note.Total,
      remainingCredit: note.RemainingCredit,
      updatedDateUtc: note.UpdatedDateUTC,
    })),
    count: creditNotes.length,
    page: input.page || 1,
  }
}
