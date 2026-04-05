async (input) => {
  const params = new URLSearchParams()
  params.set('$select', input.includeSystem
    ? 'id,name,webUrl,driveType,createdDateTime,lastModifiedDateTime,system'
    : 'id,name,webUrl,driveType,createdDateTime,lastModifiedDateTime')
  if (input.top)
    params.set('$top', String(input.top))

  const res = await integration.fetch(`/sites/${encodeURIComponent(input.siteId)}/drives?${params.toString()}`)
  const data = await res.json()
  const drives = Array.isArray(data?.value)
    ? data.value.map(drive => ({
        id: drive.id,
        name: drive.name || null,
        webUrl: drive.webUrl || null,
        driveType: drive.driveType || null,
        createdDateTime: drive.createdDateTime || null,
        lastModifiedDateTime: drive.lastModifiedDateTime || null,
        isSystem: Boolean(drive.system),
      }))
    : []

  return {
    siteId: input.siteId,
    drives,
    nextLink: data?.['@odata.nextLink'] || null,
  }
}
