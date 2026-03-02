async (input) => {
  const res = await integration.fetch(`/rest/agile/1.0/sprint/${encodeURIComponent(String(input.sprintId))}/issue`, {
    method: 'POST',
    body: { issues: input.issueKeys },
  })

  if (res.status === 204)
    return { success: true }
  return await res.json()
}

