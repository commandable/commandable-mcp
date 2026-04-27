async (input) => {
  const userId = encodeURIComponent(input.userId || 'me')
  const messageId = encodeURIComponent(input.messageId)

  const collectAttachments = (part, out = []) => {
    if (!part) return out
    if (part.body?.attachmentId) {
      out.push({
        attachmentId: part.body.attachmentId,
        filename: part.filename || '',
        mimeType: part.mimeType || '',
        size: part.body?.size || 0,
        partId: part.partId || '',
      })
    }
    if (Array.isArray(part.parts)) {
      for (const child of part.parts)
        collectAttachments(child, out)
    }
    return out
  }

  const toBase64 = (value) => {
    const raw = String(value || '').replace(/-/g, '+').replace(/_/g, '/')
    return raw.padEnd(Math.ceil(raw.length / 4) * 4, '=')
  }

  const messageRes = await integration.fetch(`/users/${userId}/messages/${messageId}?format=full`)
  if (!messageRes.ok)
    throw new Error(`Failed to fetch Gmail message (${messageRes.status}).`)
  const message = await messageRes.json()
  const attachments = collectAttachments(message.payload)

  const requestedAttachmentId = String(input.attachmentId || '')
  const requestedFilename = String(input.filename || '').toLowerCase()
  const found = requestedAttachmentId
    ? attachments.find(item => item.attachmentId === requestedAttachmentId)
    : attachments.find(item => item.filename.toLowerCase() === requestedFilename)
  const match = found || (requestedAttachmentId
    ? {
        attachmentId: requestedAttachmentId,
        filename: input.filename || '',
        mimeType: input.mimeType || '',
        size: 0,
        partId: '',
      }
    : null)

  if (!match) {
    return {
      messageId: input.messageId,
      attachmentId: input.attachmentId || null,
      filename: input.filename || null,
      content: null,
      message: 'Attachment not found on this Gmail message. Use read_email to inspect available attachments.',
      attachments,
    }
  }

  const attachmentId = encodeURIComponent(match.attachmentId)
  const attachmentRes = await integration.fetch(`/users/${userId}/messages/${messageId}/attachments/${attachmentId}`)
  if (!attachmentRes.ok)
    throw new Error(`Failed to fetch Gmail attachment (${attachmentRes.status}).`)
  const attachment = await attachmentRes.json()

  if (!attachment?.data) {
    return {
      messageId: input.messageId,
      attachmentId: match.attachmentId,
      filename: match.filename,
      mimeType: input.mimeType || match.mimeType || null,
      size: match.size,
      content: null,
      message: 'Gmail attachment response did not include file data.',
    }
  }

  const mimeType = input.mimeType || match.mimeType || 'application/octet-stream'
  const extracted = await utils.extractFileContent({
    auth: false,
    source: `data:${mimeType};base64,${toBase64(attachment.data)}`,
    previewPages: input.previewPages || 0,
  })

  return {
    messageId: input.messageId,
    attachmentId: match.attachmentId,
    filename: match.filename,
    mimeType,
    size: match.size || attachment.size || 0,
    partId: match.partId,
    ...extracted,
  }
}
