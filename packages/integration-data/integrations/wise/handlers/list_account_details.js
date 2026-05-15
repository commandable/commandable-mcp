async (input) => {
  const res = await integration.get(`/v1/profiles/${encodeURIComponent(input.profileId)}/account-details`)
  const data = await res.json()
  const details = Array.isArray(data) ? data : []

  return {
    accountDetails: details.map(item => ({
      id: item?.id,
      currency: item?.currency,
      title: item?.title,
      type: item?.type,
      status: item?.status,
      active: item?.active,
      accountHolderName: item?.accountHolderName,
      receiveOptions: item?.receiveOptions,
      details: item?.details,
    })),
    count: details.length,
  }
}
