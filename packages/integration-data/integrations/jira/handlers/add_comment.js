import { markdownToAdf } from './adf_helpers.js'

export default (integration) => async (input) => {
  const res = await integration.fetch(`/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}/comment`, {
    method: 'POST',
    body: { body: markdownToAdf(input.bodyText) },
  })

  return await res.json()
}

