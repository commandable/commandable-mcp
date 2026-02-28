async (input) => {
  const params = new URLSearchParams()
  if (input.ref) params.set('ref', input.ref)
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/contents/${input.path}${query}`)
  const data = await res.json()
  if (data && data.content && data.encoding === 'base64') {
    try {
      const b64 = data.content.replace(/\n/g, '')
      // Decode base64 → binary string → percent-encode each byte → UTF-8 decode
      data.content = decodeURIComponent(
        atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      )
      data.encoding = 'utf-8'
    }
    catch (e) {
      // Binary file — leave content as base64
    }
  }
  return data
}
