async () => {
  const res = await integration.fetch('/user/repos')
  return await res.json()
}
