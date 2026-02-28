async (input) => {
  const body = { event: input.event }
  if (input.body !== undefined) body.body = input.body
  if (input.commit_id !== undefined) body.commit_id = input.commit_id
  const res = await integration.fetch(
    `/repos/${input.owner}/${input.repo}/pulls/${input.pull_number}/reviews`,
    { method: 'POST', body }
  )
  return await res.json()
}
