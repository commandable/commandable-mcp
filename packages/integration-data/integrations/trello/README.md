# Trello

**34 tools**

![Trello tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-trello.json)

## Credential variants

| Variant | Label |
|---|---|
| `api_key_token` | API Key + Token _(default)_ |

## Tools

| Tool | Scope | Description |
|---|---|---|
| `get_member` | read | Fetch the current member profile. |
| `get_member_boards` | read | List boards for the current member. |
| `get_member_organizations` | read | List organizations (workspaces) for the current member. |
| `get_board` | read | Fetch a board by id. |
| `get_board_lists` | read | List lists on a board. |
| `get_board_cards` | read | List cards on a board. |
| `get_board_members` | read | List members on a board. |
| `get_board_labels` | read | List labels on a board. |
| `get_board_custom_fields` | read | List custom fields on a board. |
| `get_board_memberships` | read | List memberships for a board. |
| `get_list` | read | Fetch a list by id. |
| `get_list_cards` | read | List cards in a list. |
| `get_card` | read | Fetch a card by id. |
| `get_card_members` | read | List members assigned to a card. |
| `get_card_attachments` | read | List attachments on a card. |
| `get_card_actions` | read | List actions (activity) on a card. |
| `get_card_checklists` | read | List checklists on a card. |
| `get_card_custom_field_items` | read | Get custom field items on a card. |
| `get_organization` | read | Fetch an organization (workspace) by id. |
| `get_organization_boards` | read | List boards in an organization (workspace). |
| `search` | read | Search across boards, cards, and members. |
| `create_board` | write | Create a new board. |
| `close_board` | write | Close a board (set closed=true). |
| `delete_board` | write | Permanently delete a closed board. |
| `create_card` | write | Create a new card in a list. |
| `update_card` | write | Update a card's fields (name, desc, due, list, etc). |
| `delete_card` | write | Delete a card. |
| `move_card_to_list` | write | Move a card to another list. |
| `add_member_to_card` | write | Add a member to a card. |
| `remove_member_from_card` | write | Remove a member from a card. |
| `add_checklist_to_card` | write | Create a checklist on a card. |
| `create_list` | write | Create a new list on a board. |
| `update_list` | write | Update a list (name, pos, closed). |
| `archive_list` | write | Archive a list (set closed=true). |
