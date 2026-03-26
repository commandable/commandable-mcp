async (input) => {
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
  const res = await integration.fetch(`/organizations/${input.orgId}/boards?fields=${encodeURIComponent(fields)}`)
  const raw = await res.json()
  const boards = Array.isArray(raw)
    ? raw.map(b => ({
      id: b.id,
      name: b.name,
      url: b.url || b.shortUrl || (b.shortLink ? `https://trello.com/b/${b.shortLink}` : null),
      shortLink: b.shortLink || null,
      closed: !!b.closed,
      starred: !!b.starred,
      workspaceId: b.idOrganization || null,
      lastActivity: b.dateLastActivity || null,
      descriptionPreview: typeof b.desc === 'string' && b.desc.trim()
        ? (b.desc.trim().length <= 200 ? b.desc.trim() : `${b.desc.trim().slice(0, 199)}...`)
        : null,
    }))
    : []
  return {
    orgId: input.orgId,
    count: boards.length,
    note: 'Use board id with get_board for full board details.',
    boards,
  }
}
