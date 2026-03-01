async (input) => {
  const { owner, repo, branch, path, content, message } = input

  // Check if the file already exists to get its SHA for overwrite
  let existingSha
  try {
    const params = new URLSearchParams()
    params.set('ref', branch)
    const checkRes = await integration.fetch(`/repos/${owner}/${repo}/contents/${path}?${params.toString()}`)
    const checkData = await checkRes.json()
    if (checkData && checkData.sha) {
      existingSha = checkData.sha
    }
  } catch (e) {
    // 404 means file doesn't exist yet -- that's fine
  }

  const contentBase64 = btoa(unescape(encodeURIComponent(content)))

  const body = {
    message: message,
    content: contentBase64,
    branch: branch,
  }
  if (existingSha) {
    body.sha = existingSha
  }

  const res = await integration.fetch(`/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    body: body,
  })
  const result = await res.json()

  return {
    commit: {
      sha: result.commit?.sha,
      message: result.commit?.message,
      url: result.commit?.html_url,
    },
    file: {
      path: path,
      action: existingSha ? 'overwritten' : 'created',
    },
  }
}
