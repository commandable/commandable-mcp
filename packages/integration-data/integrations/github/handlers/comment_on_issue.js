async (input) => {
  const body = { body: input.body }
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues/${input.issue_number}/comments`, { method: 'POST', body })
  return await res.json()
}
