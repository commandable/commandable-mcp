async (input) => {
  const fields = ['id', 'name', 'displayName', 'desc', 'url'].join(',')
  const res = await integration.fetch(`/members/me/organizations?fields=${encodeURIComponent(fields)}`)
  const raw = await res.json()
  const organizations = Array.isArray(raw)
    ? raw.map(org => ({
      id: org.id,
      name: org.name || null,
      displayName: org.displayName || null,
      url: org.url || null,
      descriptionPreview: typeof org.desc === 'string' && org.desc.trim()
        ? (org.desc.trim().length <= 200 ? org.desc.trim() : `${org.desc.trim().slice(0, 199)}...`)
        : null,
    }))
    : []
  return {
    count: organizations.length,
    note: 'Use org id with get_organization for full organization details.',
    organizations,
  }
}
