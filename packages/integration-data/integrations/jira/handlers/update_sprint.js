async (input) => {
  const body = {}
  if (input.name !== undefined)
    body.name = input.name
  if (input.goal !== undefined)
    body.goal = input.goal
  if (input.state !== undefined)
    body.state = input.state
  if (input.startDate !== undefined)
    body.startDate = input.startDate
  if (input.endDate !== undefined)
    body.endDate = input.endDate

  const res = await integration.fetch(`/rest/agile/1.0/sprint/${encodeURIComponent(String(input.sprintId))}`, {
    method: 'POST',
    body,
  })

  return await res.json()
}
