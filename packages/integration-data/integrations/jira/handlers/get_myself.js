async (_input) => {
  const res = await integration.fetch('/rest/api/3/myself')
  const data = await res.json()

  return {
    accountId: data.accountId ?? null,
    displayName: data.displayName ?? null,
    active: data.active ?? null,
    timeZone: data.timeZone ?? null,
    locale: data.locale ?? null,
    emailAddress: data.emailAddress ?? null,
  }
}

