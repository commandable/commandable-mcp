async (input) => {
  if (input.sourceAmount === undefined && input.targetAmount === undefined)
    throw new Error('Provide sourceAmount or targetAmount')
  if (!input.recipientId && !input.recipient)
    throw new Error('Provide recipientId or recipient fields')

  const summarizeQuote = quote => ({
    quoteId: quote?.id,
    sourceCurrency: quote?.sourceCurrency,
    targetCurrency: quote?.targetCurrency,
    sourceAmount: quote?.sourceAmount,
    targetAmount: quote?.targetAmount,
    rate: quote?.rate,
    fee: quote?.fee,
    rateExpirationTime: quote?.rateExpirationTime,
  })
  const summarizeRecipient = account => ({
    recipientId: account?.id,
    accountHolderName: account?.accountHolderName,
    currency: account?.currency,
    type: account?.type,
    active: account?.active,
    accountSummary: account?.details?.accountNumber
      ? `...${String(account.details.accountNumber).slice(-4)}`
      : (account?.details?.iban ? `${String(account.details.iban).slice(0, 4)}...${String(account.details.iban).slice(-4)}` : undefined),
  })
  const summarizeTransfer = transfer => {
    const transferId = transfer?.id
    return {
      transferId,
      status: transfer?.status,
      targetAccountId: transfer?.targetAccount,
      quoteId: transfer?.quoteUuid,
      customerTransactionId: transfer?.customerTransactionId,
      reference: transfer?.details?.reference,
      sourceCurrency: transfer?.sourceCurrency,
      targetCurrency: transfer?.targetCurrency,
      sourceValue: transfer?.sourceValue,
      targetValue: transfer?.targetValue,
      created: transfer?.created,
      estimatedDelivery: transfer?.estimatedDelivery,
      fundingUrl: transferId ? `https://wise.com/transfer/${encodeURIComponent(transferId)}` : null,
      requiresAction: 'FUND_IN_WISE_UI',
      nextStep: 'Open Wise to fund this prepared transfer. This integration intentionally does not call Wise API funding endpoints.',
    }
  }

  const quoteBody = {
    sourceCurrency: String(input.sourceCurrency).toUpperCase(),
    targetCurrency: String(input.targetCurrency).toUpperCase(),
    ...(input.sourceAmount !== undefined ? { sourceAmount: input.sourceAmount } : {}),
    ...(input.targetAmount !== undefined ? { targetAmount: input.targetAmount } : {}),
    ...(input.payOut ? { payOut: input.payOut } : {}),
    ...(input.preferredPayIn ? { preferredPayIn: input.preferredPayIn } : {}),
    ...(input.recipientId !== undefined ? { targetAccount: input.recipientId } : {}),
  }
  const quoteRes = await integration.post(`/v3/profiles/${encodeURIComponent(input.profileId)}/quotes`, quoteBody)
  const quoteResponseBodyText = await quoteRes.text()
  const quoteResponseBodyTrimmed = quoteResponseBodyText.trim()
  let quote = quoteResponseBodyTrimmed ? JSON.parse(quoteResponseBodyTrimmed) : null
  if (!quote?.id)
    throw new Error(`Wise quote creation returned no usable quote (HTTP ${typeof quoteRes.status === 'number' ? quoteRes.status : 'unknown'})`)

  let recipientId = input.recipientId
  let recipient = null
  if (!recipientId) {
    const data = input.recipient || {}
    const compact = value => typeof value === 'string' ? value.replace(/[\s-]/g, '') : value
    const currency = String(data.currency || input.targetCurrency).toUpperCase()
    const inferType = () => {
      if (data.type) return data.type
      if (data.iban) return 'iban'
      if (currency === 'GBP' && data.sortCode && data.accountNumber) return 'sort_code'
      if (currency === 'USD' && (data.routingNumber || data.aba) && data.accountNumber) return 'aba'
      if (currency === 'AUD' && data.bsbCode && data.accountNumber) return 'australian'
      if (currency === 'CAD' && data.institutionNumber && data.transitNumber && data.accountNumber) return 'canadian'
      if (currency === 'MXN' && data.clabe) return 'clabe'
      if (currency === 'INR' && data.ifscCode && data.accountNumber) return 'indian'
      if (data.swiftCode || data.bic) return 'swift_code'
      if (data.email) return 'email'
      if (data.phoneNumber) return 'mobile_wallet'
      return undefined
    }
    const type = inferType()
    if (!type)
      throw new Error('Could not infer recipient type. Provide recipient.type or common banking fields.')

    const details = {
      ...(data.country ? { country: String(data.country).toUpperCase() } : {}),
      ...(data.legalType ? { legalType: data.legalType } : {}),
      ...(data.iban ? { IBAN: compact(data.iban) } : {}),
      ...(data.bic ? { BIC: compact(data.bic) } : {}),
      ...(data.swiftCode ? { swiftCode: compact(data.swiftCode) } : {}),
      ...(data.accountNumber ? { accountNumber: compact(data.accountNumber) } : {}),
      ...(data.sortCode ? { sortCode: compact(data.sortCode) } : {}),
      ...(data.routingNumber ? { routingNumber: compact(data.routingNumber) } : {}),
      ...(data.aba ? { abartn: compact(data.aba), aba: compact(data.aba) } : {}),
      ...(data.bsbCode ? { bsbCode: compact(data.bsbCode) } : {}),
      ...(data.institutionNumber ? { institutionNumber: compact(data.institutionNumber) } : {}),
      ...(data.transitNumber ? { transitNumber: compact(data.transitNumber) } : {}),
      ...(data.branchCode ? { branchCode: compact(data.branchCode) } : {}),
      ...(data.bankCode ? { bankCode: compact(data.bankCode) } : {}),
      ...(data.clabe ? { clabe: compact(data.clabe) } : {}),
      ...(data.ifscCode ? { ifscCode: compact(data.ifscCode) } : {}),
      ...(data.email ? { email: data.email } : {}),
      ...(data.phoneNumber ? { phoneNumber: data.phoneNumber } : {}),
      ...(data.address ? { address: data.address } : {}),
      ...(data.extraFields || {}),
    }
    const recipientBody = {
      profile: input.profileId,
      accountHolderName: data.accountHolderName,
      currency,
      type,
      details,
      ...(data.ownedByCustomer !== undefined ? { ownedByCustomer: data.ownedByCustomer } : {}),
    }
    const recipientRes = await integration.post('/v1/accounts', recipientBody)
    const recipientResponseBodyText = await recipientRes.text()
    const recipientResponseBodyTrimmed = recipientResponseBodyText.trim()
    recipient = recipientResponseBodyTrimmed ? JSON.parse(recipientResponseBodyTrimmed) : null
    recipientId = recipient?.id
    if (!recipientId)
      throw new Error('Wise recipient creation did not return an id')

    const updateRes = await integration.patch(`/v3/profiles/${encodeURIComponent(input.profileId)}/quotes/${encodeURIComponent(quote.id)}`, {
      targetAccount: recipientId,
    })
    const quoteUpdateResponseBodyText = await updateRes.text()
    const quoteUpdateResponseBodyTrimmed = quoteUpdateResponseBodyText.trim()
    quote = quoteUpdateResponseBodyTrimmed ? JSON.parse(quoteUpdateResponseBodyTrimmed) : null
    if (!quote?.id)
      throw new Error(`Wise quote update returned no usable quote (HTTP ${typeof updateRes.status === 'number' ? updateRes.status : 'unknown'})`)
  }
  else {
    const recipientRes = await integration.get(`/v2/accounts/${encodeURIComponent(recipientId)}`)
    const existingRecipientResponseBodyText = await recipientRes.text()
    const existingRecipientResponseBodyTrimmed = existingRecipientResponseBodyText.trim()
    recipient = existingRecipientResponseBodyTrimmed ? JSON.parse(existingRecipientResponseBodyTrimmed) : null
  }

  const transferDetails = input.reference ? { reference: input.reference } : {}
  const transferBody = {
    targetAccount: recipientId,
    quoteUuid: quote.id,
    customerTransactionId: uuid.v4(),
    ...(Object.keys(transferDetails).length ? { details: transferDetails } : {}),
  }
  const transferRes = await integration.post('/v1/transfers', transferBody)
  const transferResponseBodyText = await transferRes.text()
  const transferResponseBodyTrimmed = transferResponseBodyText.trim()
  const transfer = transferResponseBodyTrimmed ? JSON.parse(transferResponseBodyTrimmed) : null
  if (!transfer?.id)
    throw new Error(`Wise transfer creation returned no usable transfer (HTTP ${typeof transferRes.status === 'number' ? transferRes.status : 'unknown'})`)

  return {
    quote: summarizeQuote(quote),
    recipient: summarizeRecipient(recipient),
    transfer: summarizeTransfer(transfer),
    funding: {
      required: true,
      method: 'WISE_UI',
      url: transfer?.id ? `https://wise.com/transfer/${encodeURIComponent(transfer.id)}` : null,
      note: 'The transfer has been prepared but not funded. The user must approve and fund it in Wise.',
    },
  }
}
