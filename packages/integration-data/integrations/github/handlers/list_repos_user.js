async () => {
  const res = await integration.fetch('/user/repos')
  const data = await res.json()
  if (!Array.isArray(data)) return data
  return data.map((r) => ({
    full_name: r.full_name,
    name: r.name,
    owner: { login: r.owner?.login },
    private: r.private,
    default_branch: r.default_branch,
    description: r.description ?? null,
    html_url: r.html_url,
    archived: r.archived,
    fork: r.fork,
  }))
}
