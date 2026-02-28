async (input) => {
  const body = { tag_name: input.tag_name }
  if (input.name !== undefined) body.name = input.name
  if (input.body !== undefined) body.body = input.body
  if (input.draft !== undefined) body.draft = input.draft
  if (input.prerelease !== undefined) body.prerelease = input.prerelease
  if (input.target_commitish !== undefined) body.target_commitish = input.target_commitish
  if (input.generate_release_notes !== undefined) body.generate_release_notes = input.generate_release_notes
  const res = await integration.fetch(
    `/repos/${input.owner}/${input.repo}/releases`,
    { method: 'POST', body }
  )
  return await res.json()
}
