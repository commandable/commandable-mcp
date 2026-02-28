async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const lines = [`To: ${input.to}`, `Subject: ${input.subject}`]
  if (input.cc) lines.push(`Cc: ${input.cc}`)
  if (input.bcc) lines.push(`Bcc: ${input.bcc}`)
  if (input.replyToMessageId) lines.push(`In-Reply-To: ${input.replyToMessageId}`)
  lines.push('MIME-Version: 1.0')
  if (input.htmlBody) {
    lines.push('Content-Type: text/html; charset=UTF-8')
    lines.push('', input.htmlBody)
  }
  else {
    lines.push('Content-Type: text/plain; charset=UTF-8')
    lines.push('', input.body)
  }
  const mime = lines.join('\r\n')
  const raw = Buffer.from(mime).toString('base64url')
  const body = { raw }
  if (input.threadId) body.threadId = input.threadId
  const res = await integration.fetch(`/users/${userId}/messages/send`, { method: 'POST', body })
  return await res.json()
}
