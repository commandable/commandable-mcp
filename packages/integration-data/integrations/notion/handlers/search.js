async (input) => {
  const titleFromResult = (result) => {
    const titleProp = result?.properties?.title
    if (titleProp?.type === 'title' && Array.isArray(titleProp.title))
      return titleProp.title.map(x => x?.plain_text || '').join('').trim() || null
    if (Array.isArray(result?.title))
      return result.title.map(x => x?.plain_text || '').join('').trim() || null
    return null
  }

  const body = {
    query: input.query || '',
    filter: input.filter || undefined,
    sort: input.sort || undefined,
    start_cursor: input.start_cursor || undefined,
    page_size: input.page_size || undefined,
  }
  const res = await integration.fetch(`/search`, { method: 'POST', body })
  const data = await res.json()
  const results = Array.isArray(data?.results)
    ? data.results.map((r) => {
      const objectType = r?.object || null
      const id = r?.id || null
      return {
        object: objectType,
        id,
        title: titleFromResult(r),
        url: r?.url ?? null,
        createdTime: r?.created_time ?? null,
        lastEditedTime: r?.last_edited_time ?? null,
        followUpTool: objectType === 'database' ? 'retrieve_database' : objectType === 'page' ? 'retrieve_page' : null,
      }
    })
    : []
  return {
    count: results.length,
    has_more: !!data?.has_more,
    next_cursor: data?.next_cursor ?? null,
    note: 'Use id with retrieve_page or retrieve_database for full details.',
    results,
  }
}
