async (input) => {
  const res = await integration.fetch(
    `/repos/${input.owner}/${input.repo}/git/refs/heads/${input.branch}`,
    { method: 'DELETE' }
  )
  if (res.status === 204) return { success: true, branch: input.branch }
  return await res.json()
}
