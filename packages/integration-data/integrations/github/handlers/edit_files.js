async (input) => {
  const { owner, repo, branch, message, files } = input

  // Helper: decode base64 GitHub content to UTF-8
  function decodeContent(b64Raw) {
    const b64 = b64Raw.replace(/\n/g, '')
    return decodeURIComponent(
      atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    )
  }

  // Helper: apply search/replace edits to text
  function applyEdits(text, edits, filePath) {
    let result = text
    for (let i = 0; i < edits.length; i++) {
      const { old_text, new_text } = edits[i]
      const idx = result.indexOf(old_text)
      if (idx === -1) {
        throw new Error(
          `Edit ${i + 1}/${edits.length} failed on ${filePath}: old_text not found. `
          + 'Ensure the search text matches exactly, including whitespace and indentation. '
          + 'Use get_file_contents to verify the current content.'
        )
      }
      result = result.substring(0, idx) + new_text + result.substring(idx + old_text.length)
    }
    return result
  }

  // 1. Get the current commit SHA for the branch
  const refRes = await integration.fetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`)
  const refData = await refRes.json()
  const currentCommitSha = refData.object.sha

  // 2. Get the current commit to find its tree
  const commitRes = await integration.fetch(`/repos/${owner}/${repo}/git/commits/${currentCommitSha}`)
  const commitData = await commitRes.json()
  const currentTreeSha = commitData.tree.sha

  // 3. Resolve final content for each file
  const tree = []
  for (const file of files) {
    if (file.action === 'delete') {
      tree.push({ path: file.path, mode: '100644', type: 'blob', sha: null })
      continue
    }

    let finalContent
    if (file.action === 'edit') {
      if (!file.edits || file.edits.length === 0) {
        throw new Error(`File ${file.path} has action 'edit' but no edits provided.`)
      }
      const params = new URLSearchParams()
      params.set('ref', branch)
      const fileRes = await integration.fetch(`/repos/${owner}/${repo}/contents/${file.path}?${params.toString()}`)
      const fileData = await fileRes.json()
      if (!fileData || !fileData.content) {
        throw new Error(`File not found: ${file.path}. Use get_repo_tree to discover file paths.`)
      }
      const currentContent = decodeContent(fileData.content)
      finalContent = applyEdits(currentContent, file.edits, file.path)
    } else {
      // action === 'create'
      if (file.content === undefined || file.content === null) {
        throw new Error(`File ${file.path} has action 'create' but no content provided.`)
      }
      finalContent = file.content
    }

    // Create blob
    const blobRes = await integration.fetch(`/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      body: { content: finalContent, encoding: 'utf-8' },
    })
    const blobData = await blobRes.json()
    tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blobData.sha })
  }

  // 4. Create a new tree
  const treeRes = await integration.fetch(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: { base_tree: currentTreeSha, tree: tree },
  })
  const treeData = await treeRes.json()

  // 5. Create the commit
  const newCommitRes = await integration.fetch(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: { message: message, tree: treeData.sha, parents: [currentCommitSha] },
  })
  const newCommitData = await newCommitRes.json()

  // 6. Update the branch reference
  await integration.fetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: { sha: newCommitData.sha },
  })

  return {
    commit: {
      sha: newCommitData.sha,
      message: newCommitData.message,
      url: newCommitData.html_url,
    },
    files: files.map(f => ({ path: f.path, action: f.action })),
  }
}
