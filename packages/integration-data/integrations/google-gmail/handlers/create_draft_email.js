async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const lines = []
  if (input.to) lines.push(`To: ${input.to}`)
  lines.push(`Subject: ${input.subject || ''}`)
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
    lines.push('', input.body || '')
  }
  const raw = Buffer.from(lines.join('\r\n')).toString('base64url')
  const message = { raw }
  if (input.threadId) message.threadId = input.threadId

  const res = await integration.fetch(`/users/${userId}/drafts`, {
    method: 'POST',
    body: { message },
  })
  return await res.json()
}
