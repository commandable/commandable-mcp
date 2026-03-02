async (input) => {
  const res = await integration.fetch(`/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}/comment`, {
    method: 'POST',
    body: { body: utils.adf?.fromMarkdown(input.bodyText) },
  })

  return await res.json()
}

