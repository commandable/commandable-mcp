export default (integration) => async (input) => {
  const body = {
    pageId: String(input.pageId),
    body: {
      representation: 'storage',
      value: String(input.bodyStorage),
    },
  }

  if (input.parentCommentId)
    body.parentCommentId = String(input.parentCommentId)

  const res = await integration.fetch('/wiki/api/v2/footer-comments', {
    method: 'POST',
    body,
  })
  return await res.json()
}

