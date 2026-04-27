async () => {
  const res = await integration.get('/connections')
  const data = await res.json()
  const connections = Array.isArray(data) ? data : []

  return {
    connections: connections.map(connection => ({
      id: connection.id,
      tenantId: connection.tenantId,
      tenantName: connection.tenantName,
      tenantType: connection.tenantType,
      createdDateUtc: connection.createdDateUtc,
      updatedDateUtc: connection.updatedDateUtc,
    })),
    note: 'For public OAuth, pass tenantId to tenant-scoped tools. Custom Connections are single-organisation and may not need this tool.',
  }
}
