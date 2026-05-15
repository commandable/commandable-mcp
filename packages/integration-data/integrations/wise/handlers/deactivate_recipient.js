async (input) => {
  const res = await integration.delete(`/v1/accounts/${encodeURIComponent(input.recipientId)}`)
  const data = res.status === 204 ? null : await res.json()
  return {
    recipientId: input.recipientId,
    deactivated: res.ok,
    result: data,
  }
}
