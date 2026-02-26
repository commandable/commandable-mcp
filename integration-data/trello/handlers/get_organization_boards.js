async (input) => {
  const res = await integration.fetch(`/organizations/${input.orgId}/boards`)
  return await res.json()
}
