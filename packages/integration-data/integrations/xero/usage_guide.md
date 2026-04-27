## Authentication and tenants

Custom Connections are single-organisation connections. Omit `tenantId` for those tools unless Xero explicitly gives you one. Public OAuth integrations can connect to multiple organisations; call `list_connections`, choose the intended tenant, then pass that `tenantId` to Accounting API tools.

## Recommended workflows

- Discovery before writes: call `get_organisation`, `list_accounts`, `list_tax_rates`, and `list_tracking_categories` before creating invoices, payments, bank transactions, or journals.
- Contacts and items: use `list_contacts`/`get_contact` and `list_items`/`get_item` to find IDs before referencing them from invoices or payments.
- Invoices: create draft invoices first where possible, then use `get_invoice` to inspect Xero's calculated totals and validation state before updating status.
- Payments: call `get_invoice` and `list_accounts` first so the payment amount and account reference are valid.
- Reports: report tools require the matching granular report scope. If Xero returns insufficient scope, reconnect the Xero app with the report scope listed in the tool description or credential hint.

## Query filters

Xero list endpoints accept API-specific `where` and `order` expressions. Keep filters narrow and prefer `page` pagination over unbounded reads. Date fields should use ISO dates (`YYYY-MM-DD`) unless the Xero endpoint documents another format.

## Payroll

Payroll APIs are regional and not enabled for every organisation. Verify the demo company region and payroll scopes in the Xero developer portal before adding payroll tools to a live workflow. This integration currently ships Accounting API tools first.
