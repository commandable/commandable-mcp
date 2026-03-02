# Google Slides

**11 tools**

![Google Slides tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-google-slides.json)

## Credential variants

| Variant | Label |
|---|---|
| `service_account` | Service Account (recommended) _(default)_ |
| `oauth_token` | OAuth Access Token (short-lived) |

## Tools

| Tool | Scope | Description |
|---|---|---|
| `read_presentation` | read | Read a Google Slides presentation and return a human-readable summary including the title… |
| `get_page_thumbnail` | read | Generate a thumbnail image URL for a specific slide (page) in a presentation. Requires th… |
| `create_presentation` | write | Create a new empty Google Slides presentation with an optional title. Returns the created… |
| `batch_update` | write | Send a presentations.batchUpdate request for low-level slide modifications. Accepts an ar… |
| `append_text_to_title_of_slide_index` | write | Append text to the title shape of a specific slide by its 0-based index (slideIndex=0 is … |
| `replace_text_first_match` | write | Replace the first occurrence of text anywhere in the presentation with new text. Note: th… |
| `style_text_first_match` | write | Find the first occurrence of text in the presentation and apply a text style to it (bold,… |
| `insert_shape_after_first_match` | write | Find the first slide containing a text match and insert a rectangle shape on that slide a… |
| `insert_image_after_first_match` | write | Find the first slide containing a text match and insert an image on that slide from a URL… |
| `create_slide_after_first_match` | write | Find the first slide containing a text match and create a new blank slide immediately aft… |
| `set_background_color_for_slide_index` | write | Set the background color for a specific slide by its 0-based index (slideIndex=0 is the f… |
