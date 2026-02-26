async (input) => {
  const body = {
    title: input.title,
    body: input.body,
    head: input.head,
    base: input.base,
    draft: input.draft,
  }
  
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/pulls`, { 
    method: 'POST', 
    body 
  })
  return await res.json()
}

