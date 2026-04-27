async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const today = new Date().toISOString().slice(0, 10)
  const mapLineItem = item => ({
    Description: item.description,
    Quantity: item.quantity,
    UnitAmount: item.unitAmount,
    AccountCode: item.accountCode,
    TaxType: item.taxType,
    ...(item.itemCode ? { ItemCode: item.itemCode } : {}),
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
  const summarizeQuote = async (quote) => {
    const quoteId = quote?.QuoteID || ''
    const shortCode = quoteId ? await getShortCode() : ''
    return {
      quoteId,
      quoteNumber: quote?.QuoteNumber,
      status: quote?.Status,
      contact: quote?.Contact ? { contactId: quote.Contact.ContactID, name: quote.Contact.Name } : null,
      date: quote?.DateString || quote?.Date,
      expiryDate: quote?.ExpiryDateString || quote?.ExpiryDate,
      total: quote?.Total,
      xeroUrl: shortCode && quoteId ? `https://go.xero.com/app/${encodeURIComponent(shortCode)}/quotes/view/${encodeURIComponent(quoteId)}` : null,
    }
  }
  const quote = {
    Contact: { ContactID: input.contactId },
    LineItems: input.lineItems.map(mapLineItem),
    Date: input.date || today,
    Status: input.status || 'DRAFT',
    ...(input.expiryDate ? { ExpiryDate: input.expiryDate } : {}),
    ...(input.reference ? { Reference: input.reference } : {}),
    ...(input.quoteNumber ? { QuoteNumber: input.quoteNumber } : {}),
    ...(input.title ? { Title: input.title } : {}),
    ...(input.summary ? { Summary: input.summary } : {}),
    ...(input.terms ? { Terms: input.terms } : {}),
    ...(input.extraFields || {}),
  }
  const res = await integration.post('/api.xro/2.0/Quotes', { Quotes: [quote] }, { headers })
  const data = await res.json()
  const created = Array.isArray(data?.Quotes) ? data.Quotes[0] : null
  return {
    quote: created ? await summarizeQuote(created) : null,
  }
}
