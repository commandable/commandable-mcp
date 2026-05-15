async (input) => {
  const compact = value => typeof value === 'string' ? value.replace(/[\s-]/g, '') : value
  const currency = String(input.currency).toUpperCase()
  const country = input.country ? String(input.country).toUpperCase() : undefined

  const inferType = () => {
    if (input.type) return input.type
    if (input.iban) return 'iban'
    if (currency === 'GBP' && input.sortCode && input.accountNumber) return 'sort_code'
    if (currency === 'USD' && (input.routingNumber || input.aba) && input.accountNumber) return 'aba'
    if (currency === 'AUD' && input.bsbCode && input.accountNumber) return 'australian'
    if (currency === 'CAD' && input.institutionNumber && input.transitNumber && input.accountNumber) return 'canadian'
    if (currency === 'MXN' && input.clabe) return 'clabe'
    if (currency === 'INR' && input.ifscCode && input.accountNumber) return 'indian'
    if (input.swiftCode || input.bic) return 'swift_code'
    if (input.email) return 'email'
    if (input.phoneNumber) return 'mobile_wallet'
    return undefined
  }

  const type = inferType()
  if (!type)
    throw new Error('Could not infer Wise recipient type. Provide type or common banking fields such as iban, sortCode+accountNumber, routingNumber+accountNumber, or swiftCode.')

  const details = {
    ...(country ? { country } : {}),
    ...(input.legalType ? { legalType: input.legalType } : {}),
    ...(input.iban ? { IBAN: compact(input.iban) } : {}),
    ...(input.bic ? { BIC: compact(input.bic) } : {}),
    ...(input.swiftCode ? { swiftCode: compact(input.swiftCode) } : {}),
    ...(input.accountNumber ? { accountNumber: compact(input.accountNumber) } : {}),
    ...(input.sortCode ? { sortCode: compact(input.sortCode) } : {}),
    ...(input.routingNumber ? { routingNumber: compact(input.routingNumber) } : {}),
    ...(input.aba ? { abartn: compact(input.aba), aba: compact(input.aba) } : {}),
    ...(input.bsbCode ? { bsbCode: compact(input.bsbCode) } : {}),
    ...(input.institutionNumber ? { institutionNumber: compact(input.institutionNumber) } : {}),
    ...(input.transitNumber ? { transitNumber: compact(input.transitNumber) } : {}),
    ...(input.branchCode ? { branchCode: compact(input.branchCode) } : {}),
    ...(input.bankCode ? { bankCode: compact(input.bankCode) } : {}),
    ...(input.clabe ? { clabe: compact(input.clabe) } : {}),
    ...(input.ifscCode ? { ifscCode: compact(input.ifscCode) } : {}),
    ...(input.email ? { email: input.email } : {}),
    ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
    ...(input.address ? { address: input.address } : {}),
    ...(input.extraFields || {}),
  }

  const body = {
    profile: input.profileId,
    accountHolderName: input.accountHolderName,
    currency,
    type,
    details,
    ...(input.ownedByCustomer !== undefined ? { ownedByCustomer: input.ownedByCustomer } : {}),
  }

  const res = await integration.post('/v1/accounts', body)
  const responseBodyText = await res.text()
  const responseBodyTrimmed = responseBodyText.trim()
  const account = responseBodyTrimmed ? JSON.parse(responseBodyTrimmed) : null

  return {
    recipient: {
      recipientId: account?.id,
      profileId: account?.profile,
      accountHolderName: account?.accountHolderName,
      currency: account?.currency,
      country: account?.country,
      type: account?.type,
      active: account?.active,
      ownedByCustomer: account?.ownedByCustomer,
      legalType: account?.legalType,
      details: account?.details,
    },
  }
}
