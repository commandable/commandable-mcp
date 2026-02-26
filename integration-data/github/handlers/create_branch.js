async (input) => {
  // First, get the SHA of the branch to create from
  let fromRef = input.from_branch || 'main'
  
  // Try to get the ref, fallback to master if main doesn't exist
  let refRes
  try {
    refRes = await integration.fetch(`/repos/${input.owner}/${input.repo}/git/refs/heads/${fromRef}`)
  } catch (e) {
    if (fromRef === 'main') {
      fromRef = 'master'
      refRes = await integration.fetch(`/repos/${input.owner}/${input.repo}/git/refs/heads/${fromRef}`)
    } else {
      throw e
    }
  }
  
  const refData = await refRes.json()
  const sha = refData.object.sha
  
  // Create the new branch
  const body = {
    ref: `refs/heads/${input.branch}`,
    sha: sha,
  }
  
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/git/refs`, { 
    method: 'POST', 
    body 
  })
  return await res.json()
}

