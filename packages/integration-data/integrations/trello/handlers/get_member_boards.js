async (input) => {
  const truncateDesc = (desc) => {
    if (typeof desc !== 'string' || !desc.trim())
      return null
    const oneLine = desc.replace(/\s+/g, ' ').trim()
    const max = 200
    return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max - 1)}…`
  }

  const fields = [
    'id',
    'name',
    'desc',
    'url',
    'shortUrl',
    'shortLink',
    'dateLastActivity',
    'idOrganization',
    'closed',
    'starred',
  ].join(',')
  const res = await integration.fetch(`/members/me/boards?fields=${encodeURIComponent(fields)}`)
  const raw = await res.json()
  if (!Array.isArray(raw))
    return { count: 0, boards: [], note: 'Unexpected response from Trello; expected a list of boards.' }

  const boards = raw.map((b) => ({
    id: b.id,
    name: b.name,
    url: b.url || b.shortUrl || (b.shortLink ? `https://trello.com/b/${b.shortLink}` : undefined),
    shortLink: b.shortLink,
    closed: !!b.closed,
    starred: !!b.starred,
    workspaceId: b.idOrganization || null,
    lastActivity: b.dateLastActivity || null,
    descriptionPreview: truncateDesc(b.desc),
  }))

  boards.sort((a, b) => {
    if (a.closed !== b.closed)
      return a.closed ? 1 : -1
    if (a.starred !== b.starred)
      return a.starred ? -1 : 1
    return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
  })

  const open = boards.filter((x) => !x.closed).length
  return {
    count: boards.length,
    openCount: open,
    closedCount: boards.length - open,
    note:
      'Use `id` as `boardId` in other Trello tools (lists, cards, labels). `url` is the human-facing board link. Closed boards are archived.',
    boards,
  }
}
