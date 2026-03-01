async (input) => {
  const { owner, repo, branch, path, edits, message } = input

  const params = new URLSearchParams()
  params.set('ref', branch)
  const fileRes = await integration.fetch(`/repos/${owner}/${repo}/contents/${path}?${params.toString()}`)
  const fileData = await fileRes.json()

  if (!fileData || !fileData.content || !fileData.sha) {
    throw new Error(`File not found: ${path}. Use get_repo_tree to discover file paths.`)
  }

  const b64 = fileData.content.replace(/\n/g, '')
  let content = decodeURIComponent(
    atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  )

  for (let i = 0; i < edits.length; i++) {
    const { old_text, new_text } = edits[i]
    const idx = content.indexOf(old_text)
    if (idx === -1) {
      throw new Error(
        `Edit ${i + 1}/${edits.length} failed: old_text not found in ${path}. `
        + 'Ensure the search text matches the file exactly, including whitespace and indentation. '
        + 'Use get_file_contents to verify the current content.'
      )
    }
    content = content.substring(0, idx) + new_text + content.substring(idx + old_text.length)
  }

  const contentBase64 = btoa(unescape(encodeURIComponent(content)))

  const res = await integration.fetch(`/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    body: {
      message: message,
      content: contentBase64,
      sha: fileData.sha,
      branch: branch,
    },
  })
  const result = await res.json()

  return {
    commit: {
      sha: result.commit?.sha,
      message: result.commit?.message,
      url: result.commit?.html_url,
    },
    file: { path: path },
  }
}
