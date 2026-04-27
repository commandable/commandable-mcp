async (input) => {
  if (!input.trackingCategoryId)
    throw new Error('trackingCategoryId is required for create_tracking_options')
  if (!Array.isArray(input.optionNames) || !input.optionNames.length)
    throw new Error('optionNames is required for create_tracking_options')
  if (input.optionNames.length > 10)
    throw new Error('create_tracking_options accepts at most 10 optionNames per call')

  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const created = []
  for (const optionName of input.optionNames) {
    const res = await integration.put(
      `/api.xro/2.0/TrackingCategories/${encodeURIComponent(input.trackingCategoryId)}/Options`,
      { Name: optionName },
      { headers },
    )
    const data = await res.json()
    const option = Array.isArray(data?.Options) ? data.Options[0] : null
    if (option) {
      created.push({
        trackingOptionId: option.TrackingOptionID,
        name: option.Name,
        status: option.Status,
      })
    }
  }

  return {
    createdCount: created.length,
    requestedCount: input.optionNames.length,
    trackingOptions: created,
  }
}
