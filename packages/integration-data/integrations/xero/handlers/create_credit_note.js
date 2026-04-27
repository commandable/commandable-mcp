async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const today = new Date().toISOString().slice(0, 10)
  const mapLineItem = item => ({
    Description: item.description,
    Quantity: item.quantity,
    UnitAmount: item.unitAmount,
    AccountCode: item.accountCode,
    TaxType: item.taxType,
  })
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
  const summarizeCreditNote = async (note) => {
    const creditNoteId = note?.CreditNoteID || ''
    const shortCode = creditNoteId ? await getShortCode() : ''
    return {
      creditNoteId,
      creditNoteNumber: note?.CreditNoteNumber,
      type: note?.Type,
      status: note?.Status,
      contact: note?.Contact ? { contactId: note.Contact.ContactID, name: note.Contact.Name } : null,
      date: note?.DateString || note?.Date,
      total: note?.Total,
      remainingCredit: note?.RemainingCredit,
      xeroUrl: shortCode && creditNoteId ? `https://go.xero.com/organisationlogin/default.aspx?shortcode=${encodeURIComponent(shortCode)}&redirecturl=/AccountsPayable/ViewCreditNote.aspx?creditNoteID=${encodeURIComponent(creditNoteId)}` : null,
    }
  }
  const creditNote = {
    Type: input.type || 'ACCRECCREDIT',
    Contact: { ContactID: input.contactId },
    LineItems: input.lineItems.map(mapLineItem),
    Date: input.date || today,
    Status: input.status || 'DRAFT',
    ...(input.reference ? { Reference: input.reference } : {}),
    ...(input.extraFields || {}),
  }
  const res = await integration.post('/api.xro/2.0/CreditNotes', { CreditNotes: [creditNote] }, { headers })
  const data = await res.json()
  const created = Array.isArray(data?.CreditNotes) ? data.CreditNotes[0] : null
  return {
    creditNote: created ? await summarizeCreditNote(created) : null,
  }
}
