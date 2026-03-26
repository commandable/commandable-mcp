async (input) => {
  const titleFromProperties = (properties) => {
    if (!properties || typeof properties !== 'object')
      return null
    for (const value of Object.values(properties)) {
      if (value?.type === 'title' && Array.isArray(value.title))
        return value.title.map(x => x?.plain_text || '').join('').trim() || null
    }
    return null
  }

  const body = {
    filter: input.filter || undefined,
    sorts: input.sorts || undefined,
    start_cursor: input.start_cursor || undefined,
    page_size: input.page_size || undefined,
  }
  const res = await integration.fetch(`/databases/${encodeURIComponent(input.database_id)}/query`, { method: 'POST', body })
  const data = await res.json()
  const pages = Array.isArray(data?.results)
    ? data.results.map(page => ({
      id: page?.id ?? null,
      url: page?.url ?? null,
      createdTime: page?.created_time ?? null,
      lastEditedTime: page?.last_edited_time ?? null,
      title: titleFromProperties(page?.properties),
    }))
    : []
  return {
    database_id: input.database_id,
    count: pages.length,
    has_more: !!data?.has_more,
    next_cursor: data?.next_cursor ?? null,
    note: 'Use id with retrieve_page for full page details.',
    pages,
  }
}
