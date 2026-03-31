async (input) => {
  const params = new URLSearchParams()
  if (input.sha) params.set('sha', input.sha)
  if (typeof input.path === 'string' && input.path.length > 0) params.set('path', input.path)
  if (input.author) params.set('author', input.author)
  if (input.page) params.set('page', String(input.page))
  if (input.per_page) params.set('per_page', String(input.per_page))
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/commits${query}`)
  const data = await res.json()
  const commits = Array.isArray(data)
    ? data.map(commit => ({
      sha: commit.sha,
      message: commit.commit?.message?.split('\n')[0] ?? null,
      authorName: commit.commit?.author?.name ?? null,
      authorDate: commit.commit?.author?.date ?? null,
      committerName: commit.commit?.committer?.name ?? null,
      committerDate: commit.commit?.committer?.date ?? null,
      htmlUrl: commit.html_url ?? null,
    }))
    : []
  return {
    count: commits.length,
    note: 'Use sha with get_commit for full commit details.',
    commits,
  }
}
