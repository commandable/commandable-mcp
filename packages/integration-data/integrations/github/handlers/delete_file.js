async (input) => {
  let sha = input.sha
  if (!sha) {
    const params = new URLSearchParams()
    if (input.branch) params.set('ref', input.branch)
    const query = params.toString() ? `?${params.toString()}` : ''
    const fileRes = await integration.fetch(`/repos/${input.owner}/${input.repo}/contents/${input.path}${query}`)
    const fileData = await fileRes.json()
    if (!fileData || !fileData.sha) {
      throw new Error(`File not found: ${input.path}. Cannot delete a file that does not exist.`)
    }
    sha = fileData.sha
  }

  const body = { message: input.message, sha: sha }
  if (input.branch) body.branch = input.branch
  const res = await integration.fetch(
    `/repos/${input.owner}/${input.repo}/contents/${input.path}`,
    { method: 'DELETE', body }
  )
  return await res.json()
}
