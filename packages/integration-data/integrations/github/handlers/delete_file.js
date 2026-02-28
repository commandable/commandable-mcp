async (input) => {
  const body = { message: input.message, sha: input.sha }
  if (input.branch) body.branch = input.branch
  const res = await integration.fetch(
    `/repos/${input.owner}/${input.repo}/contents/${input.path}`,
    { method: 'DELETE', body }
  )
  return await res.json()
}
