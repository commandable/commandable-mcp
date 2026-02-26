## Appending paragraph blocks

When appending a paragraph block to a Notion page, ensure the `rich_text` field is correctly defined within the `paragraph` type. Example format:

```json
{
  "block_id": "<page_id>",
  "children": [
    {
      "object": "block",
      "type": "paragraph",
      "paragraph": {
        "rich_text": [
          {
            "type": "text",
            "text": {
              "content": "Your text here"
            }
          }
        ]
      }
    }
  ]
}
```

