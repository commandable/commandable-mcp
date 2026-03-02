# Notion

**19 tools** across 2 toolsets

![Notion tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-notion.json)

## Credential variants

| Variant | Label |
|---|---|
| `internal_integration` | Internal Integration Token _(default)_ |

## Toolsets

| Toolset | Description |
|---|---|
| `pages` | Find, read, and edit Notion pages, blocks, comments, and users |
| `databases` | Query and manage Notion databases |

## Tools

| Tool | Scope | Toolset | Description |
|---|---|---|---|
| `search` | read | `pages` | Search across all accessible Notion content (pages, databases). |
| `retrieve_page` | read | `pages` | Retrieve a page by ID. |
| `retrieve_page_property_item` | read | `pages` | Retrieve a specific page property item (handles rollups and pagination). |
| `list_block_children` | read | `pages` | List child blocks for a block (including page blocks). |
| `retrieve_block` | read | `pages` | Retrieve a block by ID. |
| `list_users` | read | `pages` | List users in the workspace. |
| `retrieve_user` | read | `pages` | Retrieve a user by ID. |
| `list_comments` | read | `pages` | List comments for a given discussion or page block. |
| `get_me` | read | `pages` | Retrieve the authenticated user (bot) profile. |
| `create_page` | write | `pages` | Create a new page in a database or as a child of a page. |
| `update_page_properties` | write | `pages` | Update page properties, archive/unarchive, icon and cover. |
| `append_block_children` | write | `pages` | Append child blocks to a block (including page blocks). |
| `update_block` | write | `pages` | Update a block (content, archived state, etc). |
| `delete_block` | write | `pages` | Archive a block (soft delete). |
| `create_comment` | write | `pages` | Create a comment on a discussion or block. |
| `retrieve_database` | read | `databases` | Retrieve a database by ID. |
| `query_database` | read | `databases` | Query a database with optional filter, sorts, and pagination. |
| `create_database` | write | `databases` | Create a new database under a page. |
| `update_database` | write | `databases` | Update database title, description, properties, or archived state. |
