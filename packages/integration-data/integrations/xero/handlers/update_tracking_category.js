async (input) => {
  if (!input.trackingCategoryId)
    throw new Error('trackingCategoryId is required for update_tracking_category')
  if (!input.name && !input.status)
    throw new Error('Provide name or status for update_tracking_category')

  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const body = {
    ...(input.name ? { Name: input.name } : {}),
    ...(input.status ? { Status: input.status } : {}),
  }
  const res = await integration.post(
    `/api.xro/2.0/TrackingCategories/${encodeURIComponent(input.trackingCategoryId)}`,
    body,
    { headers },
  )
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
