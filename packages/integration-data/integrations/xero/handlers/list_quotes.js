async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const params = new URLSearchParams()
  if (input.page) params.set('page', String(input.page))
  if (input.where) params.set('where', input.where)
  if (input.order) params.set('order', input.order)
  if (input.status) params.set('Statuses', input.status)
  if (input.modifiedAfter) params.set('If-Modified-Since', input.modifiedAfter)
  const res = await integration.get(`/api.xro/2.0/Quotes${params.toString() ? `?${params}` : ''}`, { headers })
  const data = await res.json()
  const quotes = Array.isArray(data?.Quotes) ? data.Quotes : []
  return {
    quotes: quotes.map(quote => ({
      quoteId: quote.QuoteID,
      quoteNumber: quote.QuoteNumber,
      status: quote.Status,
      contact: quote.Contact ? { contactId: quote.Contact.ContactID, name: quote.Contact.Name } : null,
      date: quote.DateString || quote.Date,
      expiryDate: quote.ExpiryDateString || quote.ExpiryDate,
      total: quote.Total,
      currencyCode: quote.CurrencyCode,
      updatedDateUtc: quote.UpdatedDateUTC,
    })),
    count: quotes.length,
    page: input.page || 1,
  }
}
