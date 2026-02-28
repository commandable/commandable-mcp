async (input) => {
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/actions/runs/${input.run_id}`)
  return await res.json()
}
