async (input) => {
  const body = { state: 'closed' }
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues/${input.issue_number}`, { method: 'PATCH', body })
  return await res.json()
}
