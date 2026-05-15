export const wiseLiveCoverageSkips: Record<string, string> = {
  create_account_details_order: 'Ordering account details is not reliably repeatable in a shared sandbox profile; once details exist for a currency, repeat calls can fail or return requirement-specific states.',
}
