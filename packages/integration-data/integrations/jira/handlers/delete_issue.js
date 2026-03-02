async (input) => {
  const res = await integration.fetch(`/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}`, {
    method: 'DELETE',
  })

  if (res.status === 204)
    return { success: true }
  return await res.json()
}

