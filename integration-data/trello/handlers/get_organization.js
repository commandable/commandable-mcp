async (input) => {
  const res = await integration.fetch(`/organizations/${input.orgId}`)
  return await res.json()
}
