async (input) => {
  const summarize = (row) => ({
    id: row?.id ?? null,
    archived: !!row?.archived,
    createdAt: row?.createdAt ?? null,
    updatedAt: row?.updatedAt ?? null,
    name: row?.properties?.name ?? null,
    domain: row?.properties?.domain ?? null,
    city: row?.properties?.city ?? null,
    state: row?.properties?.state ?? null,
    country: row?.properties?.country ?? null,
    phone: row?.properties?.phone ?? null,
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

  const res = await integration.fetch(`/crm/v3/objects/companies/search`, {
    method: 'POST',
    body,
  })
  const data = await res.json()
  const companies = Array.isArray(data?.results) ? data.results.map(summarize) : []
  return {
    total: typeof data?.total === 'number' ? data.total : companies.length,
    count: companies.length,
    paging: data?.paging ?? null,
    note: 'Use id with get_company for full record details.',
    companies,
  }
}

