async (input) => {
  const res = await integration.fetch(
    `/repos/${input.owner}/${input.repo}/pulls/${input.pull_number}`,
    { headers: { 'Accept': 'application/vnd.github.diff' } }
  )
  const diff = await res.text()
  return { diff }
}
