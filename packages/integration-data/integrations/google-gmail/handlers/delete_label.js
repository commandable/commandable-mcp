async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const labelId = encodeURIComponent(input.labelId)
  const res = await integration.fetch(`/users/${userId}/labels/${labelId}`, { method: 'DELETE' })
  if (res.status === 204)
    return { success: true }
  try {
    return await res.json()
  }
  catch {
    return { success: true }
  }
}
