async (input) => {
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}`, { method: 'DELETE' })
  // DELETE returns 204 No Content on success
  return { success: res.status === 204, status: res.status }
}

