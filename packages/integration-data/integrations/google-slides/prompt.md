## Presentation and slide IDs

The presentationId appears in the Google Slides URL:
`https://docs.google.com/presentation/d/{presentationId}/edit`

Each slide has an `objectId` (a string like `p` or `g12345abcde`). Use `read_presentation` first to discover slide objectIds and extracted text content by slide.

## Slide addressing

The higher-level tools use `slideIndex` (0-based integer):
- `slideIndex=0` — first slide
- `slideIndex=1` — second slide

The lower-level `batch_update` requires `objectId` strings. Use `read_presentation` output to map slide order and IDs before editing.
If you need raw structure details, call `batch_update` only for the operation you are performing.

## First-match tools

The `*_first_match` tools search all slides for text content by JSON-stringifying each slide's content. They use the marker pattern (replace → find → act → restore), making 3 API calls per operation. They return `{applied: true/false}`.

## EMU units

Positions and sizes in the `batch_update` API use EMU (English Metric Units):
- 1 inch = 914400 EMU
- 1 cm ≈ 360000 EMU
- Standard slide dimensions: 9144000 × 5143500 EMU (10 × 5.625 inches, 16:9)

## Common batch_update operations

```json
{ "requests": [
  { "createSlide": { "insertionIndex": 1, "slideLayoutReference": { "predefinedLayout": "BLANK" } } },
  { "insertText": { "objectId": "shapeId", "text": "Hello World", "insertionIndex": 0 } },
  { "updateTextStyle": {
      "objectId": "shapeId",
      "style": { "bold": true, "fontSize": { "magnitude": 24, "unit": "PT" } },
      "fields": "bold,fontSize",
      "textRange": { "type": "ALL" }
  }},
  { "replaceAllText": {
      "containsText": { "text": "{{placeholder}}" },
      "replaceText": "New value"
  }}
]}
```

## Predefined slide layouts

Use with `createSlide`: `BLANK`, `CAPTION_ONLY`, `TITLE`, `TITLE_AND_BODY`, `TITLE_AND_TWO_COLUMNS`, `TITLE_ONLY`, `SECTION_HEADER`, `SECTION_TITLE_AND_DESCRIPTION`, `ONE_COLUMN_TEXT`, `MAIN_POINT`, `BIG_NUMBER`

## Colors

In `batch_update`, colors use RGB values in 0.0–1.0 range:
```json
{ "opaqueColor": { "rgbColor": { "red": 1.0, "green": 0.5, "blue": 0.0 } } }
```
