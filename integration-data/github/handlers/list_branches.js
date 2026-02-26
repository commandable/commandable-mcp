async (input) => {
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/branches`)
  return await res.json()
}
