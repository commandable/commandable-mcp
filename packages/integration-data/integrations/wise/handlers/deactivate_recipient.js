async (input) => {
  const res = await integration.delete(`/v1/accounts/${encodeURIComponent(input.recipientId)}`)
  let data = null
  if (res.status !== 204) {
    const responseBodyText = await res.text()
    const responseBodyTrimmed = responseBodyText.trim()
    if (responseBodyTrimmed)
      data = JSON.parse(responseBodyTrimmed)
  }
  return {
    recipientId: input.recipientId,
    deactivated: res.ok,
    result: data,
  }
}
