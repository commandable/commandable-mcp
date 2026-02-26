async (input) => {
  const body = {}
  if (input.title !== undefined)
    body.title = input.title
  if (input.body !== undefined)
    body.body = input.body
  if (input.state !== undefined)
    body.state = input.state
  if (input.assignees !== undefined)
    body.assignees = input.assignees
  if (input.labels !== undefined)
    body.labels = input.labels
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues/${input.issue_number}`, { method: 'PATCH', body })
  return await res.json()
}
