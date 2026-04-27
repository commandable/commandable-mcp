async (input) => {
  if (!input.trackingCategoryId)
    throw new Error('trackingCategoryId is required for update_tracking_options')
  if (!input.trackingOptionId)
    throw new Error('trackingOptionId is required for update_tracking_options')
  if (!input.name && !input.status)
    throw new Error('Provide name or status for update_tracking_options')

  const headers = input.tenantId ? { 'xero-tenant-id': input.tenantId } : {}
  const body = {
    ...(input.name ? { Name: input.name } : {}),
    ...(input.status ? { Status: input.status } : {}),
  }
  const res = await integration.post(
    `/api.xro/2.0/TrackingCategories/${encodeURIComponent(input.trackingCategoryId)}/Options/${encodeURIComponent(input.trackingOptionId)}`,
    body,
    { headers },
  )
  const data = await res.json()
  const option = Array.isArray(data?.Options) ? data.Options[0] : null

  return {
    trackingOption: option
      ? {
          trackingOptionId: option.TrackingOptionID,
          name: option.Name,
          status: option.Status,
        }
      : null,
  }
}
