import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createLiveToolCoverage, createProxy, createToolbox, hasEnv } from '../../__tests__/liveHarness.js'
import { getPlanEntry } from '../../__tests__/liveCoveragePlan.js'

const env = process.env as Record<string, string | undefined>

const suiteOrSkip = hasEnv('XERO_CLIENT_ID', 'XERO_CLIENT_SECRET')
  ? describe
  : describe.skip
const fixturesDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../__tests__/fixtures/file-extraction')

const liveCoverage = createLiveToolCoverage(getPlanEntry('xero-custom-connection'))

function createXeroToolbox() {
  const { node, proxy } = createXeroHarnessParts()
  return createToolbox(
    'xero',
    proxy,
    node,
    'custom_connection',
    { coverage: liveCoverage },
  )
}

function createXeroHarnessParts() {
  const credentialStore = createCredentialStore(async () => ({
    clientId: env.XERO_CLIENT_ID!,
    clientSecret: env.XERO_CLIENT_SECRET!,
  }))
  const proxy = createProxy(credentialStore)
  const node = createIntegrationNode('xero', {
    label: 'Xero',
    credentialId: 'xero-creds',
    credentialVariant: 'custom_connection',
  })
  return { node, proxy }
}

async function uploadInvoiceAttachment(invoiceId: string, fileName: string) {
  const { node, proxy } = createXeroHarnessParts()
  const bytes = readFileSync(resolve(fixturesDir, 'sample.pdf'))
  const body = new Uint8Array(bytes).buffer
  const response = await proxy.call(
    node,
    `/api.xro/2.0/Invoices/${encodeURIComponent(invoiceId)}/Attachments/${encodeURIComponent(fileName)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/pdf',
      },
      body,
    },
  )
  return await response.json()
}

function pickAccount(accounts: any[], predicate: (account: any) => boolean, label: string) {
  const account = accounts.find(account => account.status === 'ACTIVE' && predicate(account))
  if (!account)
    throw new Error(`Could not find active Xero account fixture for ${label}`)
  return account
}

function pickTaxType(taxRates: any[], account: any, predicate: (rate: any) => boolean) {
  const byAccount = account?.taxType && taxRates.find(rate => rate.status === 'ACTIVE' && rate.taxType === account.taxType)
  const byPredicate = taxRates.find(rate => rate.status === 'ACTIVE' && predicate(rate))
  return byAccount?.taxType || byPredicate?.taxType || 'NONE'
}

suiteOrSkip('xero handlers (live)', () => {
  afterAll(() => {
    liveCoverage.assertComplete()
  })

  it('reads organisation settings and accounting metadata', async () => {
    const xero = createXeroToolbox()

    const organisation = await xero.read('get_organisation')({})
    expect(Array.isArray(organisation?.organisations)).toBe(true)

    const accounts = await xero.read('list_accounts')({})
    expect(Array.isArray(accounts?.accounts)).toBe(true)

    const taxRates = await xero.read('list_tax_rates')({})
    expect(Array.isArray(taxRates?.taxRates)).toBe(true)

    const tracking = await xero.read('list_tracking_categories')({})
    expect(Array.isArray(tracking?.trackingCategories)).toBe(true)

    const contactGroups = await xero.read('list_contact_groups')({})
    expect(Array.isArray(contactGroups?.contactGroups)).toBe(true)

    const currencies = await xero.read('list_currencies')({})
    expect(Array.isArray(currencies?.currencies)).toBe(true)
  }, 60000)

  it('reads core accounting resources', async () => {
    const xero = createXeroToolbox()

    const contacts = await xero.read('list_contacts')({ page: 1 })
    expect(Array.isArray(contacts?.contacts)).toBe(true)
    const firstContactId = contacts?.contacts?.[0]?.contactId
    if (firstContactId) {
      const contact = await xero.read('get_contact')({ id: firstContactId })
      expect(contact?.contact).toBeTruthy()
    }

    const items = await xero.read('list_items')({ page: 1 })
    expect(Array.isArray(items?.items)).toBe(true)
    const firstItemId = items?.items?.[0]?.itemId
    if (firstItemId) {
      const item = await xero.read('get_item')({ id: firstItemId })
      expect(item?.item).toBeTruthy()
    }

    const invoices = await xero.read('list_invoices')({ page: 1 })
    expect(Array.isArray(invoices?.invoices)).toBe(true)
    const firstInvoiceId = invoices?.invoices?.[0]?.invoiceId
    if (firstInvoiceId) {
      const invoice = await xero.read('get_invoice')({ id: firstInvoiceId })
      expect(invoice?.invoice).toBeTruthy()
      await xero.read('list_attachments')({ resourceType: 'Invoices', resourceId: firstInvoiceId })
    }

    await xero.read('list_credit_notes')({ page: 1 })
    await xero.read('list_quotes')({ page: 1 })
    await xero.read('list_purchase_orders')({ page: 1 })
    await xero.read('list_payments')({ page: 1 })
    await xero.read('list_bank_transactions')({ page: 1 })
    await xero.read('list_manual_journals')({ page: 1 })
  }, 90000)

  it('reads reports', async () => {
    const xero = createXeroToolbox()

    await xero.read('get_profit_and_loss')({})
    await xero.read('get_balance_sheet')({})
    await xero.read('get_trial_balance')({})
    await xero.read('get_bank_summary')({})
    const contacts = await xero.read('list_contacts')({ page: 1 })
    const contactId = contacts?.contacts?.[0]?.contactId
    if (contactId) {
      await xero.read('get_aged_payables_by_contact')({ contactId })
      await xero.read('get_aged_receivables_by_contact')({ contactId })
    }
    await xero.read('get_budget_summary')({})
  }, 90000)

  it('runs live smoke tests for safe write tools against the demo company', async () => {
    const xero = createXeroToolbox()
    const runId = Date.now()
    const accounts = await xero.read('list_accounts')({})
    const taxRates = await xero.read('list_tax_rates')({})
    const revenueAccount = pickAccount(accounts.accounts, account => account.type === 'REVENUE' || account.class === 'REVENUE', 'revenue line items')
    const expenseAccount = pickAccount(accounts.accounts, account => account.type === 'EXPENSE' || account.class === 'EXPENSE', 'expense line items')
    const revenueTaxType = pickTaxType(taxRates.taxRates, revenueAccount, rate => rate.canApplyToRevenue)
    const expenseTaxType = pickTaxType(taxRates.taxRates, expenseAccount, rate => rate.canApplyToExpenses)

    const contact = await xero.write('create_contact')({
      name: `Commandable Xero Test ${runId}`,
      emailAddress: `commandable-xero-${runId}@example.com`,
    })
    expect(contact?.contact?.contactId).toBeTruthy()
    expect(contact?.contact?.xeroUrl === null || typeof contact?.contact?.xeroUrl === 'string').toBe(true)

    const fetchedContact = await xero.read('get_contact')({ id: contact.contact.contactId })
    expect(fetchedContact?.contact?.contactId).toBe(contact.contact.contactId)

    const updatedContact = await xero.write('update_contact')({
      contactId: contact.contact.contactId,
      firstName: 'Commandable',
      lastName: `Smoke ${runId}`,
    })
    expect(updatedContact?.contact?.contactId).toBe(contact.contact.contactId)

    const item = await xero.write('create_item')({
      code: `CMD-${runId}`,
      name: `Commandable Fixture Item ${runId}`,
      description: 'Created by Commandable Xero live smoke tests',
    })
    expect(item?.item?.itemId).toBeTruthy()

    const fetchedItem = await xero.read('get_item')({ id: item.item.itemId })
    expect(fetchedItem?.item?.itemId).toBe(item.item.itemId)

    const updatedItem = await xero.write('update_item')({
      itemId: item.item.itemId,
      code: item.item.code,
      name: item.item.name,
      description: 'Updated by Commandable Xero live smoke tests',
    })
    expect(updatedItem?.item?.itemId).toBe(item.item.itemId)

    const tracking = await xero.read('list_tracking_categories')({})
    const trackingCategory = tracking?.trackingCategories?.find((category: any) => category.status === 'ACTIVE')
    expect(trackingCategory?.trackingCategoryId).toBeTruthy()

    const trackingOptions = await xero.write('create_tracking_options')({
      trackingCategoryId: trackingCategory.trackingCategoryId,
      optionNames: [`Smoke ${runId}`],
    })
    expect(trackingOptions?.createdCount).toBe(1)
    const trackingOptionId = trackingOptions?.trackingOptions?.[0]?.trackingOptionId
    expect(trackingOptionId).toBeTruthy()

    const updatedTrackingOption = await xero.write('update_tracking_options')({
      trackingCategoryId: trackingCategory.trackingCategoryId,
      trackingOptionId,
      name: `Smoke Updated ${runId}`,
    })
    expect(updatedTrackingOption?.trackingOption?.trackingOptionId).toBe(trackingOptionId)

    const invoice = await xero.write('create_invoice')({
      contactId: contact.contact.contactId,
      reference: `Commandable smoke ${runId}`,
      lineItems: [{ description: 'Service smoke test', quantity: 1, unitAmount: 10, accountCode: revenueAccount.code, taxType: revenueTaxType }],
    })
    expect(invoice?.invoice?.invoiceId).toBeTruthy()
    expect(invoice?.invoice?.xeroUrl === null || typeof invoice?.invoice?.xeroUrl === 'string').toBe(true)

    const fetchedInvoice = await xero.read('get_invoice')({ id: invoice.invoice.invoiceId })
    expect(fetchedInvoice?.invoice?.invoiceId).toBe(invoice.invoice.invoiceId)
    expect(Array.isArray(fetchedInvoice?.invoice?.lineItems)).toBe(true)

    const updatedInvoice = await xero.write('update_invoice')({
      invoiceId: invoice.invoice.invoiceId,
      reference: `Commandable smoke updated ${runId}`,
    })
    expect(updatedInvoice?.invoice?.invoiceId).toBe(invoice.invoice.invoiceId)

    const attachmentFileName = `commandable-xero-smoke-${runId}.pdf`
    const uploadedAttachment = await uploadInvoiceAttachment(invoice.invoice.invoiceId, attachmentFileName)
    expect(uploadedAttachment?.Attachments?.[0]?.FileName).toBe(attachmentFileName)

    const attachments = await xero.read('list_attachments')({ resourceType: 'Invoices', resourceId: invoice.invoice.invoiceId })
    expect(Array.isArray(attachments?.attachments)).toBe(true)
    expect(attachments.attachments.some((attachment: any) => attachment.fileName === attachmentFileName)).toBe(true)

    const attachmentContent = await xero.read('read_attachment_content')({
      resourceType: 'Invoices',
      resourceId: invoice.invoice.invoiceId,
      fileName: attachmentFileName,
    })
    expect(attachmentContent?.fileName).toBe(attachmentFileName)
    expect(typeof attachmentContent?.content).toBe('string')
    expect(attachmentContent.content.length).toBeGreaterThan(0)

    const creditNote = await xero.write('create_credit_note')({
      contactId: contact.contact.contactId,
      reference: `Commandable credit smoke ${runId}`,
      lineItems: [{ description: 'Credit smoke test', quantity: 1, unitAmount: 5, accountCode: revenueAccount.code, taxType: revenueTaxType }],
    })
    expect(creditNote?.creditNote?.creditNoteId).toBeTruthy()

    const quote = await xero.write('create_quote')({
      contactId: contact.contact.contactId,
      reference: `Commandable quote smoke ${runId}`,
      lineItems: [{ description: 'Quote smoke test', quantity: 1, unitAmount: 15, accountCode: revenueAccount.code, taxType: revenueTaxType }],
    })
    expect(quote?.quote?.quoteId).toBeTruthy()

    const purchaseOrder = await xero.write('create_purchase_order')({
      contactId: contact.contact.contactId,
      reference: `Commandable purchase smoke ${runId}`,
      lineItems: [{ description: 'Purchase smoke test', quantity: 1, unitAmount: 20, accountCode: expenseAccount.code, taxType: expenseTaxType }],
    })
    expect(purchaseOrder?.purchaseOrder?.purchaseOrderId).toBeTruthy()

    const manualJournal = await xero.write('create_manual_journal')({
      narration: `Commandable journal smoke ${runId}`,
      journalLines: [
        { accountCode: expenseAccount.code, lineAmount: 1, description: 'Debit smoke line' },
        { accountCode: revenueAccount.code, lineAmount: -1, description: 'Credit smoke line' },
      ],
    })
    expect(manualJournal?.manualJournal?.manualJournalId).toBeTruthy()
  }, 90000)
})
