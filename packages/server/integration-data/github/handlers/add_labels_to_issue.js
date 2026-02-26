async (input) => {
  const body = {
    labels: input.labels,
  }
  
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues/${input.issue_number}/labels`, { 
    method: 'POST', 
    body 
  })
  return await res.json()
}

