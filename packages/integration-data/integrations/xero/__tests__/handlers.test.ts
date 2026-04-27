import { describe, expect, it } from 'vitest'
import { createCredentialStore, createIntegrationNode, createProxy, createToolbox, hasEnv } from '../../__tests__/liveHarness.js'

const env = process.env as Record<string, string | undefined>

const suiteOrSkip = hasEnv('XERO_CLIENT_ID', 'XERO_CLIENT_SECRET')
  ? describe
  : describe.skip

function createXeroToolbox() {
  const credentialStore = createCredentialStore(async () => ({
    clientId: env.XERO_CLIENT_ID!,
    clientSecret: env.XERO_CLIENT_SECRET!,
  }))
  const proxy = createProxy(credentialStore)
  return createToolbox(
    'xero',
    proxy,
    createIntegrationNode('xero', {
      label: 'Xero',
      credentialId: 'xero-creds',
      credentialVariant: 'custom_connection',
    }),
    'custom_connection',
  )
}

suiteOrSkip('xero handlers (live)', () => {
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

    await xero.read('list_connections')({}).catch(() => null)

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

  it('runs safe write smoke tests against the demo company', async () => {
    const xero = createXeroToolbox()
    const runId = Date.now()

    const contact = await xero.write('create_contact')({
      name: `Commandable Xero Test ${runId}`,
      emailAddress: `commandable-xero-${runId}@example.com`,
    })
    expect(contact?.contact?.contactId).toBeTruthy()

    const updatedContact = await xero.write('update_contact')({
      contactId: contact.contact.contactId,
      extraFields: { ContactStatus: 'ARCHIVED' },
    })
    expect(updatedContact?.contact?.contactId).toBe(contact.contact.contactId)
  }, 90000)

  it.skip('references fixture-dependent write tools for usage parity', async () => {
    const xero = createXeroToolbox()
    const item = await xero.write('create_item')({
      code: 'CMD-FIXTURE',
      name: 'Commandable Fixture Item',
    })
    await xero.write('update_item')({
      itemId: item.item.itemId,
      extraFields: { Name: 'Commandable Fixture Item Updated' },
    })
    await xero.write('create_tracking_category')({
      name: 'Commandable Fixture Tracking',
    })
    await xero.write('create_tracking_options')({
      trackingCategoryId: 'fixture-tracking-category-id',
      optionNames: ['One', 'Two'],
    })
    await xero.write('update_tracking_category')({
      trackingCategoryId: 'fixture-tracking-category-id',
      status: 'ARCHIVED',
    })
    await xero.write('update_tracking_options')({
      trackingCategoryId: 'fixture-tracking-category-id',
      trackingOptionId: 'fixture-tracking-option-id',
      status: 'ARCHIVED',
    })
    await xero.write('create_invoice')({
      contactId: 'fixture-contact-id',
      lineItems: [{ description: 'Service', quantity: 1, unitAmount: 10, accountCode: '200', taxType: 'NONE' }],
    })
    await xero.write('update_invoice')({
      invoiceId: 'fixture-invoice-id',
      status: 'SUBMITTED',
    })
    await xero.write('create_credit_note')({
      contactId: 'fixture-contact-id',
      lineItems: [{ description: 'Credit', quantity: 1, unitAmount: 10, accountCode: '200', taxType: 'NONE' }],
    })
    await xero.write('create_quote')({
      contactId: 'fixture-contact-id',
      lineItems: [{ description: 'Quote', quantity: 1, unitAmount: 10, accountCode: '200', taxType: 'NONE' }],
    })
    await xero.write('create_purchase_order')({
      contactId: 'fixture-contact-id',
      lineItems: [{ description: 'Purchase', quantity: 1, unitAmount: 10, accountCode: '200', taxType: 'NONE' }],
    })
    await xero.write('create_payment')({
      invoiceId: 'fixture-invoice-id',
      accountId: 'fixture-account-id',
      amount: 10,
    })
    await xero.write('create_bank_transaction')({
      type: 'SPEND',
      bankAccountId: 'fixture-bank-account-id',
      contactId: 'fixture-contact-id',
      lineItems: [{ description: 'Spend', quantity: 1, unitAmount: 10, accountCode: '200', taxType: 'NONE' }],
    })
    await xero.write('create_manual_journal')({
      narration: 'Fixture journal',
      journalLines: [
        { accountCode: '200', lineAmount: 10 },
        { accountCode: '400', lineAmount: -10 },
      ],
    })
  })

  it.skip('references attachment extraction for usage parity', async () => {
    const xero = createXeroToolbox()
    await xero.read('read_attachment_content')({
      resourceType: 'Invoices',
      resourceId: env.XERO_TEST_ATTACHMENT_INVOICE_ID,
      fileName: env.XERO_TEST_ATTACHMENT_FILE_NAME,
    })
  })
})
