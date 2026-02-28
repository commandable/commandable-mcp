async (input) => {
  const body = {}
  if (input.title !== undefined) body.title = input.title
  if (input.body !== undefined) body.body = input.body
  if (input.state !== undefined) body.state = input.state
  if (input.base !== undefined) body.base = input.base
  if (input.draft !== undefined) body.draft = input.draft
  const res = await integration.fetch(
    `/repos/${input.owner}/${input.repo}/pulls/${input.pull_number}`,
    { method: 'PATCH', body }
  )
  return await res.json()
}
