import { markdownToAdf } from './adf_helpers.js'

async function resolveTransitionId(integration, issueIdOrKey, transitionId, transitionName) {
  if (transitionId)
    return String(transitionId)
  const name = String(transitionName || '').trim().toLowerCase()
  if (!name)
    return null

  const res = await integration.fetch(`/rest/api/3/issue/${encodeURIComponent(issueIdOrKey)}/transitions`)
  const data = await res.json()
  const transitions = Array.isArray(data.transitions) ? data.transitions : []
  const match = transitions.find(t => String(t?.name || '').trim().toLowerCase() === name)
  return match?.id ? String(match.id) : null
}

export default (integration) => async (input) => {
  const id = await resolveTransitionId(integration, input.issueIdOrKey, input.transitionId, input.transitionName)
  if (!id)
    throw new Error(`Could not resolve transition. Provide a valid transitionId or transitionName (call get_transitions to see available transitions).`)

  const body = {
    transition: { id },
  }

  if (input.fields && typeof input.fields === 'object')
    body.fields = input.fields
  if (input.update && typeof input.update === 'object')
    body.update = input.update

  if (input.commentText) {
    body.update = body.update || {}
    body.update.comment = body.update.comment || []
    body.update.comment.push({ add: { body: markdownToAdf(input.commentText) } })
  }

  const res = await integration.fetch(`/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}/transitions`, {
    method: 'POST',
    body,
  })

  if (res.status === 204)
    return { success: true }
  return await res.json()
}

