async (input) => {
  const body = {
    name: input.name,
    description: input.description,
    private: input.private,
    auto_init: input.auto_init,
  }
  const res = await integration.fetch('/user/repos', { method: 'POST', body })
  return await res.json()
}

