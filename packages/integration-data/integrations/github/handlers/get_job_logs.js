async (input) => {
  // GitHub returns a redirect to the actual log blob URL; fetch follows it automatically
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/actions/jobs/${input.job_id}/logs`)
  const logs = await res.text()
  return { logs }
}
