async (input) => {
  if (!input.name)
    throw new Error('name is required for create_tracking_category')
  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const res = await integration.put('/api.xro/2.0/TrackingCategories', { Name: input.name }, { headers })
  const data = await res.json()
  const category = Array.isArray(data?.TrackingCategories) ? data.TrackingCategories[0] : null

  return {
    trackingCategory: category
      ? {
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
        }
      : null,
  }
}
