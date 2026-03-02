import TurndownService from 'turndown'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})

const decodeHtmlEntities = (s) => {
  if (!s) return ''
  return String(s)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => {
      try { return String.fromCodePoint(parseInt(hex, 16)) } catch { return '' }
    })
    .replace(/&#([0-9]+);/g, (_m, dec) => {
      try { return String.fromCodePoint(parseInt(dec, 10)) } catch { return '' }
    })
}

const stripTagsToText = (html) => {
  const raw = String(html || '')
  const noTags = raw
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
  return decodeHtmlEntities(noTags)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

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

export default (integration) => async (input) => {
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

  let contentMarkdown = ''
  if (storageValue) {
    try { contentMarkdown = turndown.turndown(String(storageValue)) } catch { contentMarkdown = '' }
  }
  const contentText = storageValue ? stripTagsToText(storageValue) : ''

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

