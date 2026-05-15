import { afterAll, describe, expect, it } from 'vitest'
import { createLiveRunId, createLiveToolCoverage, createLiveToolbox, hasEnv, safeCleanup } from '../../__tests__/liveHarness.js'
import { getPlanEntry } from '../../__tests__/liveCoveragePlan.js'

const env = process.env as Record<string, string | undefined>
const suiteOrSkip = hasEnv('WISE_SANDBOX_API_TOKEN') ? describe : describe.skip
const liveCoverage = createLiveToolCoverage(getPlanEntry('wise-sandbox-personal-token'))

function createWiseSandboxToolbox() {
  return createLiveToolbox({
    type: 'wise',
    credentialVariant: 'personal_token_sandbox',
    label: 'Wise Sandbox',
    credentialId: 'wise-sandbox-creds',
    credentials: () => ({ apiToken: env.WISE_SANDBOX_API_TOKEN || '' }),
    coverage: liveCoverage,
  })
}

function expectId(value: unknown, label: string) {
  expect(value, `${label} should be present`).toBeTruthy()
  return value as string | number
}

function createWiseRecipientName() {
  const suffix = Array.from({ length: 8 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('')
  return `Commandable Wise ${suffix}`
}

async function ensureStandardBalance(parts: ReturnType<typeof createWiseSandboxToolbox>, profileId: string | number, currency = 'GBP') {
  const { toolbox, proxy, node } = parts

  try {
    await proxy.call(node, `/v4/profiles/${encodeURIComponent(profileId)}/balances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency, type: 'STANDARD' }),
    })
  }
  catch {
    // STANDARD balances are one-per-currency. If it already exists, listing below will find it.
  }

  const balances = await toolbox.read('list_balances')({ profileId, types: ['STANDARD', 'SAVINGS'] })
  const standard = balances?.balances?.find((balance: any) => balance.currency === currency && balance.type === 'STANDARD')
  if (!standard?.balanceId)
    throw new Error(`Could not find or create a ${currency} STANDARD balance in Wise sandbox`)
  return standard
}

async function simulateBalanceTopup(parts: ReturnType<typeof createWiseSandboxToolbox>, profileId: string | number, balanceId: string | number, currency = 'GBP', amount = 25) {
  const { proxy, node } = parts
  const res = await proxy.call(node, '/v1/simulation/balance/topup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profileId,
      balanceId,
      currency,
      amount,
      channel: 'TRANSFER',
    }),
  })
  return await res.json()
}

suiteOrSkip('wise handlers (sandbox live)', () => {
  afterAll(() => {
    liveCoverage.assertComplete()
  })

  it('prepares and inspects Wise transfer orders without funding them', async () => {
    const parts = createWiseSandboxToolbox()
    const wise = parts.toolbox
    const runId = createLiveRunId('wise')

    const profiles = await wise.read('list_profiles')({})
    const profileId = expectId(profiles?.profiles?.[0]?.profileId, 'profileId')

    const rate = await wise.read('get_exchange_rate')({ sourceCurrency: 'GBP', targetCurrency: 'EUR' })
    expect(rate?.rate).toBeTruthy()

    const quote = await wise.write('create_quote')({
      profileId,
      sourceCurrency: 'GBP',
      targetCurrency: 'EUR',
      sourceAmount: 10,
      payOut: 'BANK_TRANSFER',
    })
    const quoteId = expectId(quote?.quote?.quoteId, 'quoteId')

    const fetchedQuote = await wise.read('get_quote')({ profileId, quoteId })
    expect(fetchedQuote?.quote?.quoteId).toBe(quoteId)

    const requirements = await wise.read('get_recipient_requirements')({ quoteId })
    expect(requirements?.quoteId).toBe(quoteId)

    await wise.read('list_recipients')({ profileId, currency: 'EUR', size: 20 })

    const recipient = await wise.write('create_recipient_simple')({
      profileId,
      accountHolderName: createWiseRecipientName(),
      currency: 'EUR',
      country: 'DE',
      legalType: 'PRIVATE',
      iban: 'DE89370400440532013000',
    })
    const recipientId = expectId(recipient?.recipient?.recipientId, 'recipientId')

    const fetchedRecipient = await wise.read('get_recipient')({ recipientId })
    expect(fetchedRecipient?.recipient?.recipientId).toBe(recipientId)

    const updatedQuote = await wise.write('update_quote')({ profileId, quoteId, targetAccount: recipientId })
    expect(updatedQuote?.quote?.targetAccount).toBeTruthy()

    const transfer = await wise.write('create_transfer')({
      targetAccountId: recipientId,
      quoteId,
      reference: `Commandable ${runId}`.slice(0, 35),
    })
    const transferId = expectId(transfer?.transfer?.transferId, 'transferId')
    expect(transfer?.transfer?.requiresAction).toBe('FUND_IN_WISE_UI')

    const fetchedTransfer = await wise.read('get_transfer')({ transferId })
    expect(fetchedTransfer?.transfer?.transferId).toBe(transferId)

    const transfers = await wise.read('list_transfers')({ profileId, limit: 20 })
    expect(Array.isArray(transfers?.transfers)).toBe(true)

    await wise.write('cancel_transfer')({ transferId })

    const prepared = await wise.write('send_money')({
      profileId,
      sourceCurrency: 'GBP',
      targetCurrency: 'EUR',
      sourceAmount: 5,
      recipientId,
      reference: `Commandable send ${runId}`.slice(0, 35),
    })
    const preparedTransferId = expectId(prepared?.transfer?.transferId, 'preparedTransferId')
    expect(prepared?.transfer?.requiresAction).toBe('FUND_IN_WISE_UI')
    await safeCleanup(() => wise.write('cancel_transfer')({ transferId: preparedTransferId }))

    const deactivated = await wise.write('deactivate_recipient')({ recipientId })
    expect(deactivated?.deactivated).toBe(true)
  }, 120000)

  it('reads and moves sandbox balance funds', async () => {
    const parts = createWiseSandboxToolbox()
    const wise = parts.toolbox
    const runId = createLiveRunId('wise-bal')

    const profiles = await wise.read('list_profiles')({})
    const profileId = expectId(profiles?.profiles?.[0]?.profileId, 'profileId')

    const sourceBalance = await ensureStandardBalance(parts, profileId, 'GBP')
    await simulateBalanceTopup(parts, profileId, sourceBalance.balanceId, 'GBP', 25)

    const jar = await wise.write('create_balance')({
      profileId,
      currency: 'GBP',
      type: 'SAVINGS',
      name: `Commandable ${runId}`.slice(0, 30),
    })
    const targetBalanceId = expectId(jar?.balance?.balanceId, 'targetBalanceId')

    const fetchedBalance = await wise.read('get_balance')({ profileId, balanceId: targetBalanceId })
    expect(fetchedBalance?.balance?.balanceId).toBe(targetBalanceId)

    const movement = await wise.write('move_money_between_balances')({
      profileId,
      sourceBalanceId: sourceBalance.balanceId,
      targetBalanceId,
      amount: 1,
      currency: 'GBP',
      reference: `Commandable ${runId}`.slice(0, 35),
    })
    expect(movement?.movement).toBeTruthy()

    const totalFunds = await wise.read('get_total_funds')({ profileId, currency: 'GBP' })
    expect(totalFunds?.currency).toBe('GBP')
  }, 120000)

  it('reads sandbox receive-money account details', async () => {
    const parts = createWiseSandboxToolbox()
    const wise = parts.toolbox

    const profiles = await wise.read('list_profiles')({})
    const profileId = expectId(profiles?.profiles?.[0]?.profileId, 'profileId')

    const details = await wise.read('list_account_details')({ profileId })
    expect(Array.isArray(details?.accountDetails)).toBe(true)

    const orders = await wise.read('list_account_details_orders')({ profileId, currency: 'GBP' })
    expect(Array.isArray(orders?.orders)).toBe(true)
  }, 60000)
})
