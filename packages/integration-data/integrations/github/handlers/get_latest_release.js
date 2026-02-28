async (input) => {
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/releases/latest`)
  return await res.json()
}
