async (input) => {
  const body = {
    title: input.title,
    body: input.body,
    assignees: input.assignees,
    labels: input.labels,
  }
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues`, { method: 'POST', body })
  return await res.json()
}
