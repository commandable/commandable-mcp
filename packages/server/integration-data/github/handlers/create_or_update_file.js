async (input) => {
  // GitHub API expects content to be base64 encoded
  // Use btoa with proper UTF-8 encoding for browser/Node.js compatibility
  const contentBase64 = typeof Buffer !== 'undefined' 
    ? Buffer.from(input.content).toString('base64')
    : btoa(unescape(encodeURIComponent(input.content)))
  
  const body = {
    message: input.message,
    content: contentBase64,
    branch: input.branch,
    sha: input.sha,
  }
  
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/contents/${input.path}`, { 
    method: 'PUT', 
    body 
  })
  return await res.json()
}

