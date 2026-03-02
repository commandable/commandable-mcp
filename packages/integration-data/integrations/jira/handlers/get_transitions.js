export default (integration) => async (input) => {
  const path = `/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}/transitions`
  const res = await integration.fetch(path)
  const data = await res.json()
  const transitions = Array.isArray(data.transitions) ? data.transitions : []

  return {
    transitions: transitions.map(t => ({
      id: t.id ?? null,
      name: t.name ?? null,
      to: t.to
        ? {
            id: t.to.id ?? null,
            name: t.to.name ?? null,
            statusCategory: t.to.statusCategory
              ? { key: t.to.statusCategory.key ?? null, name: t.to.statusCategory.name ?? null }
              : null,
          }
        : null,
    })),
  }
}

