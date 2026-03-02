export default (integration) => async (input) => {
  const spaceId = encodeURIComponent(String(input.spaceId))
  const params = new URLSearchParams()
  if (input.includePermissions) params.set('include-permissions', 'true')

  const path = `/wiki/api/v2/spaces/${spaceId}${params.toString() ? `?${params}` : ''}`
  const res = await integration.fetch(path)
  const data = await res.json()

  return {
    id: data?.id,
    key: data?.key,
    name: data?.name,
    type: data?.type,
    status: data?.status,
    homepageId: data?.homepageId,
    description: data?.description,
    links: data?._links || {},
    raw: data,
  }
}

