async (input) => {
  const body = {
    originBoardId: input.boardId,
    name: input.name,
  }
  if (input.startDate)
    body.startDate = input.startDate
  if (input.endDate)
    body.endDate = input.endDate
  if (input.goal)
    body.goal = input.goal

  const res = await integration.fetch('/rest/agile/1.0/sprint', {
    method: 'POST',
    body,
  })
  return await res.json()
}

