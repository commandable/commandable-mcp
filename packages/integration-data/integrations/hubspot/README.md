# HubSpot

**31 tools**

![HubSpot tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-hubspot.json)

## Credential variants

| Variant | Label |
|---|---|
| `private_app_token` | Private App Token _(default)_ |
| `oauth_token` | OAuth Access Token |

## Tools

| Tool | Scope | Description |
|---|---|---|
| `search_contacts` | read | Search for contacts. Use query for simple free-text search, and filters for precise prope… |
| `get_contact` | read | Get a contact by ID. Use properties to request specific fields, and associations to inclu… |
| `create_contact` | write | Create a contact. Provide common fields (firstname/lastname/email) and/or a properties ma… |
| `update_contact` | write | Update a contact by ID. Provide any fields to update as common fields and/or in the prope… |
| `archive_contact` | write | Archive (delete) a contact by ID. This moves the record to the recycle bin. |
| `search_companies` | read | Search for companies. Use query for free-text search and filters for property-based filte… |
| `get_company` | read | Get a company by ID. Use properties to request specific fields, and associations to inclu… |
| `create_company` | write | Create a company. Provide name/domain and/or a properties map for other HubSpot company p… |
| `update_company` | write | Update a company by ID. Provide any fields to update as common fields and/or in the prope… |
| `archive_company` | write | Archive (delete) a company by ID. This moves the record to the recycle bin. |
| `list_owners` | read | List CRM owners (users) available in the HubSpot account. Useful for assigning owners to … |
| `list_properties` | read | List properties for an object type (e.g. contacts, companies, deals, tickets). Use this t… |
| `list_pipelines` | read | List pipelines and stages for an object type (commonly deals or tickets). Use this to fin… |
| `get_associations` | read | Get associations from a CRM record to another object type. Returns the associated record … |
| `create_association` | write | Create a default (unlabeled) association between two CRM records. Example: associate a co… |
| `remove_association` | write | Remove an association between two CRM records. This uses HubSpot's association batch arch… |
| `search_deals` | read | Search for deals. Use query for free-text search and filters for property-based filtering… |
| `get_deal` | read | Get a deal by ID. Use properties to request specific fields, and associations to include … |
| `create_deal` | write | Create a deal. Provide dealname/amount/pipeline/dealstage and/or a properties map for oth… |
| `update_deal` | write | Update a deal by ID. Common updates include moving stages via dealstage. Fields not provi… |
| `archive_deal` | write | Archive (delete) a deal by ID. This moves the record to the recycle bin. |
| `search_tickets` | read | Search for tickets. Use query for free-text search and filters for property-based filteri… |
| `get_ticket` | read | Get a ticket by ID. Use properties to request specific fields, and associations to includ… |
| `create_ticket` | write | Create a ticket. Provide subject/content/pipeline/stage and/or a properties map for other… |
| `update_ticket` | write | Update a ticket by ID. Common updates include changing hs_pipeline_stage. Fields not prov… |
| `archive_ticket` | write | Archive (delete) a ticket by ID. This moves the record to the recycle bin. |
| `search_notes` | read | Search notes. Use query for free-text search and filters for precise property-based filte… |
| `create_note` | write | Create a note and (optionally) associate it to one or more CRM records (contacts, compani… |
| `search_tasks` | read | Search tasks. Use query for free-text search and filters for precise property-based filte… |
| `create_task` | write | Create a task and (optionally) associate it to one or more CRM records. Provide subject/b… |
| `update_task` | write | Update a task by ID. Common updates include setting hs_task_status to COMPLETED. |

## Compact response notes

- `search_contacts`, `search_companies`, `search_deals`, and `search_tickets` return compact summaries.
- Use matching detail tools (`get_contact`, `get_company`, `get_deal`, `get_ticket`) for full record payloads.
