async (input) => {
  const { owner, repo, branch, message, files } = input
  
  // 1. Get the current commit SHA for the branch
  const refRes = await integration.fetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`)
  const refData = await refRes.json()
  const currentCommitSha = refData.object.sha
  
  // 2. Get the current commit to get its tree
  const commitRes = await integration.fetch(`/repos/${owner}/${repo}/git/commits/${currentCommitSha}`)
  const commitData = await commitRes.json()
  const currentTreeSha = commitData.tree.sha
  
  // 3. Build tree entries — use inline content for creates/updates, sha null for deletions
  const tree = []
  for (const file of files) {
    if (file.content !== undefined && file.content !== null) {
      tree.push({
        path: file.path,
        mode: file.mode || '100644',
        type: 'blob',
        content: file.content,
      })
    } else {
      tree.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: null,
      })
    }
  }
  
  // 4. Create a new tree
  const treeRes = await integration.fetch(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: {
      base_tree: currentTreeSha,
      tree: tree,
    },
  })
  const treeData = await treeRes.json()
  
  // 5. Create the commit
  const newCommitRes = await integration.fetch(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: {
      message: message,
      tree: treeData.sha,
      parents: [currentCommitSha],
    },
  })
  const newCommitData = await newCommitRes.json()
  
  // 6. Update the branch reference
  const updateRefRes = await integration.fetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: {
      sha: newCommitData.sha,
    },
  })
  await updateRefRes.json()
  
  return {
    commit: {
      sha: newCommitData.sha,
      url: newCommitData.html_url,
      message: newCommitData.message,
    },
    tree: {
      sha: treeData.sha,
    },
    files: files.map(f => ({ path: f.path })),
  }
}

