async (input) => {
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/pulls/${input.pull_number}`)
  return await res.json()
}
