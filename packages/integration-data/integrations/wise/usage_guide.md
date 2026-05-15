## Wise workflow

Most Wise API operations require a `profileId`. Start with `list_profiles` and choose the intended personal or business profile before creating quotes, recipients, transfers, balances, or account details.

For sending money, use this sequence:

1. `list_profiles` to choose the profile.
2. `list_recipients` or `create_recipient_simple` to choose or create the beneficiary.
3. `create_quote` to lock the exchange rate and fees for about 30 minutes.
4. `create_transfer` to prepare the transfer order.
5. Ask the user to fund the transfer in Wise using the returned funding link or by opening Wise.

The `send_money` tool performs steps 2-4 in one call. It does not fund the transfer. It returns `requiresAction: "FUND_IN_WISE_UI"` and a `fundingUrl` when a transfer order is created.

## Funding caveat

Creating a transfer is not the same as sending money. Wise only starts processing when the transfer is funded. API funding is SCA-protected and is not available through this v1 integration. Prepared transfers normally expire if they are not funded within 14 days.

## Recipient requirements

Wise recipient fields vary by country, currency, and payout route. Prefer `create_recipient_simple` for common routes such as IBAN, SWIFT/BIC, UK sort code, US routing number, account number, email, or phone. If Wise rejects a recipient as missing route-specific details, call `get_recipient_requirements` for the quote and retry with the needed fields in `extraFields` or an explicit `type`.

## Quotes and idempotency

Use `create_quote` when you need Wise's exact fee, delivery estimate, and locked exchange rate. `get_exchange_rate` is only for quick rate checks.

`create_transfer` and `send_money` accept `customerTransactionId` for idempotency. If omitted, the handler generates one. Reuse the same value when retrying the same transfer request after a network failure.

## Balances and account details

Use `list_balances` before moving money between balances so you can choose valid `balanceId` values. Cross-currency balance movements usually need a quote created with `payOut: "BALANCE"`.

Use `list_account_details` to see local and international receiving details that already exist. `create_account_details_order` may return requirements that must be completed in Wise before the account details become active.
