async (input) => {
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.get('/api.xro/2.0/TrackingCategories', { headers })
  const data = await res.json()
  const categories = Array.isArray(data?.TrackingCategories) ? data.TrackingCategories : []

  return {
    trackingCategories: categories.map(category => ({
      trackingCategoryId: category.TrackingCategoryID,
      name: category.Name,
      status: category.Status,
      options: Array.isArray(category.Options)
        ? category.Options.map(option => ({
            trackingOptionId: option.TrackingOptionID,
            name: option.Name,
            status: option.Status,
          }))
        : [],
    })),
    count: categories.length,
  }
}
