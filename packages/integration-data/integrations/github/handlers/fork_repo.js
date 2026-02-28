async (input) => {
  const body = {}
  if (input.organization) body.organization = input.organization
  if (input.name) body.name = input.name
  const res = await integration.fetch(
    `/repos/${input.owner}/${input.repo}/forks`,
    { method: 'POST', body }
  )
  return await res.json()
}
