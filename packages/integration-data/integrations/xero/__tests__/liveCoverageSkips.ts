export const xeroLiveCoverageSkips: Record<string, string> = {
  list_connections: 'Xero Custom Connections are single-organisation credentials and do not expose the public OAuth tenant-discovery path.',
  create_tracking_category: 'Xero demo organisations are limited to two active tracking categories; creating another category is not a reliable live smoke path once the fixture org reaches that limit.',
  update_tracking_category: 'Updating an existing tracking category would rename or archive shared demo organisation configuration; category option writes are live-covered instead.',
  create_payment: 'Creates a real payment against an authorised invoice; needs a dedicated reversible fixture before it can be safely run in every live smoke pass.',
  create_bank_transaction: 'Creates a real bank transaction in the demo organisation and currently requires a dedicated bank/account fixture to avoid Xero validation failures.',
  read_attachment_content: 'Requires a Xero attachment fixture because this integration does not currently include an upload-attachment tool to create one safely during the test.',
}
