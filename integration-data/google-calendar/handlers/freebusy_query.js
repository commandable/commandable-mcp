async (input) => {
  const res = await integration.fetch('/freeBusy', { method: 'POST', body: input })
  return await res.json()
}
