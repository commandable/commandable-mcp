async (input) => {
  const res = await integration.fetch(`/drives/${encodeURIComponent(input.driveId)}/items/${encodeURIComponent(input.itemId)}`, {
    method: 'DELETE',
  })
  if (res.status === 204)
    return { success: true, status: 204 }
  try {
    return await res.json()
  }
  catch {
    return { success: res.ok, status: res.status }
  }
}
