async (input) => {
  const summarize = (row) => ({
    id: row?.id ?? null,
    archived: !!row?.archived,
    createdAt: row?.createdAt ?? null,
    updatedAt: row?.updatedAt ?? null,
    email: row?.properties?.email ?? null,
    firstname: row?.properties?.firstname ?? null,
    lastname: row?.properties?.lastname ?? null,
    phone: row?.properties?.phone ?? null,
    company: row?.properties?.company ?? null,
    jobtitle: row?.properties?.jobtitle ?? null,
  })

  const filterGroups = []
  if (Array.isArray(input.filters) && input.filters.length > 0) {
    const filters = input.filters.map((f) => {
      const base = {
        propertyName: f.propertyName,
        operator: f.operator,
      }

      if (f.operator === 'BETWEEN' && typeof f.value === 'string' && f.value.includes(',')) {
        const [low, high] = f.value.split(',', 2).map((s) => s.trim())
        return { ...base, value: low, highValue: high }
      }

      if (f.operator === 'HAS_PROPERTY' || f.operator === 'NOT_HAS_PROPERTY') {
        return base
      }

      if (f.value !== undefined) {
        return { ...base, value: f.value }
      }

      return base
    })

    filterGroups.push({ filters })
  }

  const body = {
    query: input.query,
    filterGroups: filterGroups.length ? filterGroups : undefined,
    properties: input.properties,
    limit: input.limit,
    after: input.after,
  }

  const res = await integration.fetch(`/crm/v3/objects/contacts/search`, {
    method: 'POST',
    body,
  })
  const data = await res.json()
  const contacts = Array.isArray(data?.results) ? data.results.map(summarize) : []
  return {
    total: typeof data?.total === 'number' ? data.total : contacts.length,
    count: contacts.length,
    paging: data?.paging ?? null,
    note: 'Use id with get_contact for full record details.',
    contacts,
  }
}

