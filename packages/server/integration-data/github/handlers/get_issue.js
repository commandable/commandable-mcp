async (input) => {
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues/${input.issue_number}`)
  return await res.json()
}
