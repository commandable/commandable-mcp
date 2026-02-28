async (input) => {
  const body = {}
  if (input.reviewers) body.reviewers = input.reviewers
  if (input.team_reviewers) body.team_reviewers = input.team_reviewers
  const res = await integration.fetch(
    `/repos/${input.owner}/${input.repo}/pulls/${input.pull_number}/requested_reviewers`,
    { method: 'POST', body }
  )
  return await res.json()
}
