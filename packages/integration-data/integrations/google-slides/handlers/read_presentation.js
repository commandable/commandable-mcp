async (input) => {
  const extractSlideText = (slide) => {
    const lines = []
    for (const element of slide?.pageElements || []) {
      const textElements = element?.shape?.text?.textElements || []
      let combined = ''
      for (const t of textElements) {
        combined += t?.textRun?.content || ''
      }
      const trimmed = combined
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      lines.push(...trimmed)
    }
    return lines
  }

  const { presentationId } = input
  const path = `/presentations/${encodeURIComponent(presentationId)}`
  const res = await integration.fetch(path)
  const presentation = await res.json()

  const title = presentation?.title || 'Untitled presentation'
  const deckId = presentation?.presentationId || presentationId
  const slides = presentation?.slides || []

  const lines = [
    `Presentation: "${title}" (ID: ${deckId})`,
    `URL: https://docs.google.com/presentation/d/${deckId}/edit`,
    `Total Slides: ${slides.length}`,
    '',
  ]

  for (let i = 0; i < slides.length; i += 1) {
    const slide = slides[i]
    const slideId = slide?.objectId || `slide_${i + 1}`
    const elementCount = (slide?.pageElements || []).length
    lines.push(`Slide ${i + 1}: ID ${slideId}, ${elementCount} element(s)`)

    const textLines = extractSlideText(slide)
    if (!textLines.length) {
      lines.push(' > (No text content)')
    } else {
      for (const text of textLines) lines.push(` > ${text}`)
    }
    lines.push('')
  }

  return lines.join('\n').trim()
}
