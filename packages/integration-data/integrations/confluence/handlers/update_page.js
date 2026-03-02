export default (integration) => async (input) => {
  const pageId = encodeURIComponent(String(input.pageId))

  // Fetch current page to get current version and preserve defaults.
  const currentRes = await integration.fetch(`/wiki/api/v2/pages/${pageId}`)
  const current = await currentRes.json()

  const currentVersion = Number(current?.version?.number || 0)
  if (!currentVersion)
    throw new Error('Unable to determine current Confluence page version.')

  const nextVersion = currentVersion + 1
  const title = input.title ? String(input.title) : String(current?.title || '')
  if (!title)
    throw new Error('Missing page title (current page has no title and no new title was provided).')

  const body = {
    id: String(current?.id || input.pageId),
    status: String(current?.status || 'current'),
    title,
    body: {
      representation: 'storage',
      value: String(input.bodyStorage),
    },
    version: {
      number: nextVersion,
      message: input.versionMessage ? String(input.versionMessage) : undefined,
      minorEdit: Boolean(input.minorEdit),
    },
  }

  // Remove undefined version message to keep payload clean.
  if (body.version.message === undefined)
    delete body.version.message

  const res = await integration.fetch(`/wiki/api/v2/pages/${pageId}`, {
    method: 'PUT',
    body,
  })
  return await res.json()
}

