async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.get('/api.xro/2.0/Organisation', { headers })
  const data = await res.json()
  const organisations = Array.isArray(data?.Organisations) ? data.Organisations : []

  return {
    organisations: organisations.map(org => ({
      organisationId: org.OrganisationID,
      name: org.Name,
      legalName: org.LegalName,
      paysTax: org.PaysTax,
      version: org.Version,
      organisationType: org.OrganisationType,
      baseCurrency: org.BaseCurrency,
      countryCode: org.CountryCode,
      shortCode: org.ShortCode,
      timezone: org.Timezone,
      financialYearEndDay: org.FinancialYearEndDay,
      financialYearEndMonth: org.FinancialYearEndMonth,
      salesTaxBasis: org.SalesTaxBasis,
      salesTaxPeriod: org.SalesTaxPeriod,
      defaultSalesTax: org.DefaultSalesTax,
      defaultPurchasesTax: org.DefaultPurchasesTax,
    })),
  }
}
