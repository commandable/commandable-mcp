async () => {
  const res = await integration.fetch('/installation/repositories')
  return await res.json()
}
