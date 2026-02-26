async (input) => {
  const res = await integration.fetch('/users/me/calendarList')
  return await res.json()
}
