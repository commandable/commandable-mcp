async (input) => {
  const fields = [
    'id',
    'name',
    'desc',
    'idBoard',
    'idList',
    'shortLink',
    'shortUrl',
    'url',
    'closed',
    'due',
    'dateLastActivity',
    'labels',
    'pos',
  ].join(',')
  const res = await integration.fetch(`/boards/${input.boardId}/cards?fields=${encodeURIComponent(fields)}`)
  const raw = await res.json()
  const cards = Array.isArray(raw)
    ? raw.map(card => ({
      id: card.id,
      name: card.name,
      idBoard: card.idBoard || null,
      idList: card.idList || null,
      url: card.url || card.shortUrl || (card.shortLink ? `https://trello.com/c/${card.shortLink}` : null),
      shortLink: card.shortLink || null,
      closed: !!card.closed,
      due: card.due || null,
      lastActivity: card.dateLastActivity || null,
      position: card.pos ?? null,
      labels: Array.isArray(card.labels)
        ? card.labels.map(label => ({ id: label.id, name: label.name || null, color: label.color || null }))
        : [],
      descriptionPreview: typeof card.desc === 'string' && card.desc.trim()
        ? (card.desc.trim().length <= 200 ? card.desc.trim() : `${card.desc.trim().slice(0, 199)}...`)
        : null,
    }))
    : []
  return {
    boardId: input.boardId,
    count: cards.length,
    note: 'Use card id with get_card for full card details.',
    cards,
  }
}
