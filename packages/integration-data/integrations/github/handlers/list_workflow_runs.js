async (input) => {
  const params = new URLSearchParams()
  if (input.branch) params.set('branch', input.branch)
  if (input.status) params.set('status', input.status)
  if (input.event) params.set('event', input.event)
  if (input.page) params.set('page', String(input.page))
  if (input.per_page) params.set('per_page', String(input.per_page))
  const query = params.toString() ? `?${params.toString()}` : ''
  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/actions/runs${query}`)
  const data = await res.json()
  const runs = Array.isArray(data?.workflow_runs)
    ? data.workflow_runs.map(run => ({
      id: run.id,
      name: run.name ?? null,
      displayTitle: run.display_title ?? null,
      event: run.event ?? null,
      status: run.status ?? null,
      conclusion: run.conclusion ?? null,
      runNumber: run.run_number ?? null,
      headBranch: run.head_branch ?? null,
      headSha: run.head_sha ?? null,
      createdAt: run.created_at ?? null,
      updatedAt: run.updated_at ?? null,
      htmlUrl: run.html_url ?? null,
      workflowId: run.workflow_id ?? null,
    }))
    : []
  return {
    totalCount: typeof data?.total_count === 'number' ? data.total_count : runs.length,
    count: runs.length,
    note: 'Use run id with get_workflow_run for full workflow run details.',
    workflowRuns: runs,
  }
}
