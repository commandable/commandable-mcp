async (input) => {
  const { spreadsheetId, metadataId } = input
  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/developerMetadata/${encodeURIComponent(metadataId)}`
  const res = await integration.fetch(path)
  return await res.json()
}
