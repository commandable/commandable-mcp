# Confluence

**11 tools**

![Confluence tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-confluence.json)

## Credential variants

| Variant | Label |
|---|---|
| `api_token` | API Token (Email + Token) _(default)_ |
| `oauth_token` | OAuth Access Token (3LO) |

## Tools

| Tool | Scope | Description |
|---|---|---|
| `list_spaces` | read | List Confluence spaces you can access. Use this to discover `spaceId`/`spaceKey` before s… |
| `get_space` | read | Get a Confluence space by `spaceId`, including its homepage and basic metadata. |
| `search_pages` | read | Search for pages using CQL (Confluence Query Language). Use this as the primary discovery… |
| `read_page` | read | Read a page and return agent-friendly Markdown extracted from Confluence storage format (… |
| `get_page_children` | read | List child content under a page (typically child pages). Use this to navigate page hierar… |
| `get_comments` | read | List footer comments for a page, optionally including their child replies. Use this to re… |
| `create_page` | write | Create a new Confluence page. Provide the body as Confluence storage format (XHTML). For … |
| `update_page` | write | Update an existing Confluence page. This tool auto-fetches the current version number and… |
| `delete_page` | write | Delete a Confluence page (moves it to trash by default). Use carefully. |
| `add_comment` | write | Add a footer comment to a Confluence page. Provide the body as Confluence storage format … |
| `add_label` | write | Add one or more labels to a Confluence page. Labels are useful for discovery via CQL (`la… |
