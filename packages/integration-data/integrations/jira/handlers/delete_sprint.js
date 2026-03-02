export default (integration) => async (input) => {
  const res = await integration.fetch(`/rest/agile/1.0/sprint/${encodeURIComponent(String(input.sprintId))}`, {
    method: 'DELETE',
  })

  if (res.status === 204)
    return { success: true }
  return await res.json()
}

