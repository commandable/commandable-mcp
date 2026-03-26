async (input) => {
  const params = new URLSearchParams({ query: input.query })
  const res = await integration.fetch(`/search?${params.toString()}`)
  const data = await res.json()

  const boards = Array.isArray(data?.boards)
    ? data.boards.map(board => ({
      id: board.id,
      name: board.name,
      shortLink: board.shortLink || null,
      url: board.url || (board.shortLink ? `https://trello.com/b/${board.shortLink}` : null),
      closed: !!board.closed,
    }))
    : []

  const cards = Array.isArray(data?.cards)
    ? data.cards.map(card => ({
      id: card.id,
      name: card.name,
      idBoard: card.idBoard || null,
      idList: card.idList || null,
      shortLink: card.shortLink || null,
      url: card.url || card.shortUrl || (card.shortLink ? `https://trello.com/c/${card.shortLink}` : null),
      closed: !!card.closed,
    }))
    : []

  return {
    query: input.query,
    count: boards.length + cards.length,
    boardCount: boards.length,
    cardCount: cards.length,
    note: 'Use get_board with board id or get_card with card id for full details.',
    boards,
    cards,
  }
}
