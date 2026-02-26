async (input) => {
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}`)
  return await res.json()
}
