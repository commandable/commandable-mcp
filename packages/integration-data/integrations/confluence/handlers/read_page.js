async (input) => {
  const buildWebUrl = (links) => {
    const base = links?.base
    const webui = links?.webui
    if (!webui) return null
    if (/^https?:\/\//.test(webui)) return webui
    if (base && /^https?:\/\//.test(base)) {
      try { return new URL(webui, base).toString() } catch {}
    }
    return webui
  }

  const pageId = encodeURIComponent(String(input.pageId))

  const params = new URLSearchParams()
  params.set('body-format', 'storage')
  if (input.includeLabels) params.set('include-labels', 'true')
  if (input.includeProperties) params.set('include-properties', 'true')

  const res = await integration.fetch(`/wiki/api/v2/pages/${pageId}?${params}`)
  const data = await res.json()

  const storage = data?.body?.storage
  const storageValue = typeof storage === 'string'
    ? storage
    : (typeof storage?.value === 'string' ? storage.value : '')

  const contentMarkdown = storageValue ? utils.htmlToMarkdown(storageValue) : ''
  const contentText = storageValue ? utils.htmlToText(storageValue) : ''

  return {
    id: data?.id,
    title: data?.title,
    spaceId: data?.spaceId,
    parentId: data?.parentId,
    status: data?.status,
    version: data?.version?.number,
    createdAt: data?.createdAt,
    webUrl: buildWebUrl(data?._links),
    labels: data?.labels?.results,
    contentMarkdown: contentMarkdown || null,
    contentText: contentText || null,
    links: data?._links || {},
  }
}

