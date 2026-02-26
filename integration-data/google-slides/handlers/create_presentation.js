async (input) => {
  const body = {}
  if (input && typeof input.title === 'string') {
    body.title = input.title
  }
  const res = await integration.fetch('/presentations', { method: 'POST', body })
  return await res.json()
}
