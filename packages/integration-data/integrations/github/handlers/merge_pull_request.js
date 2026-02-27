async (input) => {
  const body = {
    commit_title: input.commit_title,
    commit_message: input.commit_message,
    merge_method: input.merge_method || 'merge',
  }
  
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/pulls/${input.pull_number}/merge`, { 
    method: 'PUT', 
    body 
  })
  return await res.json()
}

