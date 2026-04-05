import type { GeneratedIntegrationEntry } from '../types.js'

export const GENERATED_INTEGRATIONS: Record<string, GeneratedIntegrationEntry> = {
  "airtable": {
    "manifest": {
      "name": "airtable",
      "version": "0.1.0",
      "baseUrl": "https://api.airtable.com/v0",
      "tools": [
        {
          "name": "list_bases",
          "description": "List bases available to the authenticated user.",
          "inputSchema": "schemas/empty.json",
          "handler": "handlers/list_bases.js",
          "scope": "read"
        },
        {
          "name": "list_tables",
          "description": "List tables in a base (metadata).",
          "inputSchema": "schemas/id_base.json",
          "handler": "handlers/list_tables.js",
          "scope": "read"
        },
        {
          "name": "get_table_schema",
          "description": "Fetch a table's schema (fields, views) by tableId via metadata.",
          "inputSchema": "schemas/id_base_table.json",
          "handler": "handlers/get_table_schema.js",
          "scope": "read"
        },
        {
          "name": "list_table_fields",
          "description": "List fields for a table (metadata).",
          "inputSchema": "schemas/id_base_table.json",
          "handler": "handlers/list_table_fields.js",
          "scope": "read"
        },
        {
          "name": "list_views",
          "description": "List views for a table (metadata).",
          "inputSchema": "schemas/id_base_table.json",
          "handler": "handlers/list_views.js",
          "scope": "read"
        },
        {
          "name": "list_records",
          "description": "List records from a table with optional filters.",
          "inputSchema": "schemas/list_records.json",
          "handler": "handlers/list_records.js",
          "scope": "read"
        },
        {
          "name": "get_record",
          "description": "Fetch a single record by recordId.",
          "inputSchema": "schemas/get_record.json",
          "handler": "handlers/get_record.js",
          "scope": "read"
        },
        {
          "name": "search_records",
          "description": "Search records in a table using a field and value (filterByFormula).",
          "inputSchema": "schemas/search_records.json",
          "handler": "handlers/search_records.js",
          "scope": "read"
        },
        {
          "name": "create_record",
          "description": "Create a record in a table.",
          "inputSchema": "schemas/create_record.json",
          "handler": "handlers/create_record.js",
          "scope": "write"
        },
        {
          "name": "update_record",
          "description": "Update a record in a table.",
          "inputSchema": "schemas/update_record.json",
          "handler": "handlers/update_record.js",
          "scope": "write"
        },
        {
          "name": "delete_record",
          "description": "Delete a record from a table.",
          "inputSchema": "schemas/delete_record.json",
          "handler": "handlers/delete_record.js",
          "scope": "write"
        }
      ]
    },
    "prompt": null,
    "variants": {
      "variants": {
        "personal_access_token": {
          "label": "Personal Access Token",
          "schema": {
            "type": "object",
            "properties": {
              "token": {
                "type": "string",
                "title": "Personal Access Token",
                "description": "Airtable personal access token."
              }
            },
            "required": [
              "token"
            ],
            "additionalProperties": false
          },
          "injection": {
            "headers": {
              "Authorization": "Bearer {{token}}"
            }
          },
          "healthCheck": {
            "path": "/meta/whoami"
          }
        }
      },
      "default": "personal_access_token"
    },
    "hint": "Create an Airtable personal access token and paste it here.\n\nYou can generate one in Airtable account settings under developer tools / personal access tokens.",
    "hintsByVariant": {},
    "tools": [
      {
        "name": "list_bases",
        "description": "List bases available to the authenticated user.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/meta/bases`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "list_tables",
        "description": "List tables in a base (metadata).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "baseId"
          ],
          "properties": {
            "baseId": {
              "type": "string",
              "description": "Airtable base ID"
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/meta/bases/${input.baseId}/tables`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_table_schema",
        "description": "Fetch a table's schema (fields, views) by tableId via metadata.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "baseId",
            "tableId"
          ],
          "properties": {
            "baseId": {
              "type": "string",
              "description": "Airtable base ID"
            },
            "tableId": {
              "type": "string",
              "description": "Airtable table ID (tbl...)"
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/meta/bases/${input.baseId}/tables`)\n  const data = await res.json()\n  const table = (data?.tables || data)?.find?.(t => t.id === input.tableId || t.name === input.tableId)\n  return table || null\n}",
        "scope": "read"
      },
      {
        "name": "list_table_fields",
        "description": "List fields for a table (metadata).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "baseId",
            "tableId"
          ],
          "properties": {
            "baseId": {
              "type": "string",
              "description": "Airtable base ID"
            },
            "tableId": {
              "type": "string",
              "description": "Airtable table ID (tbl...)"
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/meta/bases/${input.baseId}/tables`)\n  const data = await res.json()\n  const table = (data?.tables || data)?.find?.(t => t.id === input.tableId || t.name === input.tableId)\n  return table?.fields || []\n}",
        "scope": "read"
      },
      {
        "name": "list_views",
        "description": "List views for a table (metadata).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "baseId",
            "tableId"
          ],
          "properties": {
            "baseId": {
              "type": "string",
              "description": "Airtable base ID"
            },
            "tableId": {
              "type": "string",
              "description": "Airtable table ID (tbl...)"
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/meta/bases/${input.baseId}/tables`)\n  const data = await res.json()\n  const table = (data?.tables || data)?.find?.(t => t.id === input.tableId || t.name === input.tableId)\n  return table?.views || []\n}",
        "scope": "read"
      },
      {
        "name": "list_records",
        "description": "List records from a table with optional filters.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "baseId",
            "tableId"
          ],
          "properties": {
            "baseId": {
              "type": "string"
            },
            "tableId": {
              "type": "string"
            },
            "view": {
              "type": "string",
              "description": "Optional view name or ID"
            },
            "maxRecords": {
              "type": "integer",
              "minimum": 1
            },
            "pageSize": {
              "type": "integer",
              "minimum": 1
            },
            "filterByFormula": {
              "type": "string"
            },
            "sort": {
              "type": "array",
              "items": {
                "type": "object",
                "required": [
                  "field"
                ],
                "properties": {
                  "field": {
                    "type": "string"
                  },
                  "direction": {
                    "type": "string",
                    "enum": [
                      "asc",
                      "desc"
                    ]
                  }
                },
                "additionalProperties": false
              }
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const summarizeValue = (value) => {\n    if (value === null || value === undefined)\n      return null\n    if (typeof value === 'string')\n      return value.length <= 120 ? value : `${value.slice(0, 117)}...`\n    if (typeof value === 'number' || typeof value === 'boolean')\n      return value\n    if (Array.isArray(value))\n      return `[array:${value.length}]`\n    if (typeof value === 'object')\n      return '[object]'\n    return String(value)\n  }\n\n  const summarizeRecord = (record) => {\n    const fields = record && typeof record === 'object' && record.fields && typeof record.fields === 'object'\n      ? record.fields\n      : {}\n    const fieldNames = Object.keys(fields)\n    const firstFieldName = fieldNames[0] || null\n    const firstFieldValue = firstFieldName ? summarizeValue(fields[firstFieldName]) : null\n    return {\n      id: record?.id || null,\n      createdTime: record?.createdTime || null,\n      fieldCount: fieldNames.length,\n      fieldNames,\n      primaryFieldName: firstFieldName,\n      primaryFieldValue: firstFieldValue,\n    }\n  }\n\n  const params = new URLSearchParams()\n  if (input.view)\n    params.set('view', input.view)\n  if (input.maxRecords)\n    params.set('maxRecords', String(input.maxRecords))\n  if (input.pageSize)\n    params.set('pageSize', String(input.pageSize))\n  if (input.filterByFormula)\n    params.set('filterByFormula', input.filterByFormula)\n  if (input.sort && Array.isArray(input.sort)) {\n    input.sort.forEach((s, i) => {\n      if (s && typeof s === 'object') {\n        if (s.field)\n          params.set(`sort[${i}][field]`, String(s.field))\n        if (s.direction)\n          params.set(`sort[${i}][direction]`, String(s.direction))\n      }\n    })\n  }\n  const qs = params.toString()\n  const path = `/${input.baseId}/${input.tableId}${qs ? `?${qs}` : ''}`\n  const res = await integration.fetch(path)\n  const data = await res.json()\n  const records = Array.isArray(data?.records) ? data.records.map(summarizeRecord) : []\n  return {\n    count: records.length,\n    offset: data?.offset || null,\n    note: 'Use record id with get_record for full field data.',\n    records,\n  }\n}",
        "scope": "read"
      },
      {
        "name": "get_record",
        "description": "Fetch a single record by recordId.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "baseId",
            "tableId",
            "recordId"
          ],
          "properties": {
            "baseId": {
              "type": "string"
            },
            "tableId": {
              "type": "string"
            },
            "recordId": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/${input.baseId}/${input.tableId}/${input.recordId}`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "search_records",
        "description": "Search records in a table using a field and value (filterByFormula).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "baseId",
            "tableId",
            "field",
            "value"
          ],
          "properties": {
            "baseId": {
              "type": "string"
            },
            "tableId": {
              "type": "string"
            },
            "field": {
              "type": "string",
              "description": "Field name to match"
            },
            "value": {
              "type": "string",
              "description": "Value to search for"
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const summarizeValue = (value) => {\n    if (value === null || value === undefined)\n      return null\n    if (typeof value === 'string')\n      return value.length <= 120 ? value : `${value.slice(0, 117)}...`\n    if (typeof value === 'number' || typeof value === 'boolean')\n      return value\n    if (Array.isArray(value))\n      return `[array:${value.length}]`\n    if (typeof value === 'object')\n      return '[object]'\n    return String(value)\n  }\n\n  const summarizeRecord = (record) => {\n    const fields = record && typeof record === 'object' && record.fields && typeof record.fields === 'object'\n      ? record.fields\n      : {}\n    const fieldNames = Object.keys(fields)\n    const matchField = typeof input.field === 'string' ? input.field : null\n    const matchValue = matchField ? summarizeValue(fields[matchField]) : null\n    return {\n      id: record?.id || null,\n      createdTime: record?.createdTime || null,\n      fieldCount: fieldNames.length,\n      fieldNames,\n      matchField,\n      matchValue,\n    }\n  }\n\n  const formula = `{${input.field}} = \"${input.value}\"`\n  const params = new URLSearchParams({ filterByFormula: formula })\n  const res = await integration.fetch(`/${input.baseId}/${input.tableId}?${params.toString()}`)\n  const data = await res.json()\n  const records = Array.isArray(data?.records) ? data.records.map(summarizeRecord) : []\n  return {\n    count: records.length,\n    offset: data?.offset || null,\n    note: 'Use record id with get_record for full field data.',\n    records,\n  }\n}",
        "scope": "read"
      },
      {
        "name": "create_record",
        "description": "Create a record in a table.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "baseId": {
              "type": "string",
              "description": "Airtable base ID"
            },
            "tableId": {
              "type": "string",
              "description": "Airtable table ID or name"
            },
            "fields": {
              "type": "object",
              "description": "Field values for the new record"
            },
            "typecast": {
              "type": "boolean",
              "description": "Coerce values to field types"
            }
          },
          "required": [
            "baseId",
            "tableId",
            "fields"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const path = `/${input.baseId}/${input.tableId}`\n  const body = {\n    records: [\n      { fields: input.fields },\n    ],\n    typecast: !!input.typecast,\n  }\n  const res = await integration.fetch(path, { method: 'POST', body })\n  const data = await res.json()\n  return data\n}",
        "scope": "write"
      },
      {
        "name": "update_record",
        "description": "Update a record in a table.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "baseId": {
              "type": "string"
            },
            "tableId": {
              "type": "string"
            },
            "recordId": {
              "type": "string"
            },
            "fields": {
              "type": "object"
            },
            "typecast": {
              "type": "boolean"
            }
          },
          "required": [
            "baseId",
            "tableId",
            "recordId",
            "fields"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const path = `/${input.baseId}/${input.tableId}`\n  const body = {\n    records: [\n      { id: input.recordId, fields: input.fields },\n    ],\n    typecast: !!input.typecast,\n  }\n  const res = await integration.fetch(path, { method: 'PATCH', body })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "delete_record",
        "description": "Delete a record from a table.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "baseId": {
              "type": "string"
            },
            "tableId": {
              "type": "string"
            },
            "recordId": {
              "type": "string"
            }
          },
          "required": [
            "baseId",
            "tableId",
            "recordId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const path = `/${input.baseId}/${input.tableId}`\n  const params = new URLSearchParams()\n  params.set('records[]', input.recordId)\n  const res = await integration.fetch(`${path}?${params.toString()}`, { method: 'DELETE' })\n  return await res.json()\n}",
        "scope": "write"
      }
    ]
  },
  "confluence": {
    "manifest": {
      "name": "confluence",
      "version": "0.1.0",
      "utils": [
        "html"
      ],
      "tools": [
        {
          "name": "list_spaces",
          "description": "List Confluence spaces you can access. Use this to discover `spaceId`/`spaceKey` before searching or creating pages. Pagination uses `cursor` from the previous response.",
          "inputSchema": "schemas/list_spaces.json",
          "handler": "handlers/list_spaces.js",
          "scope": "read"
        },
        {
          "name": "get_space",
          "description": "Get a Confluence space by `spaceId`, including its homepage and basic metadata.",
          "inputSchema": "schemas/get_space.json",
          "handler": "handlers/get_space.js",
          "scope": "read"
        },
        {
          "name": "search_pages",
          "description": "Search for pages using CQL (Confluence Query Language). Use this as the primary discovery tool to find page IDs. Example CQL: `space = \"ENG\" AND type = page AND text ~ \"onboarding\" ORDER BY lastmodified DESC`.",
          "inputSchema": "schemas/search_pages.json",
          "handler": "handlers/search_pages.js",
          "scope": "read"
        },
        {
          "name": "read_page",
          "description": "Read a page and return its content in Confluence storage format (XHTML). Set `outputMarkdown: true` to get Markdown instead — useful for quick reading or summarisation but lossy, do not use it if you plan to edit the page.",
          "inputSchema": "schemas/read_page.json",
          "handler": "handlers/read_page.js",
          "scope": "read"
        },
        {
          "name": "get_page_children",
          "description": "List child content under a page (typically child pages). Use this to navigate page hierarchies and build a table-of-contents workflow.",
          "inputSchema": "schemas/get_page_children.json",
          "handler": "handlers/get_page_children.js",
          "scope": "read"
        },
        {
          "name": "get_comments",
          "description": "List footer comments for a page, optionally including their child replies. Use this to review discussion threads on a page.",
          "inputSchema": "schemas/get_comments.json",
          "handler": "handlers/get_comments.js",
          "scope": "read"
        },
        {
          "name": "create_page",
          "description": "Create a new Confluence page. Provide the body as Confluence storage format (XHTML). For simple pages you can use basic HTML like `<h1>`, `<p>`, `<ul>`, `<li>`, `<code>`, and links.",
          "inputSchema": "schemas/create_page.json",
          "handler": "handlers/create_page.js",
          "scope": "write"
        },
        {
          "name": "update_page",
          "description": "Update an existing Confluence page. This tool auto-fetches the current version number and increments it, so you don't need to manage versioning. Provide the body as Confluence storage format (XHTML).",
          "inputSchema": "schemas/update_page.json",
          "handler": "handlers/update_page.js",
          "scope": "write"
        },
        {
          "name": "delete_page",
          "description": "Delete a Confluence page (moves it to trash by default). Use carefully.",
          "inputSchema": "schemas/delete_page.json",
          "handler": "handlers/delete_page.js",
          "scope": "write"
        },
        {
          "name": "add_comment",
          "description": "Add a footer comment to a Confluence page. Provide the body as Confluence storage format (XHTML). Optionally set `parentCommentId` to create a threaded reply.",
          "inputSchema": "schemas/add_comment.json",
          "handler": "handlers/add_comment.js",
          "scope": "write"
        },
        {
          "name": "add_label",
          "description": "Add one or more labels to a Confluence page. Labels are useful for discovery via CQL (`label = \"...\"`).",
          "inputSchema": "schemas/add_label.json",
          "handler": "handlers/add_label.js",
          "scope": "write"
        }
      ]
    },
    "prompt": "# Confluence usage guide\n\n## Recommended workflow\n\n1. Use `list_spaces` (or `search_pages`) to discover where content lives.\n2. Use `search_pages` with CQL to find the right page ID(s).\n3. Use `read_page` to get the page content as Confluence storage format (XHTML).\n4. For edits, use `update_page` with storage XHTML in `bodyStorage` (it automatically handles version increments).\n\n## Content format\n\nAll content is exchanged in **Confluence storage format (XHTML)**. This applies to both reads (`contentStorage` field in `read_page`) and writes (`bodyStorage` field in `create_page`, `update_page`, `add_comment`).\n\nCommon markup:\n\n- Headings: `<h1>Title</h1>`, `<h2>Section</h2>`\n- Paragraphs: `<p>Text</p>`\n- Lists: `<ul><li>Item</li></ul>`, `<ol><li>Item</li></ol>`\n- Inline code: `<code>const x = 1</code>`\n- Code blocks: `<pre><code>...</code></pre>`\n- Links: `<a href=\"https://example.com\">Example</a>`\n- Tables: `<table><tr><th>A</th></tr><tr><td>1</td></tr></table>`\n- Macros: `<ac:structured-macro ac:name=\"info\"><ac:rich-text-body><p>Note</p></ac:rich-text-body></ac:structured-macro>`\n\nUsing XHTML natively means round-tripping pages preserves all formatting, macros, and Confluence-specific markup.\n\n`read_page` accepts `outputMarkdown: true` to return content as Markdown instead of XHTML. \n\n## CQL (Confluence Query Language) quick reference\n\nCommon patterns for `search_pages.cql`:\n\n- Restrict to a space:\n  - `space = \"ENG\" AND type = page`\n- Title match:\n  - `title ~ \"runbook\" AND type = page`\n- Full-text match:\n  - `text ~ \"oncall\" AND type = page`\n- Label match:\n  - `label = \"runbook\" AND type = page`\n- Combine filters:\n  - `space = \"ENG\" AND type = page AND (title ~ \"onboarding\" OR text ~ \"onboarding\")`\n- Sort:\n  - `... ORDER BY lastmodified DESC`\n\nTips:\n- Prefer small `limit` (e.g. 10) and paginate with `start`.\n- Use labels as a stable way to group pages for later discovery.\n\n## Page hierarchy\n\n- Spaces contain pages.\n- Pages can be nested under a parent page (`parentId`).\n- Use `get_page_children` to traverse a documentation tree (e.g. a handbook or runbook index).\n\n",
    "variants": {
      "variants": {
        "api_token": {
          "label": "API Token (Email + Token)",
          "schema": {
            "type": "object",
            "properties": {
              "domain": {
                "type": "string",
                "title": "Confluence site domain",
                "description": "The subdomain of your Confluence Cloud site. Example: for https://mycompany.atlassian.net/wiki, enter 'mycompany'."
              },
              "email": {
                "type": "string",
                "title": "Atlassian account email",
                "description": "Email address of the Atlassian account that owns the API token."
              },
              "apiToken": {
                "type": "string",
                "title": "Atlassian API token",
                "description": "Atlassian API token for Confluence Cloud. Combined with your email to form the Basic auth header."
              }
            },
            "required": [
              "domain",
              "email",
              "apiToken"
            ],
            "additionalProperties": false
          },
          "baseUrlTemplate": "https://{{domain}}.atlassian.net",
          "injection": {
            "headers": {
              "Authorization": "Basic {{base64(email + \":\" + apiToken)}}",
              "Accept": "application/json"
            }
          },
          "healthCheck": {
            "path": "/wiki/rest/api/user/current"
          }
        }
      },
      "default": "api_token"
    },
    "hint": "Recommended: use **API Token (Email + Token)** unless you specifically need OAuth.\n\nIf you have multiple credential variants available, select one and follow its setup instructions.",
    "hintsByVariant": {
      "api_token": "Set up Confluence Cloud API token auth:\n\n1. Open your Confluence site (it looks like `https://YOUR_DOMAIN.atlassian.net/wiki`)\n2. Copy `YOUR_DOMAIN` (the subdomain) and use it as `domain`\n3. Create an Atlassian API token at `https://id.atlassian.com/manage-profile/security/api-tokens`\n4. Use the Atlassian account email as `email` and paste the token as `apiToken`\n\nNote: The server computes the required Basic auth header for you.",
      "oauth_token": "Set up Confluence Cloud OAuth (3LO):\n\n1. Create an OAuth 2.0 (3LO) app in the Atlassian developer console\n2. Add Confluence scopes (typical minimum): read:page:confluence, write:page:confluence, read:space:confluence (plus offline_access if you want refresh tokens)\n3. Complete the OAuth flow to obtain an access token\n4. Call `GET https://api.atlassian.com/oauth/token/accessible-resources` with `Authorization: Bearer <access_token>` to get `cloudId`\n5. Paste `cloudId` and the OAuth access `token` here"
    },
    "tools": [
      {
        "name": "list_spaces",
        "description": "List Confluence spaces you can access. Use this to discover `spaceId`/`spaceKey` before searching or creating pages. Pagination uses `cursor` from the previous response.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "ids": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Optional list of space IDs to filter by."
            },
            "keys": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Optional list of space keys to filter by."
            },
            "type": {
              "type": "string",
              "description": "Optional space type filter (e.g. global, personal)."
            },
            "status": {
              "type": "string",
              "description": "Optional space status filter (e.g. current, archived)."
            },
            "limit": {
              "type": "integer",
              "minimum": 1,
              "maximum": 250,
              "default": 50,
              "description": "Maximum number of spaces to return."
            },
            "cursor": {
              "type": [
                "string",
                "null"
              ],
              "description": "Pagination cursor from a previous response."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n\n  if (Array.isArray(input.ids))\n    for (const id of input.ids) params.append('ids', String(id))\n  if (Array.isArray(input.keys))\n    for (const key of input.keys) params.append('keys', String(key))\n  if (typeof input.type === 'string' && input.type)\n    params.set('type', input.type)\n  if (typeof input.status === 'string' && input.status)\n    params.set('status', input.status)\n\n  const limit = typeof input.limit === 'number' ? input.limit : undefined\n  if (limit) params.set('limit', String(limit))\n\n  if (input.cursor) params.set('cursor', String(input.cursor))\n\n  const path = `/wiki/api/v2/spaces${params.toString() ? `?${params}` : ''}`\n  const res = await integration.fetch(path)\n  const data = await res.json()\n\n  const results = Array.isArray(data?.results)\n    ? data.results.map((s) => ({\n        id: s.id,\n        key: s.key,\n        name: s.name,\n        type: s.type,\n        status: s.status,\n        homepageId: s.homepageId,\n        webui: s?._links?.webui,\n      }))\n    : []\n\n  return {\n    results,\n    links: data?._links || {},\n  }\n}",
        "utils": [
          "html"
        ],
        "scope": "read"
      },
      {
        "name": "get_space",
        "description": "Get a Confluence space by `spaceId`, including its homepage and basic metadata.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "spaceId": {
              "type": "string",
              "title": "Space ID",
              "description": "The Confluence space ID."
            },
            "includePermissions": {
              "type": "boolean",
              "default": false,
              "description": "If true, include permissions in the response (may be verbose)."
            }
          },
          "required": [
            "spaceId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const spaceId = encodeURIComponent(String(input.spaceId))\n  const params = new URLSearchParams()\n  if (input.includePermissions) params.set('include-permissions', 'true')\n\n  const path = `/wiki/api/v2/spaces/${spaceId}${params.toString() ? `?${params}` : ''}`\n  const res = await integration.fetch(path)\n  const data = await res.json()\n\n  return {\n    id: data?.id,\n    key: data?.key,\n    name: data?.name,\n    type: data?.type,\n    status: data?.status,\n    homepageId: data?.homepageId,\n    description: data?.description,\n    links: data?._links || {},\n    raw: data,\n  }\n}",
        "utils": [
          "html"
        ],
        "scope": "read"
      },
      {
        "name": "search_pages",
        "description": "Search for pages using CQL (Confluence Query Language). Use this as the primary discovery tool to find page IDs. Example CQL: `space = \"ENG\" AND type = page AND text ~ \"onboarding\" ORDER BY lastmodified DESC`.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "cql": {
              "type": "string",
              "title": "CQL",
              "description": "Confluence Query Language string. Example: `space = \"ENG\" AND type = page AND text ~ \"onboarding\" ORDER BY lastmodified DESC`."
            },
            "limit": {
              "type": "integer",
              "minimum": 1,
              "maximum": 50,
              "default": 10,
              "description": "Maximum results to return."
            },
            "start": {
              "type": "integer",
              "minimum": 0,
              "default": 0,
              "description": "Offset into results for pagination (v1 search)."
            }
          },
          "required": [
            "cql"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const limit = typeof input.limit === 'number' ? input.limit : 10\n  const start = typeof input.start === 'number' ? input.start : 0\n\n  const params = new URLSearchParams()\n  params.set('cql', String(input.cql))\n  params.set('limit', String(limit))\n  params.set('start', String(start))\n  params.set('expand', 'content.space,content.version')\n\n  const res = await integration.fetch(`/wiki/rest/api/search?${params}`)\n  const data = await res.json()\n\n  const results = Array.isArray(data?.results)\n    ? data.results\n        .map((r) => {\n          const c = r?.content || {}\n          return {\n            id: c.id,\n            type: c.type,\n            title: c.title,\n            spaceKey: c?.space?.key,\n            version: c?.version?.number,\n            lastModified: c?.version?.when,\n            excerpt: r?.excerpt,\n            webui: c?._links?.webui,\n          }\n        })\n        .filter((x) => x.id)\n    : []\n\n  return {\n    cql: input.cql,\n    start: data?.start ?? start,\n    limit: data?.limit ?? limit,\n    size: data?.size ?? results.length,\n    totalSize: data?.totalSize,\n    results,\n    links: data?._links || {},\n  }\n}",
        "utils": [
          "html"
        ],
        "scope": "read"
      },
      {
        "name": "read_page",
        "description": "Read a page and return its content in Confluence storage format (XHTML). Set `outputMarkdown: true` to get Markdown instead — useful for quick reading or summarisation but lossy, do not use it if you plan to edit the page.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "pageId": {
              "type": "string",
              "title": "Page ID",
              "description": "The Confluence page ID."
            },
            "includeLabels": {
              "type": "boolean",
              "default": true,
              "description": "Include labels in the response."
            },
            "includeProperties": {
              "type": "boolean",
              "default": false,
              "description": "Include content properties (may be verbose)."
            },
            "outputMarkdown": {
              "type": "boolean",
              "default": false,
              "description": "Return content as Markdown instead of Confluence storage XHTML. Useful for quick reading or summarisation. Lossy — macros and rich formatting are stripped. Do not use this format if you intend to edit the page."
            }
          },
          "required": [
            "pageId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const buildWebUrl = (links) => {\n    const base = links?.base\n    const webui = links?.webui\n    if (!webui) return null\n    if (/^https?:\\/\\//.test(webui)) return webui\n    if (base && /^https?:\\/\\//.test(base)) {\n      try { return new URL(webui, base).toString() } catch {}\n    }\n    return webui\n  }\n\n  const pageId = encodeURIComponent(String(input.pageId))\n\n  const params = new URLSearchParams()\n  params.set('body-format', 'storage')\n  if (input.includeLabels) params.set('include-labels', 'true')\n  if (input.includeProperties) params.set('include-properties', 'true')\n\n  const res = await integration.fetch(`/wiki/api/v2/pages/${pageId}?${params}`)\n  const data = await res.json()\n\n  const storage = data?.body?.storage\n  const storageValue = typeof storage === 'string'\n    ? storage\n    : (typeof storage?.value === 'string' ? storage.value : '')\n\n  const meta = {\n    id: data?.id,\n    title: data?.title,\n    spaceId: data?.spaceId,\n    parentId: data?.parentId,\n    status: data?.status,\n    version: data?.version?.number,\n    createdAt: data?.createdAt,\n    webUrl: buildWebUrl(data?._links),\n    labels: data?.labels?.results,\n    links: data?._links || {},\n  }\n\n  if (input.outputMarkdown) {\n    const md = storageValue ? (utils.html?.toMarkdown(storageValue) || '') : ''\n    const note = '\\n\\n---\\n_System note: this is a Markdown representation of the page. If you intend to edit it, re-fetch without `outputMarkdown` to get the storage XHTML and avoid accidentally deleting macros or hidden content._'\n    return { ...meta, contentMarkdown: md ? md + note : null }\n  }\n\n  return { ...meta, contentStorage: storageValue || null }\n}",
        "utils": [
          "html"
        ],
        "scope": "read"
      },
      {
        "name": "get_page_children",
        "description": "List child content under a page (typically child pages). Use this to navigate page hierarchies and build a table-of-contents workflow.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "pageId": {
              "type": "string",
              "title": "Page ID",
              "description": "The Confluence page ID."
            },
            "limit": {
              "type": "integer",
              "minimum": 1,
              "maximum": 250,
              "default": 50,
              "description": "Maximum number of children to return."
            },
            "cursor": {
              "type": [
                "string",
                "null"
              ],
              "description": "Pagination cursor from a previous response."
            },
            "sort": {
              "type": "string",
              "description": "Optional sort key (API-specific)."
            }
          },
          "required": [
            "pageId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const pageId = encodeURIComponent(String(input.pageId))\n  const params = new URLSearchParams()\n\n  const limit = typeof input.limit === 'number' ? input.limit : undefined\n  if (limit) params.set('limit', String(limit))\n  if (input.cursor) params.set('cursor', String(input.cursor))\n  if (typeof input.sort === 'string' && input.sort) params.set('sort', input.sort)\n\n  const res = await integration.fetch(`/wiki/api/v2/pages/${pageId}/children${params.toString() ? `?${params}` : ''}`)\n  const data = await res.json()\n\n  const results = Array.isArray(data?.results)\n    ? data.results.map((c) => ({\n        id: c.id,\n        type: c.type,\n        status: c.status,\n        title: c.title,\n        parentId: c.parentId,\n        spaceId: c.spaceId,\n        links: c?._links || {},\n      }))\n    : []\n\n  return {\n    results,\n    links: data?._links || {},\n  }\n}",
        "utils": [
          "html"
        ],
        "scope": "read"
      },
      {
        "name": "get_comments",
        "description": "List footer comments for a page, optionally including their child replies. Use this to review discussion threads on a page.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "pageId": {
              "type": "string",
              "title": "Page ID",
              "description": "The Confluence page ID."
            },
            "limit": {
              "type": "integer",
              "minimum": 1,
              "maximum": 250,
              "default": 50,
              "description": "Maximum number of comments to return."
            },
            "cursor": {
              "type": [
                "string",
                "null"
              ],
              "description": "Pagination cursor from a previous response."
            }
          },
          "required": [
            "pageId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const pageId = encodeURIComponent(String(input.pageId))\n  const params = new URLSearchParams()\n\n  params.set('body-format', 'STORAGE')\n\n  const limit = typeof input.limit === 'number' ? input.limit : undefined\n  if (limit) params.set('limit', String(limit))\n  if (input.cursor) params.set('cursor', String(input.cursor))\n\n  const res = await integration.fetch(`/wiki/api/v2/pages/${pageId}/footer-comments?${params}`)\n  const data = await res.json()\n\n  const results = Array.isArray(data?.results)\n    ? data.results.map((c) => ({\n        id: c.id,\n        status: c.status,\n        title: c.title,\n        pageId: c.pageId,\n        version: c?.version?.number,\n        authorId: c?.version?.authorId,\n        createdAt: c?.version?.createdAt,\n        body: c?.body,\n        webui: c?._links?.webui,\n      }))\n    : []\n\n  return {\n    results,\n    links: data?._links || {},\n  }\n}",
        "utils": [
          "html"
        ],
        "scope": "read"
      },
      {
        "name": "create_page",
        "description": "Create a new Confluence page. Provide the body as Confluence storage format (XHTML). For simple pages you can use basic HTML like `<h1>`, `<p>`, `<ul>`, `<li>`, `<code>`, and links.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "spaceId": {
              "type": "string",
              "title": "Space ID",
              "description": "The space ID where the page will be created."
            },
            "title": {
              "type": "string",
              "title": "Title",
              "description": "Page title."
            },
            "bodyStorage": {
              "type": "string",
              "title": "Body (storage XHTML)",
              "description": "Confluence storage format (XHTML) body value."
            },
            "parentId": {
              "type": [
                "string",
                "null"
              ],
              "description": "Optional parent page ID to create this page under."
            },
            "status": {
              "type": "string",
              "enum": [
                "current",
                "draft"
              ],
              "default": "current",
              "description": "Create as published (current) or as a draft."
            }
          },
          "required": [
            "spaceId",
            "title",
            "bodyStorage"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {\n    spaceId: String(input.spaceId),\n    status: input.status || 'current',\n    title: String(input.title),\n    body: {\n      representation: 'storage',\n      value: String(input.bodyStorage),\n    },\n  }\n\n  if (input.parentId)\n    body.parentId = String(input.parentId)\n\n  const res = await integration.fetch('/wiki/api/v2/pages', {\n    method: 'POST',\n    body,\n  })\n\n  return await res.json()\n}",
        "utils": [
          "html"
        ],
        "scope": "write"
      },
      {
        "name": "update_page",
        "description": "Update an existing Confluence page. This tool auto-fetches the current version number and increments it, so you don't need to manage versioning. Provide the body as Confluence storage format (XHTML).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "pageId": {
              "type": "string",
              "title": "Page ID",
              "description": "The Confluence page ID."
            },
            "title": {
              "type": [
                "string",
                "null"
              ],
              "description": "New page title. If omitted, the existing title is preserved."
            },
            "bodyStorage": {
              "type": "string",
              "title": "Body (storage XHTML)",
              "description": "Confluence storage format (XHTML) body value."
            },
            "versionMessage": {
              "type": [
                "string",
                "null"
              ],
              "description": "Optional version message for the update."
            },
            "minorEdit": {
              "type": "boolean",
              "default": false,
              "description": "If true, mark the update as a minor edit when supported."
            }
          },
          "required": [
            "pageId",
            "bodyStorage"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const pageId = encodeURIComponent(String(input.pageId))\n\n  // Fetch current page to get current version and preserve defaults.\n  const currentRes = await integration.fetch(`/wiki/api/v2/pages/${pageId}`)\n  const current = await currentRes.json()\n\n  const currentVersion = Number(current?.version?.number || 0)\n  if (!currentVersion)\n    throw new Error('Unable to determine current Confluence page version.')\n\n  const nextVersion = currentVersion + 1\n  const title = input.title ? String(input.title) : String(current?.title || '')\n  if (!title)\n    throw new Error('Missing page title (current page has no title and no new title was provided).')\n\n  const body = {\n    id: String(current?.id || input.pageId),\n    status: String(current?.status || 'current'),\n    title,\n    body: {\n      representation: 'storage',\n      value: String(input.bodyStorage),\n    },\n    version: {\n      number: nextVersion,\n      message: input.versionMessage ? String(input.versionMessage) : undefined,\n      minorEdit: Boolean(input.minorEdit),\n    },\n  }\n\n  // Remove undefined version message to keep payload clean.\n  if (body.version.message === undefined)\n    delete body.version.message\n\n  const res = await integration.fetch(`/wiki/api/v2/pages/${pageId}`, {\n    method: 'PUT',\n    body,\n  })\n  return await res.json()\n}",
        "utils": [
          "html"
        ],
        "scope": "write"
      },
      {
        "name": "delete_page",
        "description": "Delete a Confluence page (moves it to trash by default). Use carefully.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "pageId": {
              "type": "string",
              "title": "Page ID",
              "description": "The Confluence page ID."
            },
            "purge": {
              "type": "boolean",
              "default": false,
              "description": "If true, permanently purge the page (only works for trashed pages with admin permission)."
            },
            "draft": {
              "type": "boolean",
              "default": false,
              "description": "If true, delete a draft page."
            }
          },
          "required": [
            "pageId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const pageId = encodeURIComponent(String(input.pageId))\n  const params = new URLSearchParams()\n  if (input.purge) params.set('purge', 'true')\n  if (input.draft) params.set('draft', 'true')\n\n  const res = await integration.fetch(`/wiki/api/v2/pages/${pageId}${params.toString() ? `?${params}` : ''}`, {\n    method: 'DELETE',\n  })\n\n  if (res.status === 204)\n    return { ok: true }\n\n  // Some proxies/APIs may still return JSON; try to parse.\n  try { return await res.json() } catch { return { ok: res.ok, status: res.status } }\n}",
        "utils": [
          "html"
        ],
        "scope": "write"
      },
      {
        "name": "add_comment",
        "description": "Add a footer comment to a Confluence page. Provide the body as Confluence storage format (XHTML). Optionally set `parentCommentId` to create a threaded reply.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "pageId": {
              "type": "string",
              "title": "Page ID",
              "description": "The Confluence page ID to comment on."
            },
            "bodyStorage": {
              "type": "string",
              "title": "Comment body (storage XHTML)",
              "description": "Confluence storage format (XHTML) comment body."
            },
            "parentCommentId": {
              "type": [
                "string",
                "null"
              ],
              "description": "Optional parent footer comment ID to create a threaded reply."
            }
          },
          "required": [
            "pageId",
            "bodyStorage"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {\n    pageId: String(input.pageId),\n    body: {\n      representation: 'storage',\n      value: String(input.bodyStorage),\n    },\n  }\n\n  if (input.parentCommentId)\n    body.parentCommentId = String(input.parentCommentId)\n\n  const res = await integration.fetch('/wiki/api/v2/footer-comments', {\n    method: 'POST',\n    body,\n  })\n  return await res.json()\n}",
        "utils": [
          "html"
        ],
        "scope": "write"
      },
      {
        "name": "add_label",
        "description": "Add one or more labels to a Confluence page. Labels are useful for discovery via CQL (`label = \"...\"`).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "pageId": {
              "type": "string",
              "title": "Page ID",
              "description": "The Confluence page ID."
            },
            "labels": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "string"
              },
              "description": "Labels to add (without the `global:` prefix). Example: `design-doc`, `runbook`."
            }
          },
          "required": [
            "pageId",
            "labels"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const pageId = encodeURIComponent(String(input.pageId))\n  const labels = Array.isArray(input.labels) ? input.labels : []\n\n  const body = labels\n    .map((name) => String(name).trim())\n    .filter(Boolean)\n    .map((name) => ({ prefix: 'global', name }))\n\n  const res = await integration.fetch(`/wiki/rest/api/content/${pageId}/label`, {\n    method: 'POST',\n    body,\n  })\n  return await res.json()\n}",
        "utils": [
          "html"
        ],
        "scope": "write"
      }
    ]
  },
  "github": {
    "manifest": {
      "name": "github",
      "version": "0.3.0",
      "baseUrl": "https://api.github.com",
      "toolsets": {
        "code": {
          "label": "Code & Files",
          "description": "Read, search, and manage repository code and branches"
        },
        "issues": {
          "label": "Issues",
          "description": "Create, search, and manage GitHub issues"
        },
        "pull_requests": {
          "label": "Pull Requests",
          "description": "Create, review, and merge pull requests"
        },
        "ci": {
          "label": "CI / Actions",
          "description": "Monitor GitHub Actions workflows and debug failures"
        },
        "releases": {
          "label": "Releases & Tags",
          "description": "Manage releases and view tags"
        },
        "repo_admin": {
          "label": "Repository Management",
          "description": "Create, delete, fork, and discover repositories"
        }
      },
      "tools": [
        {
          "name": "get_me",
          "description": "Get the authenticated user's profile. Use this to find out who you are authenticated as before performing operations.",
          "inputSchema": "schemas/empty.json",
          "handler": "handlers/get_me.js",
          "scope": "read",
          "toolset": "repo_admin"
        },
        {
          "name": "list_repos",
          "description": "List repositories for the authenticated user. Use get_repo for full metadata.",
          "inputSchema": "schemas/empty.json",
          "handler": "handlers/list_repos_user.js",
          "scope": "read",
          "toolset": "repo_admin"
        },
        {
          "name": "get_repo",
          "description": "Get details for a repository (description, default branch, visibility, topics, stats).",
          "inputSchema": "schemas/get_repo.json",
          "handler": "handlers/get_repo.js",
          "scope": "read",
          "toolset": "code"
        },
        {
          "name": "search_repos",
          "description": "Search GitHub repositories. Supports stars, forks, language, topic, and user filters (e.g. 'topic:react stars:>1000 language:javascript'). Use this to discover repos.",
          "inputSchema": "schemas/search_repos.json",
          "handler": "handlers/search_repos.js",
          "scope": "read",
          "toolset": "repo_admin"
        },
        {
          "name": "get_file_contents",
          "description": "Get the content of a file from a repository. Returns decoded UTF-8 text. Use ref to read from a specific branch, tag, or commit. Call get_repo_tree first to discover file paths.",
          "inputSchema": "schemas/get_file_contents.json",
          "handler": "handlers/get_file_contents.js",
          "scope": "read",
          "toolset": "code"
        },
        {
          "name": "get_repo_tree",
          "description": "Get the full file/directory tree of a repository. Returns all paths and types. Use path_filter to scope to a subdirectory (e.g. 'src/'). Use this before get_file_contents to discover what files exist.",
          "inputSchema": "schemas/get_repo_tree.json",
          "handler": "handlers/get_repo_tree.js",
          "scope": "read",
          "toolset": "code"
        },
        {
          "name": "search_code",
          "description": "Search for code across GitHub repositories using GitHub's code search syntax. Examples: 'useState language:typescript repo:facebook/react', 'console.error path:src/'. Returns file paths and matched fragments.",
          "inputSchema": "schemas/search_code.json",
          "handler": "handlers/search_code.js",
          "scope": "read",
          "toolset": "code"
        },
        {
          "name": "list_branches",
          "description": "List branches in a repository. Supports pagination and filtering by protection status.",
          "inputSchema": "schemas/list_branches.json",
          "handler": "handlers/list_branches.js",
          "scope": "read",
          "toolset": "code"
        },
        {
          "name": "list_commits",
          "description": "List commits for a repository. Filter by branch/tag (sha), file path, or author. Paginate with page/per_page.",
          "inputSchema": "schemas/list_commits.json",
          "handler": "handlers/list_commits.js",
          "scope": "read",
          "toolset": "code"
        },
        {
          "name": "get_commit",
          "description": "Get the full details of a specific commit including its message, author, file changes, and diff stats.",
          "inputSchema": "schemas/get_commit.json",
          "handler": "handlers/get_commit.js",
          "scope": "read",
          "toolset": "code"
        },
        {
          "name": "list_tags",
          "description": "List tags for a repository. Use this to see available versions before creating a release.",
          "inputSchema": "schemas/list_tags.json",
          "handler": "handlers/list_tags.js",
          "scope": "read",
          "toolset": "code"
        },
        {
          "name": "list_issues",
          "description": "List issues for a repository. Filter by state (open/closed/all), labels (comma-separated), and assignee. Paginate with page/per_page. Note: this also returns pull requests; use search_issues to exclude them.",
          "inputSchema": "schemas/list_issues.json",
          "handler": "handlers/list_issues.js",
          "scope": "read",
          "toolset": "issues"
        },
        {
          "name": "get_issue",
          "description": "Get full details of a specific issue including its body, labels, assignees, and milestone.",
          "inputSchema": "schemas/get_issue.json",
          "handler": "handlers/get_issue.js",
          "scope": "read",
          "toolset": "issues"
        },
        {
          "name": "list_issue_comments",
          "description": "List all comments on an issue. Use this to read the full discussion thread before replying.",
          "inputSchema": "schemas/list_issue_comments.json",
          "handler": "handlers/list_issue_comments.js",
          "scope": "read",
          "toolset": "issues"
        },
        {
          "name": "search_issues",
          "description": "Search issues using GitHub search syntax (e.g. 'is:open is:issue label:bug repo:owner/repo', 'is:issue no:assignee milestone:v2.0'). More powerful than list_issues for finding specific issues.",
          "inputSchema": "schemas/search_issues.json",
          "handler": "handlers/search_issues.js",
          "scope": "read",
          "toolset": "issues"
        },
        {
          "name": "list_labels",
          "description": "List all labels available in a repository. Call this before add_labels_to_issue to see which labels exist.",
          "inputSchema": "schemas/list_labels.json",
          "handler": "handlers/list_labels.js",
          "scope": "read",
          "toolset": "issues"
        },
        {
          "name": "list_pull_requests",
          "description": "List pull requests for a repository. Filter by state, head branch, base branch. Sort and paginate results.",
          "inputSchema": "schemas/list_pull_requests.json",
          "handler": "handlers/list_pull_requests.js",
          "scope": "read",
          "toolset": "pull_requests"
        },
        {
          "name": "get_pull_request",
          "description": "Get full details of a specific pull request including title, body, state, merge status, head/base refs, reviewers, and labels.",
          "inputSchema": "schemas/get_pull_request.json",
          "handler": "handlers/get_pull_request.js",
          "scope": "read",
          "toolset": "pull_requests"
        },
        {
          "name": "get_pull_request_diff",
          "description": "Get the raw unified diff for a pull request. Returns the complete diff of all changes. For per-file details, use list_pull_request_files instead.",
          "inputSchema": "schemas/get_pull_request_diff.json",
          "handler": "handlers/get_pull_request_diff.js",
          "scope": "read",
          "toolset": "pull_requests"
        },
        {
          "name": "list_pull_request_files",
          "description": "List the files changed in a pull request with their status (added/modified/deleted) and patch diff per file. Essential for code review.",
          "inputSchema": "schemas/list_pull_request_files.json",
          "handler": "handlers/list_pull_request_files.js",
          "scope": "read",
          "toolset": "pull_requests"
        },
        {
          "name": "list_pull_request_comments",
          "description": "List inline review comments on a pull request (comments attached to specific lines of code).",
          "inputSchema": "schemas/list_pull_request_comments.json",
          "handler": "handlers/list_pull_request_comments.js",
          "scope": "read",
          "toolset": "pull_requests"
        },
        {
          "name": "search_pull_requests",
          "description": "Search pull requests using GitHub search syntax. Use 'is:pr' to scope to PRs (e.g. 'is:pr is:open author:octocat', 'is:pr review:required label:bug'). Returns matching PRs across repos.",
          "inputSchema": "schemas/search_pull_requests.json",
          "handler": "handlers/search_pull_requests.js",
          "scope": "read",
          "toolset": "pull_requests"
        },
        {
          "name": "list_releases",
          "description": "List all releases for a repository, newest first.",
          "inputSchema": "schemas/list_releases.json",
          "handler": "handlers/list_releases.js",
          "scope": "read",
          "toolset": "releases"
        },
        {
          "name": "get_latest_release",
          "description": "Get the latest published release for a repository. Use this to quickly check the current version.",
          "inputSchema": "schemas/owner_repo.json",
          "handler": "handlers/get_latest_release.js",
          "scope": "read",
          "toolset": "releases"
        },
        {
          "name": "list_workflow_runs",
          "description": "List GitHub Actions workflow runs for a repository. Filter by branch, status (e.g. 'failure', 'success'), or triggering event. Use this to check CI status.",
          "inputSchema": "schemas/list_workflow_runs.json",
          "handler": "handlers/list_workflow_runs.js",
          "scope": "read",
          "toolset": "ci"
        },
        {
          "name": "get_workflow_run",
          "description": "Get details of a specific GitHub Actions workflow run including its status, conclusion, timing, and associated commit.",
          "inputSchema": "schemas/get_workflow_run.json",
          "handler": "handlers/get_workflow_run.js",
          "scope": "read",
          "toolset": "ci"
        },
        {
          "name": "get_job_logs",
          "description": "Get the log output for a specific GitHub Actions workflow job. Use this to diagnose CI failures. Get job_id from the GitHub Actions UI or the jobs list of a workflow run.",
          "inputSchema": "schemas/get_job_logs.json",
          "handler": "handlers/get_job_logs.js",
          "scope": "read",
          "toolset": "ci"
        },
        {
          "name": "create_repo",
          "description": "Create a new GitHub repository under the authenticated user's account.",
          "inputSchema": "schemas/create_repo.json",
          "handler": "handlers/create_repo.js",
          "scope": "write",
          "credentialVariants": [
            "classic_pat"
          ],
          "toolset": "repo_admin"
        },
        {
          "name": "delete_repo",
          "description": "Permanently delete a repository. This is irreversible. Requires the delete_repo scope on classic PATs.",
          "inputSchema": "schemas/delete_repo.json",
          "handler": "handlers/delete_repo.js",
          "scope": "write",
          "credentialVariants": [
            "classic_pat"
          ],
          "toolset": "repo_admin"
        },
        {
          "name": "fork_repo",
          "description": "Fork a repository into your account or an organization. The fork is created asynchronously; the response returns immediately with the new repo details.",
          "inputSchema": "schemas/fork_repo.json",
          "handler": "handlers/fork_repo.js",
          "scope": "write",
          "toolset": "repo_admin"
        },
        {
          "name": "create_branch",
          "description": "Create a new branch in a repository, branching from the repo's default branch by default.",
          "inputSchema": "schemas/create_branch.json",
          "handler": "handlers/create_branch.js",
          "scope": "write",
          "toolset": "code"
        },
        {
          "name": "delete_branch",
          "description": "Delete a branch. Typically used after a pull request is merged. Use list_branches to find the branch name first.",
          "inputSchema": "schemas/delete_branch.json",
          "handler": "handlers/delete_branch.js",
          "scope": "write",
          "toolset": "code"
        },
        {
          "name": "edit_file",
          "description": "Edit a file using search/replace. Fetches the file, applies edits, and commits the result. Each old_text must match the file content exactly, including whitespace and indentation. Use get_file_contents to verify content before editing. For multi-file atomic changes, use edit_files instead.",
          "inputSchema": "schemas/edit_file.json",
          "handler": "handlers/edit_file.js",
          "scope": "write",
          "toolset": "code"
        },
        {
          "name": "edit_files",
          "description": "Create, edit, and delete multiple files in a single atomic commit. Use action 'create' with content for new files, 'edit' with old_text/new_text search/replace pairs for existing files, 'delete' to remove files. All changes are committed together. For single-file edits, use edit_file instead.",
          "inputSchema": "schemas/edit_files.json",
          "handler": "handlers/edit_files.js",
          "scope": "write",
          "toolset": "code"
        },
        {
          "name": "create_file",
          "description": "Create a new file or overwrite an existing file's content in a single commit. Handles SHA resolution internally -- no need to fetch the file first. For partial edits to existing files, use edit_file instead.",
          "inputSchema": "schemas/create_file.json",
          "handler": "handlers/create_file.js",
          "scope": "write",
          "toolset": "code"
        },
        {
          "name": "delete_file",
          "description": "Delete a file from a repository. The file's SHA is fetched automatically. Creates a commit with the deletion.",
          "inputSchema": "schemas/delete_file.json",
          "handler": "handlers/delete_file.js",
          "scope": "write",
          "toolset": "code"
        },
        {
          "name": "create_pull_request",
          "description": "Open a new pull request from a head branch into a base branch.",
          "inputSchema": "schemas/create_pull_request.json",
          "handler": "handlers/create_pull_request.js",
          "scope": "write",
          "toolset": "pull_requests"
        },
        {
          "name": "update_pull_request",
          "description": "Edit a pull request's title, body, state (open/closed), base branch, or draft status.",
          "inputSchema": "schemas/update_pull_request.json",
          "handler": "handlers/update_pull_request.js",
          "scope": "write",
          "toolset": "pull_requests"
        },
        {
          "name": "merge_pull_request",
          "description": "Merge a pull request. Supports merge, squash, and rebase merge methods.",
          "inputSchema": "schemas/merge_pull_request.json",
          "handler": "handlers/merge_pull_request.js",
          "scope": "write",
          "toolset": "pull_requests"
        },
        {
          "name": "request_pull_request_reviewers",
          "description": "Request specific users or teams to review a pull request.",
          "inputSchema": "schemas/request_pull_request_reviewers.json",
          "handler": "handlers/request_pull_request_reviewers.js",
          "scope": "write",
          "toolset": "pull_requests"
        },
        {
          "name": "create_pull_request_review",
          "description": "Submit a pull request review. Use event=APPROVE to approve, REQUEST_CHANGES to request changes, or COMMENT to leave a comment-only review.",
          "inputSchema": "schemas/create_pull_request_review.json",
          "handler": "handlers/create_pull_request_review.js",
          "scope": "write",
          "toolset": "pull_requests"
        },
        {
          "name": "create_issue",
          "description": "Create a new issue in a repository. Optionally assign users and add labels.",
          "inputSchema": "schemas/create_issue.json",
          "handler": "handlers/create_issue.js",
          "scope": "write",
          "toolset": "issues"
        },
        {
          "name": "update_issue",
          "description": "Update fields on an existing issue (title, body, state, assignees, labels, milestone).",
          "inputSchema": "schemas/update_issue.json",
          "handler": "handlers/update_issue.js",
          "scope": "write",
          "toolset": "issues"
        },
        {
          "name": "close_issue",
          "description": "Close an issue.",
          "inputSchema": "schemas/close_issue.json",
          "handler": "handlers/close_issue.js",
          "scope": "write",
          "toolset": "issues"
        },
        {
          "name": "comment_on_issue",
          "description": "Add a comment to an issue or pull request (GitHub PRs share the issue comment thread). Use list_issue_comments to read existing comments first.",
          "inputSchema": "schemas/comment_on_issue.json",
          "handler": "handlers/comment_on_issue.js",
          "scope": "write",
          "toolset": "issues"
        },
        {
          "name": "add_labels_to_issue",
          "description": "Add labels to an issue or pull request. Use list_labels to discover available labels before calling this.",
          "inputSchema": "schemas/add_labels_to_issue.json",
          "handler": "handlers/add_labels_to_issue.js",
          "scope": "write",
          "toolset": "issues"
        },
        {
          "name": "create_release",
          "description": "Create a new release from a tag. Can auto-generate release notes from commits. Set draft=true to save without publishing, prerelease=true for alpha/beta/rc versions.",
          "inputSchema": "schemas/create_release.json",
          "handler": "handlers/create_release.js",
          "scope": "write",
          "toolset": "releases"
        }
      ]
    },
    "prompt": "# GitHub coding workflow\n\n## Branch-based workflow\n\nAlways work on a feature branch, never commit directly to main:\n\n1. `create_branch` from the default branch\n2. Make changes with `edit_file`, `edit_files`, `create_file`, or `delete_file` -- each call auto-commits to the branch\n3. `create_pull_request` when done\n4. `merge_pull_request` with `merge_method: \"squash\"` to collapse all commits into one clean commit on main\n\nMultiple small commits on a feature branch are fine -- they get squash-merged into a single commit.\n\n## Choosing the right write tool\n\n- **`edit_file`** -- Surgical edits to a single existing file. Use for most code changes. Each call is a commit.\n- **`edit_files`** -- Atomic multi-file changes (create + edit + delete in one commit). Use when files must change together to stay consistent (e.g. renaming across files, adding a module + updating imports).\n- **`create_file`** -- Create a new file or completely replace an existing file's content. Use for new files or full rewrites.\n- **`delete_file`** -- Remove a file.\n\n## Search/replace rules for edit_file and edit_files\n\nThe `old_text` field must be an **exact match** of the text currently in the file:\n\n- Whitespace matters: spaces, tabs, and indentation must match exactly\n- Line breaks matter: include the exact newline characters\n- Include enough surrounding context to uniquely identify the location\n- Each edit replaces the **first occurrence** only. To replace multiple occurrences, use separate edits.\n\n**Before editing**, call `get_file_contents` to see the file's current content. This avoids failed edits from stale or incorrect assumptions about file content.\n\n## Reading before writing\n\n- Use `get_repo_tree` to discover the project structure and file paths\n- Use `get_file_contents` to read a file before editing it\n- Use `search_code` to find where something is defined or used across the repo\n",
    "variants": {
      "variants": {
        "classic_pat": {
          "label": "Classic Personal Access Token",
          "schema": {
            "type": "object",
            "properties": {
              "token": {
                "type": "string",
                "title": "Classic PAT",
                "description": "GitHub classic personal access token. Supports all GitHub API operations including creating and deleting repositories."
              }
            },
            "required": [
              "token"
            ],
            "additionalProperties": false
          },
          "injection": {
            "headers": {
              "Authorization": "Bearer {{token}}"
            }
          },
          "healthCheck": {
            "path": "/user"
          }
        },
        "fine_grained_pat": {
          "label": "Fine-Grained Personal Access Token",
          "schema": {
            "type": "object",
            "properties": {
              "token": {
                "type": "string",
                "title": "Fine-Grained PAT",
                "description": "GitHub fine-grained personal access token scoped to specific repositories and permissions."
              }
            },
            "required": [
              "token"
            ],
            "additionalProperties": false
          },
          "injection": {
            "headers": {
              "Authorization": "Bearer {{token}}"
            }
          },
          "healthCheck": {
            "path": "/user"
          }
        }
      },
      "default": "classic_pat"
    },
    "hint": "Create a GitHub personal access token and paste it here.\n\n- Fine-grained PAT: Settings → Developer settings → Personal access tokens → Fine-grained tokens\n- Classic PAT: Settings → Developer settings → Personal access tokens → Tokens (classic)\n\nMinimum scopes depend on the tools you use (repo read/write, issues, pull requests, etc.).",
    "hintsByVariant": {
      "classic_pat": "Create a GitHub Classic Personal Access Token:\n\n1. Go to `https://github.com/settings/tokens` → **Tokens (classic)**\n2. Click **Generate new token (classic)**\n3. Select the scopes you need: `repo` (full repo access), `delete_repo` (if you want to delete repos), `read:user` etc.\n4. Copy the token and paste it here.\n\nClassic PATs support all GitHub API operations including creating and deleting repositories.",
      "fine_grained_pat": "Create a GitHub Fine-Grained Personal Access Token:\n\n1. Go to `https://github.com/settings/tokens` → **Fine-grained tokens**\n2. Click **Generate new token**\n3. Set the resource owner and repository access (specific repos or all repos)\n4. Grant the permissions your use case requires (Contents, Issues, Pull Requests, etc.)\n5. Copy the token and paste it here.\n\nNote: Fine-grained PATs do not support user-level operations like creating or deleting repositories. Those tools will not be available with this token type."
    },
    "tools": [
      {
        "name": "get_me",
        "description": "Get the authenticated user's profile. Use this to find out who you are authenticated as before performing operations.",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch('/user')\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "repo_admin"
      },
      {
        "name": "list_repos",
        "description": "List repositories for the authenticated user. Use get_repo for full metadata.",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "handlerCode": "async () => {\n  const res = await integration.fetch('/user/repos')\n  const data = await res.json()\n  if (!Array.isArray(data)) return data\n  return data.map((r) => ({\n    full_name: r.full_name,\n    name: r.name,\n    owner: { login: r.owner?.login },\n    private: r.private,\n    default_branch: r.default_branch,\n    description: r.description ?? null,\n    html_url: r.html_url,\n    archived: r.archived,\n    fork: r.fork,\n  }))\n}",
        "scope": "read",
        "toolset": "repo_admin"
      },
      {
        "name": "get_repo",
        "description": "Get details for a repository (description, default branch, visibility, topics, stats).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string"
            },
            "repo": {
              "type": "string"
            }
          },
          "required": [
            "owner",
            "repo"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "code"
      },
      {
        "name": "search_repos",
        "description": "Search GitHub repositories. Supports stars, forks, language, topic, and user filters (e.g. 'topic:react stars:>1000 language:javascript'). Use this to discover repos.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "GitHub repository search query. Examples: 'machine learning language:python stars:>1000', 'topic:react', 'user:facebook is:public'. Supports stars, forks, language, topic, and many other qualifiers."
            },
            "sort": {
              "type": "string",
              "enum": [
                "stars",
                "forks",
                "help-wanted-issues",
                "updated"
              ],
              "description": "Sort repos by this field"
            },
            "order": {
              "type": "string",
              "enum": [
                "asc",
                "desc"
              ],
              "default": "desc"
            },
            "page": {
              "type": "integer",
              "default": 1
            },
            "per_page": {
              "type": "integer",
              "default": 30,
              "maximum": 100
            }
          },
          "required": [
            "query"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  params.set('q', input.query)\n  if (input.sort) params.set('sort', input.sort)\n  if (input.order) params.set('order', input.order)\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const res = await integration.fetch(`/search/repositories?${params.toString()}`)\n  const data = await res.json()\n  const items = Array.isArray(data?.items)\n    ? data.items.map(item => ({\n      id: item.id,\n      fullName: item.full_name,\n      owner: item.owner?.login ?? null,\n      name: item.name ?? null,\n      private: !!item.private,\n      description: item.description ?? null,\n      language: item.language ?? null,\n      stargazersCount: item.stargazers_count ?? 0,\n      forksCount: item.forks_count ?? 0,\n      openIssuesCount: item.open_issues_count ?? 0,\n      defaultBranch: item.default_branch ?? null,\n      updatedAt: item.updated_at ?? null,\n      htmlUrl: item.html_url ?? null,\n    }))\n    : []\n  return {\n    totalCount: typeof data?.total_count === 'number' ? data.total_count : items.length,\n    incompleteResults: !!data?.incomplete_results,\n    count: items.length,\n    note: 'Use owner + repo (from fullName) with get_repo for full repository details.',\n    repositories: items,\n  }\n}",
        "scope": "read",
        "toolset": "repo_admin"
      },
      {
        "name": "get_file_contents",
        "description": "Get the content of a file from a repository. Returns decoded UTF-8 text. Use ref to read from a specific branch, tag, or commit. Call get_repo_tree first to discover file paths.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner (user or org)"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "path": {
              "type": "string",
              "description": "File path within the repository (e.g. 'src/index.js')"
            },
            "ref": {
              "type": "string",
              "description": "Branch name, tag, or commit SHA (defaults to the repo's default branch)"
            }
          },
          "required": [
            "owner",
            "repo",
            "path"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.ref) params.set('ref', input.ref)\n  const query = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/contents/${input.path}${query}`)\n  const data = await res.json()\n  if (data && data.content && data.encoding === 'base64') {\n    try {\n      const b64 = data.content.replace(/\\n/g, '')\n      // Decode base64 → binary string → percent-encode each byte → UTF-8 decode\n      data.content = decodeURIComponent(\n        atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')\n      )\n      data.encoding = 'utf-8'\n    }\n    catch (e) {\n      // Binary file — leave content as base64\n    }\n  }\n  return data\n}",
        "scope": "read",
        "toolset": "code"
      },
      {
        "name": "get_repo_tree",
        "description": "Get the full file/directory tree of a repository. Returns all paths and types. Use path_filter to scope to a subdirectory (e.g. 'src/'). Use this before get_file_contents to discover what files exist.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner (user or org)"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "ref": {
              "type": "string",
              "description": "Branch name, tag, or commit SHA (defaults to HEAD)"
            },
            "recursive": {
              "type": "boolean",
              "description": "Return the full recursive tree (all nested files). Default true.",
              "default": true
            },
            "path_filter": {
              "type": "string",
              "description": "Optional path prefix to filter results (e.g. 'src/')"
            }
          },
          "required": [
            "owner",
            "repo"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const ref = input.ref || 'HEAD'\n  const params = new URLSearchParams()\n  if (input.recursive !== false) params.set('recursive', '1')\n  const query = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/git/trees/${ref}${query}`)\n  const data = await res.json()\n  let tree = Array.isArray(data?.tree) ? data.tree : []\n  if (input.path_filter)\n    tree = tree.filter(item => item.path && item.path.startsWith(input.path_filter))\n\n  const limit = 500\n  const sliced = tree.slice(0, limit).map(item => ({\n    path: item.path ?? null,\n    type: item.type ?? null,\n    mode: item.mode ?? null,\n    sha: item.sha ?? null,\n    size: item.size ?? null,\n    url: item.url ?? null,\n  }))\n\n  return {\n    sha: data?.sha ?? null,\n    truncatedByGitHub: !!data?.truncated,\n    count: tree.length,\n    returnedCount: sliced.length,\n    hasMore: tree.length > sliced.length,\n    note: 'Use path + ref with get_file_contents for file content. Results are capped to 500 entries.',\n    tree: sliced,\n  }\n}",
        "scope": "read",
        "toolset": "code"
      },
      {
        "name": "search_code",
        "description": "Search for code across GitHub repositories using GitHub's code search syntax. Examples: 'useState language:typescript repo:facebook/react', 'console.error path:src/'. Returns file paths and matched fragments.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "GitHub code search query. Examples: 'useState repo:facebook/react language:typescript', 'console.log path:src/ language:javascript org:my-org'. Supports language, path, repo, org, and extension filters."
            },
            "page": {
              "type": "integer",
              "default": 1
            },
            "per_page": {
              "type": "integer",
              "default": 30,
              "maximum": 100
            }
          },
          "required": [
            "query"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  params.set('q', input.query)\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const res = await integration.fetch(`/search/code?${params.toString()}`)\n  const data = await res.json()\n  const items = Array.isArray(data?.items)\n    ? data.items.map(item => ({\n      sha: item.sha ?? null,\n      name: item.name ?? null,\n      path: item.path ?? null,\n      repositoryFullName: item.repository?.full_name ?? null,\n      url: item.html_url ?? null,\n    }))\n    : []\n  return {\n    totalCount: typeof data?.total_count === 'number' ? data.total_count : items.length,\n    incompleteResults: !!data?.incomplete_results,\n    count: items.length,\n    note: 'Use owner/repo + path (and optional ref) with get_file_contents for full file content.',\n    matches: items,\n  }\n}",
        "scope": "read",
        "toolset": "code"
      },
      {
        "name": "list_branches",
        "description": "List branches in a repository. Supports pagination and filtering by protection status.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "protected": {
              "type": "boolean",
              "description": "Filter to only protected branches"
            },
            "page": {
              "type": "integer",
              "default": 1
            },
            "per_page": {
              "type": "integer",
              "default": 30,
              "maximum": 100
            }
          },
          "required": [
            "owner",
            "repo"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.protected !== undefined) params.set('protected', String(input.protected))\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const query = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/branches${query}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "code"
      },
      {
        "name": "list_commits",
        "description": "List commits for a repository. Filter by branch/tag (sha), file path, or author. Paginate with page/per_page.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string"
            },
            "repo": {
              "type": "string"
            },
            "sha": {
              "type": "string",
              "description": "Branch name, tag, or commit SHA to start listing from (defaults to default branch)"
            },
            "path": {
              "type": "string",
              "description": "Filter commits that touch this file path"
            },
            "author": {
              "type": "string",
              "description": "Filter by GitHub username or email address"
            },
            "page": {
              "type": "integer",
              "default": 1
            },
            "per_page": {
              "type": "integer",
              "default": 30,
              "maximum": 100
            }
          },
          "required": [
            "owner",
            "repo"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.sha) params.set('sha', input.sha)\n  if (typeof input.path === 'string' && input.path.length > 0) params.set('path', input.path)\n  if (input.author) params.set('author', input.author)\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const query = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/commits${query}`)\n  const data = await res.json()\n  const commits = Array.isArray(data)\n    ? data.map(commit => ({\n      sha: commit.sha,\n      message: commit.commit?.message?.split('\\n')[0] ?? null,\n      authorName: commit.commit?.author?.name ?? null,\n      authorDate: commit.commit?.author?.date ?? null,\n      committerName: commit.commit?.committer?.name ?? null,\n      committerDate: commit.commit?.committer?.date ?? null,\n      htmlUrl: commit.html_url ?? null,\n    }))\n    : []\n  return {\n    count: commits.length,\n    note: 'Use sha with get_commit for full commit details.',\n    commits,\n  }\n}",
        "scope": "read",
        "toolset": "code"
      },
      {
        "name": "get_commit",
        "description": "Get the full details of a specific commit including its message, author, file changes, and diff stats.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "sha": {
              "type": "string",
              "description": "Commit SHA, branch name, or tag name"
            },
            "page": {
              "type": "integer",
              "default": 1,
              "description": "Page for paginating large diffs (when a commit touches many files)"
            },
            "per_page": {
              "type": "integer",
              "default": 30,
              "maximum": 100
            }
          },
          "required": [
            "owner",
            "repo",
            "sha"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const query = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/commits/${input.sha}${query}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "code"
      },
      {
        "name": "list_tags",
        "description": "List tags for a repository. Use this to see available versions before creating a release.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "page": {
              "type": "integer",
              "default": 1
            },
            "per_page": {
              "type": "integer",
              "default": 30,
              "maximum": 100
            }
          },
          "required": [
            "owner",
            "repo"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const query = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/tags${query}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "code"
      },
      {
        "name": "list_issues",
        "description": "List issues for a repository. Filter by state (open/closed/all), labels (comma-separated), and assignee. Paginate with page/per_page. Note: this also returns pull requests; use search_issues to exclude them.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string"
            },
            "repo": {
              "type": "string"
            },
            "state": {
              "type": "string",
              "enum": [
                "open",
                "closed",
                "all"
              ],
              "default": "open"
            },
            "labels": {
              "type": "string",
              "description": "Comma-separated list of label names to filter by"
            },
            "assignee": {
              "type": "string",
              "description": "Filter by assignee username, or 'none' for unassigned, '*' for any"
            },
            "page": {
              "type": "integer",
              "default": 1
            },
            "per_page": {
              "type": "integer",
              "default": 30,
              "maximum": 100
            }
          },
          "required": [
            "owner",
            "repo"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.state) params.set('state', input.state)\n  if (input.labels) params.set('labels', input.labels)\n  if (input.assignee) params.set('assignee', input.assignee)\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const query = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues${query}`)\n  const data = await res.json()\n  const issues = Array.isArray(data)\n    ? data.map(issue => ({\n      id: issue.id,\n      number: issue.number,\n      title: issue.title ?? null,\n      state: issue.state ?? null,\n      user: issue.user?.login ?? null,\n      assignee: issue.assignee?.login ?? null,\n      labels: Array.isArray(issue.labels) ? issue.labels.map(l => typeof l === 'string' ? l : l?.name).filter(Boolean) : [],\n      comments: issue.comments ?? 0,\n      createdAt: issue.created_at ?? null,\n      updatedAt: issue.updated_at ?? null,\n      htmlUrl: issue.html_url ?? null,\n      isPullRequest: !!issue.pull_request,\n    }))\n    : []\n  return {\n    count: issues.length,\n    note: 'Use issue number with get_issue for full issue details.',\n    issues,\n  }\n}",
        "scope": "read",
        "toolset": "issues"
      },
      {
        "name": "get_issue",
        "description": "Get full details of a specific issue including its body, labels, assignees, and milestone.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string"
            },
            "repo": {
              "type": "string"
            },
            "issue_number": {
              "type": "integer",
              "minimum": 1
            }
          },
          "required": [
            "owner",
            "repo",
            "issue_number"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues/${input.issue_number}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "issues"
      },
      {
        "name": "list_issue_comments",
        "description": "List all comments on an issue. Use this to read the full discussion thread before replying.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "issue_number": {
              "type": "integer",
              "description": "Issue number"
            },
            "page": {
              "type": "integer",
              "default": 1
            },
            "per_page": {
              "type": "integer",
              "default": 30,
              "maximum": 100
            }
          },
          "required": [
            "owner",
            "repo",
            "issue_number"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const query = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues/${input.issue_number}/comments${query}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "issues"
      },
      {
        "name": "search_issues",
        "description": "Search issues using GitHub search syntax (e.g. 'is:open is:issue label:bug repo:owner/repo', 'is:issue no:assignee milestone:v2.0'). More powerful than list_issues for finding specific issues.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "GitHub issue search query (e.g. 'is:open is:issue label:bug repo:owner/repo', 'is:open assignee:@me', 'is:issue no:assignee'). Supports all GitHub search qualifiers."
            },
            "page": {
              "type": "integer",
              "default": 1
            },
            "per_page": {
              "type": "integer",
              "default": 30,
              "maximum": 100
            }
          },
          "required": [
            "query"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  params.set('q', input.query)\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const res = await integration.fetch(`/search/issues?${params.toString()}`)\n  const data = await res.json()\n  const items = Array.isArray(data?.items)\n    ? data.items.map(issue => ({\n      id: issue.id,\n      number: issue.number,\n      repositoryFullName: issue.repository_url ? issue.repository_url.replace('https://api.github.com/repos/', '') : null,\n      title: issue.title ?? null,\n      state: issue.state ?? null,\n      user: issue.user?.login ?? null,\n      labels: Array.isArray(issue.labels) ? issue.labels.map(l => typeof l === 'string' ? l : l?.name).filter(Boolean) : [],\n      comments: issue.comments ?? 0,\n      createdAt: issue.created_at ?? null,\n      updatedAt: issue.updated_at ?? null,\n      htmlUrl: issue.html_url ?? null,\n      isPullRequest: !!issue.pull_request,\n    }))\n    : []\n  return {\n    totalCount: typeof data?.total_count === 'number' ? data.total_count : items.length,\n    incompleteResults: !!data?.incomplete_results,\n    count: items.length,\n    note: 'Use owner/repo + issue number with get_issue for full details.',\n    issues: items,\n  }\n}",
        "scope": "read",
        "toolset": "issues"
      },
      {
        "name": "list_labels",
        "description": "List all labels available in a repository. Call this before add_labels_to_issue to see which labels exist.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "page": {
              "type": "integer",
              "default": 1
            },
            "per_page": {
              "type": "integer",
              "default": 100,
              "maximum": 100
            }
          },
          "required": [
            "owner",
            "repo"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const query = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/labels${query}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "issues"
      },
      {
        "name": "list_pull_requests",
        "description": "List pull requests for a repository. Filter by state, head branch, base branch. Sort and paginate results.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string"
            },
            "repo": {
              "type": "string"
            },
            "state": {
              "type": "string",
              "enum": [
                "open",
                "closed",
                "all"
              ],
              "default": "open"
            },
            "head": {
              "type": "string",
              "description": "Filter by head user/org and branch (e.g. 'user:my-branch')"
            },
            "base": {
              "type": "string",
              "description": "Filter by base branch name (e.g. 'main')"
            },
            "sort": {
              "type": "string",
              "enum": [
                "created",
                "updated",
                "popularity",
                "long-running"
              ],
              "default": "created"
            },
            "direction": {
              "type": "string",
              "enum": [
                "asc",
                "desc"
              ],
              "default": "desc"
            },
            "page": {
              "type": "integer",
              "default": 1
            },
            "per_page": {
              "type": "integer",
              "default": 30,
              "maximum": 100
            }
          },
          "required": [
            "owner",
            "repo"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.state) params.set('state', input.state)\n  if (input.head) params.set('head', input.head)\n  if (input.base) params.set('base', input.base)\n  if (input.sort) params.set('sort', input.sort)\n  if (input.direction) params.set('direction', input.direction)\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const query = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/pulls${query}`)\n  const data = await res.json()\n  const pullRequests = Array.isArray(data)\n    ? data.map(pr => ({\n      id: pr.id,\n      number: pr.number,\n      title: pr.title ?? null,\n      state: pr.state ?? null,\n      draft: !!pr.draft,\n      author: pr.user?.login ?? null,\n      baseRef: pr.base?.ref ?? null,\n      headRef: pr.head?.ref ?? null,\n      mergeableState: pr.mergeable_state ?? null,\n      commentCount: pr.comments ?? 0,\n      reviewCommentCount: pr.review_comments ?? 0,\n      createdAt: pr.created_at ?? null,\n      updatedAt: pr.updated_at ?? null,\n      htmlUrl: pr.html_url ?? null,\n    }))\n    : []\n  return {\n    count: pullRequests.length,\n    note: 'Use pull number with get_pull_request for full details.',\n    pullRequests,\n  }\n}",
        "scope": "read",
        "toolset": "pull_requests"
      },
      {
        "name": "get_pull_request",
        "description": "Get full details of a specific pull request including title, body, state, merge status, head/base refs, reviewers, and labels.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "pull_number": {
              "type": "integer",
              "description": "Pull request number"
            }
          },
          "required": [
            "owner",
            "repo",
            "pull_number"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/pulls/${input.pull_number}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "pull_requests"
      },
      {
        "name": "get_pull_request_diff",
        "description": "Get the raw unified diff for a pull request. Returns the complete diff of all changes. For per-file details, use list_pull_request_files instead.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "pull_number": {
              "type": "integer",
              "description": "Pull request number"
            }
          },
          "required": [
            "owner",
            "repo",
            "pull_number"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(\n    `/repos/${input.owner}/${input.repo}/pulls/${input.pull_number}`,\n    { headers: { 'Accept': 'application/vnd.github.diff' } }\n  )\n  const diff = await res.text()\n  return { diff }\n}",
        "scope": "read",
        "toolset": "pull_requests"
      },
      {
        "name": "list_pull_request_files",
        "description": "List the files changed in a pull request with their status (added/modified/deleted) and patch diff per file. Essential for code review.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "pull_number": {
              "type": "integer",
              "description": "Pull request number"
            },
            "page": {
              "type": "integer",
              "default": 1
            },
            "per_page": {
              "type": "integer",
              "default": 30,
              "maximum": 100
            }
          },
          "required": [
            "owner",
            "repo",
            "pull_number"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const query = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/pulls/${input.pull_number}/files${query}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "pull_requests"
      },
      {
        "name": "list_pull_request_comments",
        "description": "List inline review comments on a pull request (comments attached to specific lines of code).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "pull_number": {
              "type": "integer",
              "description": "Pull request number"
            },
            "page": {
              "type": "integer",
              "default": 1
            },
            "per_page": {
              "type": "integer",
              "default": 30,
              "maximum": 100
            }
          },
          "required": [
            "owner",
            "repo",
            "pull_number"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const query = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/pulls/${input.pull_number}/comments${query}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "pull_requests"
      },
      {
        "name": "search_pull_requests",
        "description": "Search pull requests using GitHub search syntax. Use 'is:pr' to scope to PRs (e.g. 'is:pr is:open author:octocat', 'is:pr review:required label:bug'). Returns matching PRs across repos.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "GitHub search query for PRs. Use 'is:pr' to scope to PRs (e.g. 'is:pr is:open author:octocat label:bug repo:owner/repo'). Supports all GitHub issue search qualifiers."
            },
            "page": {
              "type": "integer",
              "default": 1
            },
            "per_page": {
              "type": "integer",
              "default": 30,
              "maximum": 100
            }
          },
          "required": [
            "query"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  params.set('q', input.query)\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const res = await integration.fetch(`/search/issues?${params.toString()}`)\n  const data = await res.json()\n  const items = Array.isArray(data?.items)\n    ? data.items\n      .filter(item => !!item.pull_request)\n      .map(pr => ({\n        id: pr.id,\n        number: pr.number,\n        repositoryFullName: pr.repository_url ? pr.repository_url.replace('https://api.github.com/repos/', '') : null,\n        title: pr.title ?? null,\n        state: pr.state ?? null,\n        author: pr.user?.login ?? null,\n        commentCount: pr.comments ?? 0,\n        createdAt: pr.created_at ?? null,\n        updatedAt: pr.updated_at ?? null,\n        htmlUrl: pr.html_url ?? null,\n      }))\n    : []\n  return {\n    totalCount: typeof data?.total_count === 'number' ? data.total_count : items.length,\n    incompleteResults: !!data?.incomplete_results,\n    count: items.length,\n    note: 'Use owner/repo + pull number with get_pull_request for full details.',\n    pullRequests: items,\n  }\n}",
        "scope": "read",
        "toolset": "pull_requests"
      },
      {
        "name": "list_releases",
        "description": "List all releases for a repository, newest first.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "page": {
              "type": "integer",
              "default": 1
            },
            "per_page": {
              "type": "integer",
              "default": 30,
              "maximum": 100
            }
          },
          "required": [
            "owner",
            "repo"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const query = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/releases${query}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "releases"
      },
      {
        "name": "get_latest_release",
        "description": "Get the latest published release for a repository. Use this to quickly check the current version.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string"
            },
            "repo": {
              "type": "string"
            }
          },
          "required": [
            "owner",
            "repo"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/releases/latest`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "releases"
      },
      {
        "name": "list_workflow_runs",
        "description": "List GitHub Actions workflow runs for a repository. Filter by branch, status (e.g. 'failure', 'success'), or triggering event. Use this to check CI status.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "branch": {
              "type": "string",
              "description": "Filter runs by branch name"
            },
            "status": {
              "type": "string",
              "enum": [
                "queued",
                "in_progress",
                "completed",
                "action_required",
                "cancelled",
                "failure",
                "neutral",
                "skipped",
                "stale",
                "success",
                "timed_out",
                "waiting"
              ],
              "description": "Filter by run status or conclusion"
            },
            "event": {
              "type": "string",
              "description": "Filter by triggering event (e.g. 'push', 'pull_request', 'schedule', 'workflow_dispatch')"
            },
            "page": {
              "type": "integer",
              "default": 1
            },
            "per_page": {
              "type": "integer",
              "default": 30,
              "maximum": 100
            }
          },
          "required": [
            "owner",
            "repo"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.branch) params.set('branch', input.branch)\n  if (input.status) params.set('status', input.status)\n  if (input.event) params.set('event', input.event)\n  if (input.page) params.set('page', String(input.page))\n  if (input.per_page) params.set('per_page', String(input.per_page))\n  const query = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/actions/runs${query}`)\n  const data = await res.json()\n  const runs = Array.isArray(data?.workflow_runs)\n    ? data.workflow_runs.map(run => ({\n      id: run.id,\n      name: run.name ?? null,\n      displayTitle: run.display_title ?? null,\n      event: run.event ?? null,\n      status: run.status ?? null,\n      conclusion: run.conclusion ?? null,\n      runNumber: run.run_number ?? null,\n      headBranch: run.head_branch ?? null,\n      headSha: run.head_sha ?? null,\n      createdAt: run.created_at ?? null,\n      updatedAt: run.updated_at ?? null,\n      htmlUrl: run.html_url ?? null,\n      workflowId: run.workflow_id ?? null,\n    }))\n    : []\n  return {\n    totalCount: typeof data?.total_count === 'number' ? data.total_count : runs.length,\n    count: runs.length,\n    note: 'Use run id with get_workflow_run for full workflow run details.',\n    workflowRuns: runs,\n  }\n}",
        "scope": "read",
        "toolset": "ci"
      },
      {
        "name": "get_workflow_run",
        "description": "Get details of a specific GitHub Actions workflow run including its status, conclusion, timing, and associated commit.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "run_id": {
              "type": "integer",
              "description": "Workflow run ID (obtain from list_workflow_runs)"
            }
          },
          "required": [
            "owner",
            "repo",
            "run_id"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/actions/runs/${input.run_id}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "ci"
      },
      {
        "name": "get_job_logs",
        "description": "Get the log output for a specific GitHub Actions workflow job. Use this to diagnose CI failures. Get job_id from the GitHub Actions UI or the jobs list of a workflow run.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "job_id": {
              "type": "integer",
              "description": "Workflow job ID. Get this from the 'jobs' field of get_workflow_run, or from the GitHub Actions UI URL."
            }
          },
          "required": [
            "owner",
            "repo",
            "job_id"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  // GitHub returns a redirect to the actual log blob URL; fetch follows it automatically\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/actions/jobs/${input.job_id}/logs`)\n  const logs = await res.text()\n  return { logs }\n}",
        "scope": "read",
        "toolset": "ci"
      },
      {
        "name": "create_repo",
        "description": "Create a new GitHub repository under the authenticated user's account.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "description": "The name of the repository"
            },
            "description": {
              "type": "string",
              "description": "A short description of the repository"
            },
            "private": {
              "type": "boolean",
              "description": "Whether the repository is private",
              "default": false
            },
            "auto_init": {
              "type": "boolean",
              "description": "Pass true to create an initial commit with empty README",
              "default": false
            }
          },
          "required": [
            "name"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {\n    name: input.name,\n    description: input.description,\n    private: input.private,\n    auto_init: input.auto_init,\n  }\n  const res = await integration.fetch('/user/repos', { method: 'POST', body })\n  return await res.json()\n}",
        "scope": "write",
        "credentialVariants": [
          "classic_pat"
        ],
        "toolset": "repo_admin"
      },
      {
        "name": "delete_repo",
        "description": "Permanently delete a repository. This is irreversible. Requires the delete_repo scope on classic PATs.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "The account owner of the repository"
            },
            "repo": {
              "type": "string",
              "description": "The name of the repository"
            }
          },
          "required": [
            "owner",
            "repo"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}`, { method: 'DELETE' })\n  // DELETE returns 204 No Content on success\n  return { success: res.status === 204, status: res.status }\n}",
        "scope": "write",
        "credentialVariants": [
          "classic_pat"
        ],
        "toolset": "repo_admin"
      },
      {
        "name": "fork_repo",
        "description": "Fork a repository into your account or an organization. The fork is created asynchronously; the response returns immediately with the new repo details.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner to fork from"
            },
            "repo": {
              "type": "string",
              "description": "Repository name to fork"
            },
            "organization": {
              "type": "string",
              "description": "Organization to fork into (defaults to the authenticated user's account)"
            },
            "name": {
              "type": "string",
              "description": "New name for the forked repository (defaults to the original name)"
            }
          },
          "required": [
            "owner",
            "repo"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {}\n  if (input.organization) body.organization = input.organization\n  if (input.name) body.name = input.name\n  const res = await integration.fetch(\n    `/repos/${input.owner}/${input.repo}/forks`,\n    { method: 'POST', body }\n  )\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "repo_admin"
      },
      {
        "name": "create_branch",
        "description": "Create a new branch in a repository, branching from the repo's default branch by default.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "The account owner of the repository"
            },
            "repo": {
              "type": "string",
              "description": "The name of the repository"
            },
            "branch": {
              "type": "string",
              "description": "The name of the new branch"
            },
            "from_branch": {
              "type": "string",
              "description": "The branch to create from. Defaults to the repository's default branch"
            }
          },
          "required": [
            "owner",
            "repo",
            "branch"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  // First, get the SHA of the branch to create from\n  let fromRef = input.from_branch || 'main'\n  \n  // Try to get the ref, fallback to master if main doesn't exist\n  let refRes\n  try {\n    refRes = await integration.fetch(`/repos/${input.owner}/${input.repo}/git/refs/heads/${fromRef}`)\n  } catch (e) {\n    if (fromRef === 'main') {\n      fromRef = 'master'\n      refRes = await integration.fetch(`/repos/${input.owner}/${input.repo}/git/refs/heads/${fromRef}`)\n    } else {\n      throw e\n    }\n  }\n  \n  const refData = await refRes.json()\n  const sha = refData.object.sha\n  \n  // Create the new branch\n  const body = {\n    ref: `refs/heads/${input.branch}`,\n    sha: sha,\n  }\n  \n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/git/refs`, { \n    method: 'POST', \n    body \n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "code"
      },
      {
        "name": "delete_branch",
        "description": "Delete a branch. Typically used after a pull request is merged. Use list_branches to find the branch name first.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "branch": {
              "type": "string",
              "description": "Branch name to delete (e.g. 'feature/my-feature')"
            }
          },
          "required": [
            "owner",
            "repo",
            "branch"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(\n    `/repos/${input.owner}/${input.repo}/git/refs/heads/${input.branch}`,\n    { method: 'DELETE' }\n  )\n  if (res.status === 204) return { success: true, branch: input.branch }\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "code"
      },
      {
        "name": "edit_file",
        "description": "Edit a file using search/replace. Fetches the file, applies edits, and commits the result. Each old_text must match the file content exactly, including whitespace and indentation. Use get_file_contents to verify content before editing. For multi-file atomic changes, use edit_files instead.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "branch": {
              "type": "string",
              "description": "Branch to commit to"
            },
            "path": {
              "type": "string",
              "description": "Path of the file to edit (e.g. 'src/index.ts')"
            },
            "edits": {
              "type": "array",
              "description": "Search/replace operations applied in order. Each old_text must match the file content exactly, including whitespace and indentation.",
              "items": {
                "type": "object",
                "properties": {
                  "old_text": {
                    "type": "string",
                    "description": "Exact text to find in the file"
                  },
                  "new_text": {
                    "type": "string",
                    "description": "Text to replace it with"
                  }
                },
                "required": [
                  "old_text",
                  "new_text"
                ],
                "additionalProperties": false
              },
              "minItems": 1
            },
            "message": {
              "type": "string",
              "description": "Commit message"
            }
          },
          "required": [
            "owner",
            "repo",
            "branch",
            "path",
            "edits",
            "message"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { owner, repo, branch, path, edits, message } = input\n\n  const params = new URLSearchParams()\n  params.set('ref', branch)\n  const fileRes = await integration.fetch(`/repos/${owner}/${repo}/contents/${path}?${params.toString()}`)\n  const fileData = await fileRes.json()\n\n  if (!fileData || !fileData.content || !fileData.sha) {\n    throw new Error(`File not found: ${path}. Use get_repo_tree to discover file paths.`)\n  }\n\n  const b64 = fileData.content.replace(/\\n/g, '')\n  let content = decodeURIComponent(\n    atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')\n  )\n\n  for (let i = 0; i < edits.length; i++) {\n    const { old_text, new_text } = edits[i]\n    const idx = content.indexOf(old_text)\n    if (idx === -1) {\n      throw new Error(\n        `Edit ${i + 1}/${edits.length} failed: old_text not found in ${path}. `\n        + 'Ensure the search text matches the file exactly, including whitespace and indentation. '\n        + 'Use get_file_contents to verify the current content.'\n      )\n    }\n    content = content.substring(0, idx) + new_text + content.substring(idx + old_text.length)\n  }\n\n  const contentBase64 = btoa(unescape(encodeURIComponent(content)))\n\n  const res = await integration.fetch(`/repos/${owner}/${repo}/contents/${path}`, {\n    method: 'PUT',\n    body: {\n      message: message,\n      content: contentBase64,\n      sha: fileData.sha,\n      branch: branch,\n    },\n  })\n  const result = await res.json()\n\n  return {\n    commit: {\n      sha: result.commit?.sha,\n      message: result.commit?.message,\n      url: result.commit?.html_url,\n    },\n    file: { path: path },\n  }\n}",
        "scope": "write",
        "toolset": "code"
      },
      {
        "name": "edit_files",
        "description": "Create, edit, and delete multiple files in a single atomic commit. Use action 'create' with content for new files, 'edit' with old_text/new_text search/replace pairs for existing files, 'delete' to remove files. All changes are committed together. For single-file edits, use edit_file instead.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "branch": {
              "type": "string",
              "description": "Branch to commit to"
            },
            "message": {
              "type": "string",
              "description": "Commit message"
            },
            "files": {
              "type": "array",
              "description": "Files to create, edit, or delete in this commit",
              "items": {
                "type": "object",
                "properties": {
                  "path": {
                    "type": "string",
                    "description": "File path in the repository"
                  },
                  "action": {
                    "type": "string",
                    "enum": [
                      "create",
                      "edit",
                      "delete"
                    ],
                    "description": "'create': new file or overwrite with content. 'edit': apply search/replace edits to existing file. 'delete': remove the file."
                  },
                  "content": {
                    "type": "string",
                    "description": "Full file content (required for 'create' action)"
                  },
                  "edits": {
                    "type": "array",
                    "description": "Search/replace pairs (required for 'edit' action). Each old_text must match exactly, including whitespace.",
                    "items": {
                      "type": "object",
                      "properties": {
                        "old_text": {
                          "type": "string",
                          "description": "Exact text to find"
                        },
                        "new_text": {
                          "type": "string",
                          "description": "Text to replace it with"
                        }
                      },
                      "required": [
                        "old_text",
                        "new_text"
                      ],
                      "additionalProperties": false
                    }
                  }
                },
                "required": [
                  "path",
                  "action"
                ],
                "additionalProperties": false
              },
              "minItems": 1
            }
          },
          "required": [
            "owner",
            "repo",
            "branch",
            "message",
            "files"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { owner, repo, branch, message, files } = input\n\n  // Helper: decode base64 GitHub content to UTF-8\n  function decodeContent(b64Raw) {\n    const b64 = b64Raw.replace(/\\n/g, '')\n    return decodeURIComponent(\n      atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')\n    )\n  }\n\n  // Helper: apply search/replace edits to text\n  function applyEdits(text, edits, filePath) {\n    let result = text\n    for (let i = 0; i < edits.length; i++) {\n      const { old_text, new_text } = edits[i]\n      const idx = result.indexOf(old_text)\n      if (idx === -1) {\n        throw new Error(\n          `Edit ${i + 1}/${edits.length} failed on ${filePath}: old_text not found. `\n          + 'Ensure the search text matches exactly, including whitespace and indentation. '\n          + 'Use get_file_contents to verify the current content.'\n        )\n      }\n      result = result.substring(0, idx) + new_text + result.substring(idx + old_text.length)\n    }\n    return result\n  }\n\n  // 1. Get the current commit SHA for the branch\n  const refRes = await integration.fetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`)\n  const refData = await refRes.json()\n  const currentCommitSha = refData.object.sha\n\n  // 2. Get the current commit to find its tree\n  const commitRes = await integration.fetch(`/repos/${owner}/${repo}/git/commits/${currentCommitSha}`)\n  const commitData = await commitRes.json()\n  const currentTreeSha = commitData.tree.sha\n\n  // 3. Resolve final content for each file\n  const tree = []\n  for (const file of files) {\n    if (file.action === 'delete') {\n      tree.push({ path: file.path, mode: '100644', type: 'blob', sha: null })\n      continue\n    }\n\n    let finalContent\n    if (file.action === 'edit') {\n      if (!file.edits || file.edits.length === 0) {\n        throw new Error(`File ${file.path} has action 'edit' but no edits provided.`)\n      }\n      const params = new URLSearchParams()\n      params.set('ref', branch)\n      const fileRes = await integration.fetch(`/repos/${owner}/${repo}/contents/${file.path}?${params.toString()}`)\n      const fileData = await fileRes.json()\n      if (!fileData || !fileData.content) {\n        throw new Error(`File not found: ${file.path}. Use get_repo_tree to discover file paths.`)\n      }\n      const currentContent = decodeContent(fileData.content)\n      finalContent = applyEdits(currentContent, file.edits, file.path)\n    } else {\n      // action === 'create'\n      if (file.content === undefined || file.content === null) {\n        throw new Error(`File ${file.path} has action 'create' but no content provided.`)\n      }\n      finalContent = file.content\n    }\n\n    // Create blob\n    const blobRes = await integration.fetch(`/repos/${owner}/${repo}/git/blobs`, {\n      method: 'POST',\n      body: { content: finalContent, encoding: 'utf-8' },\n    })\n    const blobData = await blobRes.json()\n    tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blobData.sha })\n  }\n\n  // 4. Create a new tree\n  const treeRes = await integration.fetch(`/repos/${owner}/${repo}/git/trees`, {\n    method: 'POST',\n    body: { base_tree: currentTreeSha, tree: tree },\n  })\n  const treeData = await treeRes.json()\n\n  // 5. Create the commit\n  const newCommitRes = await integration.fetch(`/repos/${owner}/${repo}/git/commits`, {\n    method: 'POST',\n    body: { message: message, tree: treeData.sha, parents: [currentCommitSha] },\n  })\n  const newCommitData = await newCommitRes.json()\n\n  // 6. Update the branch reference\n  await integration.fetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {\n    method: 'PATCH',\n    body: { sha: newCommitData.sha },\n  })\n\n  return {\n    commit: {\n      sha: newCommitData.sha,\n      message: newCommitData.message,\n      url: newCommitData.html_url,\n    },\n    files: files.map(f => ({ path: f.path, action: f.action })),\n  }\n}",
        "scope": "write",
        "toolset": "code"
      },
      {
        "name": "create_file",
        "description": "Create a new file or overwrite an existing file's content in a single commit. Handles SHA resolution internally -- no need to fetch the file first. For partial edits to existing files, use edit_file instead.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "branch": {
              "type": "string",
              "description": "Branch to commit to"
            },
            "path": {
              "type": "string",
              "description": "File path to create (e.g. 'src/utils/helpers.ts')"
            },
            "content": {
              "type": "string",
              "description": "Plain text file content"
            },
            "message": {
              "type": "string",
              "description": "Commit message"
            }
          },
          "required": [
            "owner",
            "repo",
            "branch",
            "path",
            "content",
            "message"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { owner, repo, branch, path, content, message } = input\n\n  // Check if the file already exists to get its SHA for overwrite\n  let existingSha\n  try {\n    const params = new URLSearchParams()\n    params.set('ref', branch)\n    const checkRes = await integration.fetch(`/repos/${owner}/${repo}/contents/${path}?${params.toString()}`)\n    const checkData = await checkRes.json()\n    if (checkData && checkData.sha) {\n      existingSha = checkData.sha\n    }\n  } catch (e) {\n    // 404 means file doesn't exist yet -- that's fine\n  }\n\n  const contentBase64 = btoa(unescape(encodeURIComponent(content)))\n\n  const body = {\n    message: message,\n    content: contentBase64,\n    branch: branch,\n  }\n  if (existingSha) {\n    body.sha = existingSha\n  }\n\n  const res = await integration.fetch(`/repos/${owner}/${repo}/contents/${path}`, {\n    method: 'PUT',\n    body: body,\n  })\n  const result = await res.json()\n\n  return {\n    commit: {\n      sha: result.commit?.sha,\n      message: result.commit?.message,\n      url: result.commit?.html_url,\n    },\n    file: {\n      path: path,\n      action: existingSha ? 'overwritten' : 'created',\n    },\n  }\n}",
        "scope": "write",
        "toolset": "code"
      },
      {
        "name": "delete_file",
        "description": "Delete a file from a repository. The file's SHA is fetched automatically. Creates a commit with the deletion.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "path": {
              "type": "string",
              "description": "Path of the file to delete (e.g. 'src/old-file.js')"
            },
            "message": {
              "type": "string",
              "description": "Commit message"
            },
            "sha": {
              "type": "string",
              "description": "Optional blob SHA. If omitted, the SHA is fetched automatically."
            },
            "branch": {
              "type": "string",
              "description": "Branch to delete the file from (defaults to the repo's default branch)"
            }
          },
          "required": [
            "owner",
            "repo",
            "path",
            "message"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  let sha = input.sha\n  if (!sha) {\n    const params = new URLSearchParams()\n    if (input.branch) params.set('ref', input.branch)\n    const query = params.toString() ? `?${params.toString()}` : ''\n    const fileRes = await integration.fetch(`/repos/${input.owner}/${input.repo}/contents/${input.path}${query}`)\n    const fileData = await fileRes.json()\n    if (!fileData || !fileData.sha) {\n      throw new Error(`File not found: ${input.path}. Cannot delete a file that does not exist.`)\n    }\n    sha = fileData.sha\n  }\n\n  const body = { message: input.message, sha: sha }\n  if (input.branch) body.branch = input.branch\n  const res = await integration.fetch(\n    `/repos/${input.owner}/${input.repo}/contents/${input.path}`,\n    { method: 'DELETE', body }\n  )\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "code"
      },
      {
        "name": "create_pull_request",
        "description": "Open a new pull request from a head branch into a base branch.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "The account owner of the repository"
            },
            "repo": {
              "type": "string",
              "description": "The name of the repository"
            },
            "title": {
              "type": "string",
              "description": "The title of the pull request"
            },
            "body": {
              "type": "string",
              "description": "The contents of the pull request"
            },
            "head": {
              "type": "string",
              "description": "The name of the branch where your changes are implemented"
            },
            "base": {
              "type": "string",
              "description": "The name of the branch you want the changes pulled into"
            },
            "draft": {
              "type": "boolean",
              "description": "Whether to create the pull request as a draft"
            }
          },
          "required": [
            "owner",
            "repo",
            "title",
            "head",
            "base"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {\n    title: input.title,\n    body: input.body,\n    head: input.head,\n    base: input.base,\n    draft: input.draft,\n  }\n  \n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/pulls`, { \n    method: 'POST', \n    body \n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "pull_requests"
      },
      {
        "name": "update_pull_request",
        "description": "Edit a pull request's title, body, state (open/closed), base branch, or draft status.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "pull_number": {
              "type": "integer",
              "description": "Pull request number to update"
            },
            "title": {
              "type": "string",
              "description": "New title for the PR"
            },
            "body": {
              "type": "string",
              "description": "New description for the PR (markdown)"
            },
            "state": {
              "type": "string",
              "enum": [
                "open",
                "closed"
              ],
              "description": "Set to 'closed' to close the PR without merging"
            },
            "base": {
              "type": "string",
              "description": "New base branch to merge into"
            },
            "draft": {
              "type": "boolean",
              "description": "Set to true to convert to draft, false to mark ready for review"
            }
          },
          "required": [
            "owner",
            "repo",
            "pull_number"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {}\n  if (input.title !== undefined) body.title = input.title\n  if (input.body !== undefined) body.body = input.body\n  if (input.state !== undefined) body.state = input.state\n  if (input.base !== undefined) body.base = input.base\n  if (input.draft !== undefined) body.draft = input.draft\n  const res = await integration.fetch(\n    `/repos/${input.owner}/${input.repo}/pulls/${input.pull_number}`,\n    { method: 'PATCH', body }\n  )\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "pull_requests"
      },
      {
        "name": "merge_pull_request",
        "description": "Merge a pull request. Supports merge, squash, and rebase merge methods.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "The account owner of the repository"
            },
            "repo": {
              "type": "string",
              "description": "The name of the repository"
            },
            "pull_number": {
              "type": "number",
              "description": "The number of the pull request"
            },
            "commit_title": {
              "type": "string",
              "description": "Title for the automatic commit message"
            },
            "commit_message": {
              "type": "string",
              "description": "Extra detail to append to automatic commit message"
            },
            "merge_method": {
              "type": "string",
              "enum": [
                "merge",
                "squash",
                "rebase"
              ],
              "description": "Merge method to use. Default is 'merge'"
            }
          },
          "required": [
            "owner",
            "repo",
            "pull_number"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {\n    commit_title: input.commit_title,\n    commit_message: input.commit_message,\n    merge_method: input.merge_method || 'merge',\n  }\n  \n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/pulls/${input.pull_number}/merge`, { \n    method: 'PUT', \n    body \n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "pull_requests"
      },
      {
        "name": "request_pull_request_reviewers",
        "description": "Request specific users or teams to review a pull request.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "pull_number": {
              "type": "integer",
              "description": "Pull request number"
            },
            "reviewers": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "GitHub usernames to request reviews from"
            },
            "team_reviewers": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Team slugs to request reviews from (org repos only)"
            }
          },
          "required": [
            "owner",
            "repo",
            "pull_number"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {}\n  if (input.reviewers) body.reviewers = input.reviewers\n  if (input.team_reviewers) body.team_reviewers = input.team_reviewers\n  const res = await integration.fetch(\n    `/repos/${input.owner}/${input.repo}/pulls/${input.pull_number}/requested_reviewers`,\n    { method: 'POST', body }\n  )\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "pull_requests"
      },
      {
        "name": "create_pull_request_review",
        "description": "Submit a pull request review. Use event=APPROVE to approve, REQUEST_CHANGES to request changes, or COMMENT to leave a comment-only review.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "pull_number": {
              "type": "integer",
              "description": "Pull request number"
            },
            "event": {
              "type": "string",
              "enum": [
                "APPROVE",
                "REQUEST_CHANGES",
                "COMMENT"
              ],
              "description": "Review action: APPROVE to approve, REQUEST_CHANGES to request changes, COMMENT to leave a comment only"
            },
            "body": {
              "type": "string",
              "description": "Review summary comment (required when event is REQUEST_CHANGES or COMMENT)"
            },
            "commit_id": {
              "type": "string",
              "description": "SHA of the commit to review. Defaults to the latest commit on the PR."
            }
          },
          "required": [
            "owner",
            "repo",
            "pull_number",
            "event"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = { event: input.event }\n  if (input.body !== undefined) body.body = input.body\n  if (input.commit_id !== undefined) body.commit_id = input.commit_id\n  const res = await integration.fetch(\n    `/repos/${input.owner}/${input.repo}/pulls/${input.pull_number}/reviews`,\n    { method: 'POST', body }\n  )\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "pull_requests"
      },
      {
        "name": "create_issue",
        "description": "Create a new issue in a repository. Optionally assign users and add labels.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string"
            },
            "repo": {
              "type": "string"
            },
            "title": {
              "type": "string"
            },
            "body": {
              "type": "string"
            },
            "assignees": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "labels": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "required": [
            "owner",
            "repo",
            "title"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {\n    title: input.title,\n    body: input.body,\n    assignees: input.assignees,\n    labels: input.labels,\n  }\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues`, { method: 'POST', body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "issues"
      },
      {
        "name": "update_issue",
        "description": "Update fields on an existing issue (title, body, state, assignees, labels, milestone).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string"
            },
            "repo": {
              "type": "string"
            },
            "issue_number": {
              "type": "integer",
              "minimum": 1
            },
            "title": {
              "type": "string"
            },
            "body": {
              "type": "string"
            },
            "state": {
              "type": "string",
              "enum": [
                "open",
                "closed"
              ]
            },
            "assignees": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "labels": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "required": [
            "owner",
            "repo",
            "issue_number"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {}\n  if (input.title !== undefined)\n    body.title = input.title\n  if (input.body !== undefined)\n    body.body = input.body\n  if (input.state !== undefined)\n    body.state = input.state\n  if (input.assignees !== undefined)\n    body.assignees = input.assignees\n  if (input.labels !== undefined)\n    body.labels = input.labels\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues/${input.issue_number}`, { method: 'PATCH', body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "issues"
      },
      {
        "name": "close_issue",
        "description": "Close an issue.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string"
            },
            "repo": {
              "type": "string"
            },
            "issue_number": {
              "type": "integer",
              "minimum": 1
            }
          },
          "required": [
            "owner",
            "repo",
            "issue_number"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = { state: 'closed' }\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues/${input.issue_number}`, { method: 'PATCH', body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "issues"
      },
      {
        "name": "comment_on_issue",
        "description": "Add a comment to an issue or pull request (GitHub PRs share the issue comment thread). Use list_issue_comments to read existing comments first.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string"
            },
            "repo": {
              "type": "string"
            },
            "issue_number": {
              "type": "integer",
              "minimum": 1
            },
            "body": {
              "type": "string"
            }
          },
          "required": [
            "owner",
            "repo",
            "issue_number",
            "body"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = { body: input.body }\n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues/${input.issue_number}/comments`, { method: 'POST', body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "issues"
      },
      {
        "name": "add_labels_to_issue",
        "description": "Add labels to an issue or pull request. Use list_labels to discover available labels before calling this.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "The account owner of the repository"
            },
            "repo": {
              "type": "string",
              "description": "The name of the repository"
            },
            "issue_number": {
              "type": "number",
              "description": "The number of the issue"
            },
            "labels": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "The names of the labels to add"
            }
          },
          "required": [
            "owner",
            "repo",
            "issue_number",
            "labels"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {\n    labels: input.labels,\n  }\n  \n  const res = await integration.fetch(`/repos/${input.owner}/${input.repo}/issues/${input.issue_number}/labels`, { \n    method: 'POST', \n    body \n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "issues"
      },
      {
        "name": "create_release",
        "description": "Create a new release from a tag. Can auto-generate release notes from commits. Set draft=true to save without publishing, prerelease=true for alpha/beta/rc versions.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "owner": {
              "type": "string",
              "description": "Repository owner"
            },
            "repo": {
              "type": "string",
              "description": "Repository name"
            },
            "tag_name": {
              "type": "string",
              "description": "Tag to create the release from (e.g. 'v1.2.0'). The tag must already exist or target_commitish must be provided."
            },
            "name": {
              "type": "string",
              "description": "Release title (defaults to tag_name)"
            },
            "body": {
              "type": "string",
              "description": "Release notes in markdown"
            },
            "draft": {
              "type": "boolean",
              "description": "Create as an unpublished draft release",
              "default": false
            },
            "prerelease": {
              "type": "boolean",
              "description": "Mark as a pre-release (alpha, beta, rc, etc.)",
              "default": false
            },
            "target_commitish": {
              "type": "string",
              "description": "Branch name or commit SHA to tag from (defaults to the repo's default branch). Required if the tag does not yet exist."
            },
            "generate_release_notes": {
              "type": "boolean",
              "description": "Auto-generate release notes from commits merged since the previous release",
              "default": false
            }
          },
          "required": [
            "owner",
            "repo",
            "tag_name"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = { tag_name: input.tag_name }\n  if (input.name !== undefined) body.name = input.name\n  if (input.body !== undefined) body.body = input.body\n  if (input.draft !== undefined) body.draft = input.draft\n  if (input.prerelease !== undefined) body.prerelease = input.prerelease\n  if (input.target_commitish !== undefined) body.target_commitish = input.target_commitish\n  if (input.generate_release_notes !== undefined) body.generate_release_notes = input.generate_release_notes\n  const res = await integration.fetch(\n    `/repos/${input.owner}/${input.repo}/releases`,\n    { method: 'POST', body }\n  )\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "releases"
      }
    ]
  },
  "google-calendar": {
    "manifest": {
      "name": "google-calendar",
      "version": "0.1.0",
      "baseUrl": "https://www.googleapis.com/calendar/v3",
      "toolsets": {
        "events": {
          "label": "Events",
          "description": "Browse, schedule, and manage calendar events"
        },
        "sharing": {
          "label": "Sharing",
          "description": "Control who can access calendars"
        }
      },
      "tools": [
        {
          "name": "list_calendars",
          "description": "List all calendars in the authenticated user's calendar list, including the primary calendar and any subscribed or shared calendars. Returns calendar IDs needed for list_events, create_event, and other calendar-specific tools. The primary calendar has calendarId='primary'.",
          "inputSchema": "schemas/empty.json",
          "handler": "handlers/list_calendars.js",
          "scope": "read",
          "toolset": "events"
        },
        {
          "name": "get_calendar",
          "description": "Get details for a specific calendar by ID, including its summary, description, timezone, and access role. Use list_calendars to find calendar IDs.",
          "inputSchema": "schemas/id_calendar.json",
          "handler": "handlers/get_calendar.js",
          "scope": "read",
          "toolset": "events"
        },
        {
          "name": "list_events",
          "description": "List events in a calendar with optional time range, text search, and pagination. Use calendarId='primary' for the user's main calendar. Set singleEvents=true and orderBy='startTime' to get recurring events expanded into individual instances in chronological order. Times must be RFC3339 format (e.g. '2024-01-15T09:00:00Z' or '2024-01-15T09:00:00-05:00'). Defaults to 25 results. Use pageToken from the response for the next page.",
          "inputSchema": "schemas/list_events.json",
          "handler": "handlers/list_events.js",
          "scope": "read",
          "toolset": "events"
        },
        {
          "name": "get_event",
          "description": "Get a specific event by its ID from a calendar. Returns full event details including summary, start, end, attendees, location, description, recurrence, and status. Use list_events to find event IDs.",
          "inputSchema": "schemas/id_calendar_event.json",
          "handler": "handlers/get_event.js",
          "scope": "read",
          "toolset": "events"
        },
        {
          "name": "list_colors",
          "description": "Get the set of color definitions available for calendars and events. Returns colorId values and their hex codes. Use colorId values in create_event or patch_event to color-code events.",
          "inputSchema": "schemas/empty.json",
          "handler": "handlers/list_colors.js",
          "scope": "read",
          "toolset": "events"
        },
        {
          "name": "freebusy_query",
          "description": "Query free/busy availability for one or more calendars within a time range. Useful for finding open slots or checking if attendees are available. Provide timeMin, timeMax (RFC3339), and an items array of calendar IDs. Returns busy time blocks for each calendar.",
          "inputSchema": "schemas/freebusy_query.json",
          "handler": "handlers/freebusy_query.js",
          "scope": "read",
          "toolset": "events"
        },
        {
          "name": "list_settings",
          "description": "List the authenticated user's Google Calendar settings, such as timezone, date format, and notification preferences.",
          "inputSchema": "schemas/empty.json",
          "handler": "handlers/list_settings.js",
          "scope": "read",
          "toolset": "events"
        },
        {
          "name": "create_event",
          "description": "Create a new event in a calendar. Required fields: calendarId, summary, start, end. Use {dateTime, timeZone} for timed events (e.g. {\"dateTime\": \"2024-01-15T10:00:00\", \"timeZone\": \"America/New_York\"}) or {date} for all-day events (e.g. {\"date\": \"2024-01-15\"}). Optional fields: description, location, attendees (array of {email}), recurrence (RRULE strings), reminders, colorId, visibility. The calendarId field is extracted automatically; all other fields are sent as the event body.",
          "inputSchema": "schemas/create_event.json",
          "handler": "handlers/create_event.js",
          "scope": "write",
          "toolset": "events"
        },
        {
          "name": "patch_event",
          "description": "Partially update an event by providing only the fields to change. All other fields are preserved. Use this as the standard event update method. Provide changes in a 'body' object along with calendarId and eventId.",
          "inputSchema": "schemas/patch_event.json",
          "handler": "handlers/patch_event.js",
          "scope": "write",
          "toolset": "events"
        },
        {
          "name": "delete_event",
          "description": "Delete an event from a calendar. This permanently removes the event. For recurring events, this deletes only the specified instance. Use list_events to find event IDs.",
          "inputSchema": "schemas/id_calendar_event.json",
          "handler": "handlers/delete_event.js",
          "scope": "write",
          "toolset": "events"
        },
        {
          "name": "move_event",
          "description": "Move an event from one calendar to another. Provide the source calendarId, eventId, and the destination calendarId. Returns the updated event in the destination calendar.",
          "inputSchema": "schemas/move_event.json",
          "handler": "handlers/move_event.js",
          "scope": "write",
          "toolset": "events"
        },
        {
          "name": "quick_add",
          "description": "Create an event using a natural language text string. Parses the text to extract event details automatically. Examples: 'Meeting with Bob tomorrow at 3pm for 1 hour', 'Dentist appointment on Friday at 2pm', 'Weekly standup every Monday at 9am'. Requires calendarId (use 'primary') and text.",
          "inputSchema": "schemas/quick_add.json",
          "handler": "handlers/quick_add.js",
          "scope": "write",
          "toolset": "events"
        },
        {
          "name": "list_acl",
          "description": "List the Access Control List (ACL) rules for a calendar. Returns rules defining who has access and at what permission level (reader, writer, owner). Use get_calendar to find the calendarId.",
          "inputSchema": "schemas/id_calendar.json",
          "handler": "handlers/list_acl.js",
          "scope": "admin",
          "toolset": "sharing"
        },
        {
          "name": "get_acl",
          "description": "Get a specific ACL rule by its rule ID for a calendar. Use list_acl to find rule IDs.",
          "inputSchema": "schemas/get_acl.json",
          "handler": "handlers/get_acl.js",
          "scope": "admin",
          "toolset": "sharing"
        },
        {
          "name": "insert_acl",
          "description": "Add a new ACL rule to grant a user or group access to a calendar. Roles: 'reader' (view), 'writer' (view + edit events), 'owner' (full control). Scope must include type ('user', 'group', 'domain', or 'default') and optionally value (email or domain).",
          "inputSchema": "schemas/insert_acl.json",
          "handler": "handlers/insert_acl.js",
          "scope": "admin",
          "toolset": "sharing"
        },
        {
          "name": "update_acl",
          "description": "Update an existing ACL rule to change a user's or group's permission level on a calendar. Use list_acl to find the rule ID.",
          "inputSchema": "schemas/update_acl.json",
          "handler": "handlers/update_acl.js",
          "scope": "admin",
          "toolset": "sharing"
        },
        {
          "name": "delete_acl",
          "description": "Remove an ACL rule from a calendar, revoking the associated user's or group's access. Use list_acl to find the rule ID.",
          "inputSchema": "schemas/delete_acl.json",
          "handler": "handlers/delete_acl.js",
          "scope": "admin",
          "toolset": "sharing"
        }
      ]
    },
    "prompt": "## Calendar IDs\n\n- Use `calendarId='primary'` for the authenticated user's main calendar\n- Use `list_calendars` to discover other calendar IDs (work, shared, subscribed calendars)\n- Calendar IDs typically look like email addresses (e.g. `user@example.com`) or opaque strings for subscribed calendars\n\n## Date and time format\n\nAll times must be in RFC3339 format:\n- Timed events: `'2024-01-15T10:00:00-05:00'` (with timezone offset) or `'2024-01-15T15:00:00Z'` (UTC)\n- All-day events use date-only format: `'2024-01-15'`\n\n## Creating events\n\nFor `create_event`, required fields are `calendarId`, `summary`, `start`, and `end`:\n\n**Timed event:**\n```json\n{\n  \"calendarId\": \"primary\",\n  \"summary\": \"Team Meeting\",\n  \"start\": { \"dateTime\": \"2024-01-15T10:00:00\", \"timeZone\": \"America/New_York\" },\n  \"end\":   { \"dateTime\": \"2024-01-15T11:00:00\", \"timeZone\": \"America/New_York\" }\n}\n```\n\n**All-day event:**\n```json\n{\n  \"calendarId\": \"primary\",\n  \"summary\": \"Company Holiday\",\n  \"start\": { \"date\": \"2024-01-15\" },\n  \"end\":   { \"date\": \"2024-01-16\" }\n}\n```\n\nNote: For all-day events, `end.date` should be the day *after* the last day (exclusive end).\n\n## Listing events in chronological order\n\nTo list upcoming events in start-time order (e.g. \"what's on my calendar this week\"):\n- Set `singleEvents=true` to expand recurring events into individual instances\n- Set `orderBy='startTime'` (requires `singleEvents=true`)\n- Set `timeMin` to now (current ISO timestamp) and `timeMax` to the end of the desired range\n\n## Quick add\n\n`quick_add` parses natural language:\n- `\"Meeting with Bob tomorrow at 3pm for 1 hour\"`\n- `\"Dentist appointment on Friday at 2pm\"`\n- `\"Weekly standup every Monday at 9am\"`\n\n## Free/busy queries\n\nUse `freebusy_query` to check availability before scheduling:\n```json\n{\n  \"timeMin\": \"2024-01-15T00:00:00Z\",\n  \"timeMax\": \"2024-01-15T23:59:59Z\",\n  \"items\": [{ \"id\": \"primary\" }, { \"id\": \"colleague@example.com\" }]\n}\n```\n\n## Updating events\n\n- Use `update_event` for a full replacement (all fields must be provided)\n- Use `patch_event` for partial updates (only provide the fields you want to change in `body`)\n- `patch_event` is preferred when modifying one or two fields to avoid accidentally clearing others\n",
    "variants": {
      "variants": {
        "service_account": {
          "label": "Service Account (recommended)",
          "schema": {
            "type": "object",
            "properties": {
              "serviceAccountJson": {
                "type": "string",
                "title": "Service Account JSON",
                "description": "Full service account key JSON (contents of the downloaded JSON file from Google Cloud)."
              },
              "subject": {
                "type": "string",
                "title": "Subject / impersonated user (optional)",
                "description": "User email to impersonate via Google Workspace domain-wide delegation. Required for most Calendar operations."
              },
              "scopes": {
                "type": "array",
                "title": "OAuth scopes (optional)",
                "description": "Optional override for OAuth scopes. Defaults to calendar.",
                "items": {
                  "type": "string"
                }
              }
            },
            "required": [
              "serviceAccountJson"
            ],
            "additionalProperties": false
          },
          "injection": {
            "headers": {
              "Authorization": "Bearer {{token}}"
            }
          },
          "preprocess": "google_service_account",
          "healthCheck": {
            "path": "/users/me/calendarList?maxResults=1"
          }
        },
        "oauth_token": {
          "label": "OAuth Access Token (short-lived)",
          "schema": {
            "type": "object",
            "properties": {
              "token": {
                "type": "string",
                "title": "OAuth Access Token",
                "description": "Short-lived Google OAuth access token with calendar scope."
              }
            },
            "required": [
              "token"
            ],
            "additionalProperties": false
          },
          "injection": {
            "headers": {
              "Authorization": "Bearer {{token}}"
            }
          },
          "healthCheck": {
            "path": "/users/me/calendarList?maxResults=1"
          }
        }
      },
      "default": "service_account"
    },
    "hint": "Recommended: use a Google service account.\n\n- Create a service account in Google Cloud\n- Download a JSON key\n- Paste the JSON into `serviceAccountJson`\n\nNote: Calendar often needs Google Workspace domain-wide delegation if you want to impersonate a user (`subject`).\nFor simple setups, use a short-lived OAuth access token in `token`.",
    "hintsByVariant": {
      "oauth_token": "Obtain a short-lived Google OAuth access token:\n\n1. Use the Google OAuth 2.0 Playground (`https://developers.google.com/oauthplayground/`) or your own OAuth flow\n2. Select the scope: `https://www.googleapis.com/auth/calendar`\n3. Exchange the authorization code for an access token\n4. Paste the access token here\n\nNote: OAuth access tokens are short-lived (typically 1 hour). For long-running use, prefer the Service Account variant.",
      "service_account": "Set up a Google Cloud Service Account:\n\n1. Open the [Google Cloud Console](https://console.cloud.google.com/)\n2. Enable the **Google Calendar API** for your project\n3. Go to **IAM & Admin → Service Accounts** and create a new service account\n4. Under **Keys**, click **Add Key → Create new key → JSON** and download the file\n5. Paste the full contents of the JSON file here\n\nFor Google Workspace users: Calendar access typically requires domain-wide delegation.\nConfigure it in the Google Admin console, then set `subject` to the calendar owner's email."
    },
    "tools": [
      {
        "name": "list_calendars",
        "description": "List all calendars in the authenticated user's calendar list, including the primary calendar and any subscribed or shared calendars. Returns calendar IDs needed for list_events, create_event, and other calendar-specific tools. The primary calendar has calendarId='primary'.",
        "inputSchema": {},
        "handlerCode": "async (input) => {\n  const res = await integration.fetch('/users/me/calendarList')\n  const data = await res.json()\n  const calendars = Array.isArray(data?.items)\n    ? data.items.map(cal => ({\n      id: cal.id ?? null,\n      summary: cal.summary ?? null,\n      description: cal.description ?? null,\n      primary: !!cal.primary,\n      accessRole: cal.accessRole ?? null,\n      timeZone: cal.timeZone ?? null,\n      backgroundColor: cal.backgroundColor ?? null,\n      foregroundColor: cal.foregroundColor ?? null,\n    }))\n    : []\n  return {\n    count: calendars.length,\n    nextPageToken: data?.nextPageToken ?? null,\n    nextSyncToken: data?.nextSyncToken ?? null,\n    note: 'Use calendar id with get_calendar for full calendar details.',\n    calendars,\n  }\n}",
        "scope": "read",
        "toolset": "events"
      },
      {
        "name": "get_calendar",
        "description": "Get details for a specific calendar by ID, including its summary, description, timezone, and access role. Use list_calendars to find calendar IDs.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "calendarId": {
              "type": "string",
              "description": "Calendar ID (use 'primary' for primary)."
            }
          },
          "required": [
            "calendarId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/calendars/${encodeURIComponent(input.calendarId)}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "events"
      },
      {
        "name": "list_events",
        "description": "List events in a calendar with optional time range, text search, and pagination. Use calendarId='primary' for the user's main calendar. Set singleEvents=true and orderBy='startTime' to get recurring events expanded into individual instances in chronological order. Times must be RFC3339 format (e.g. '2024-01-15T09:00:00Z' or '2024-01-15T09:00:00-05:00'). Defaults to 25 results. Use pageToken from the response for the next page.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "calendarId": {
              "type": "string",
              "description": "Calendar ID. Use 'primary' for the user's main calendar. Find other calendar IDs via list_calendars."
            },
            "timeMin": {
              "type": "string",
              "description": "Start of the time range (RFC3339 format, e.g. '2024-01-15T00:00:00Z' or '2024-01-15T09:00:00-05:00'). Only events ending after this time are returned."
            },
            "timeMax": {
              "type": "string",
              "description": "End of the time range (RFC3339 format). Only events starting before this time are returned."
            },
            "q": {
              "type": "string",
              "description": "Free-text search query matching event summary, description, location, and attendee details."
            },
            "maxResults": {
              "type": "integer",
              "minimum": 1,
              "maximum": 2500,
              "default": 25,
              "description": "Maximum number of events to return. Defaults to 25. Use pageToken from the response for the next page."
            },
            "pageToken": {
              "type": "string",
              "description": "Page token from a previous list_events response to retrieve the next page of results."
            },
            "singleEvents": {
              "type": "boolean",
              "description": "Expand recurring events into individual instances. Set to true with orderBy='startTime' to get events in chronological order."
            },
            "orderBy": {
              "type": "string",
              "enum": [
                "startTime",
                "updated"
              ],
              "description": "Sort order. 'startTime' requires singleEvents=true. 'updated' sorts by last modification time."
            },
            "fields": {
              "type": "string",
              "description": "Partial response fields selector to reduce response size. Example: 'items(id,summary,start,end,attendees)'. See Calendar API fields reference."
            }
          },
          "required": [
            "calendarId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.timeMin)\n    params.set('timeMin', input.timeMin)\n  if (input.timeMax)\n    params.set('timeMax', input.timeMax)\n  if (input.q)\n    params.set('q', input.q)\n  if (input.maxResults)\n    params.set('maxResults', String(input.maxResults))\n  if (input.pageToken)\n    params.set('pageToken', input.pageToken)\n  if (input.singleEvents !== undefined)\n    params.set('singleEvents', String(input.singleEvents))\n  if (input.orderBy)\n    params.set('orderBy', input.orderBy)\n  if (input.fields)\n    params.set('fields', input.fields)\n  const qs = params.toString()\n  const path = `/calendars/${encodeURIComponent(input.calendarId)}/events${qs ? `?${qs}` : ''}`\n  const res = await integration.fetch(path)\n  const data = await res.json()\n  const events = Array.isArray(data?.items)\n    ? data.items.map(event => ({\n      id: event.id ?? null,\n      iCalUID: event.iCalUID ?? null,\n      status: event.status ?? null,\n      summary: event.summary ?? null,\n      start: event.start?.dateTime ?? event.start?.date ?? null,\n      end: event.end?.dateTime ?? event.end?.date ?? null,\n      updated: event.updated ?? null,\n      recurringEventId: event.recurringEventId ?? null,\n      organizerEmail: event.organizer?.email ?? null,\n      htmlLink: event.htmlLink ?? null,\n    }))\n    : []\n  return {\n    calendarId: input.calendarId,\n    count: events.length,\n    nextPageToken: data?.nextPageToken ?? null,\n    nextSyncToken: data?.nextSyncToken ?? null,\n    note: 'Use event id with get_event for full event details.',\n    events,\n  }\n}",
        "scope": "read",
        "toolset": "events"
      },
      {
        "name": "get_event",
        "description": "Get a specific event by its ID from a calendar. Returns full event details including summary, start, end, attendees, location, description, recurrence, and status. Use list_events to find event IDs.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "calendarId": {
              "type": "string",
              "description": "Calendar ID. Use 'primary' for the user's main calendar."
            },
            "eventId": {
              "type": "string",
              "description": "Event ID. Obtained from list_events results."
            },
            "fields": {
              "type": "string",
              "description": "Partial response fields selector to reduce response size. Example: 'id,summary,start,end,attendees'."
            }
          },
          "required": [
            "calendarId",
            "eventId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.fields)\n    params.set('fields', input.fields)\n  const qs = params.toString()\n  const path = `/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}${qs ? `?${qs}` : ''}`\n  const res = await integration.fetch(path)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "events"
      },
      {
        "name": "list_colors",
        "description": "Get the set of color definitions available for calendars and events. Returns colorId values and their hex codes. Use colorId values in create_event or patch_event to color-code events.",
        "inputSchema": {},
        "handlerCode": "async (input) => {\n  const res = await integration.fetch('/colors')\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "events"
      },
      {
        "name": "freebusy_query",
        "description": "Query free/busy availability for one or more calendars within a time range. Useful for finding open slots or checking if attendees are available. Provide timeMin, timeMax (RFC3339), and an items array of calendar IDs. Returns busy time blocks for each calendar.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "timeMin": {
              "type": "string"
            },
            "timeMax": {
              "type": "string"
            },
            "items": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string"
                  }
                },
                "required": [
                  "id"
                ],
                "additionalProperties": false
              }
            }
          },
          "required": [
            "timeMin",
            "timeMax",
            "items"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch('/freeBusy', { method: 'POST', body: input })\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "events"
      },
      {
        "name": "list_settings",
        "description": "List the authenticated user's Google Calendar settings, such as timezone, date format, and notification preferences.",
        "inputSchema": {},
        "handlerCode": "async (input) => {\n  const res = await integration.fetch('/users/me/settings')\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "events"
      },
      {
        "name": "create_event",
        "description": "Create a new event in a calendar. Required fields: calendarId, summary, start, end. Use {dateTime, timeZone} for timed events (e.g. {\"dateTime\": \"2024-01-15T10:00:00\", \"timeZone\": \"America/New_York\"}) or {date} for all-day events (e.g. {\"date\": \"2024-01-15\"}). Optional fields: description, location, attendees (array of {email}), recurrence (RRULE strings), reminders, colorId, visibility. The calendarId field is extracted automatically; all other fields are sent as the event body.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "calendarId": {
              "type": "string"
            },
            "summary": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "location": {
              "type": "string"
            },
            "start": {
              "type": "object",
              "properties": {
                "date": {
                  "type": "string"
                },
                "dateTime": {
                  "type": "string"
                },
                "timeZone": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            },
            "end": {
              "type": "object",
              "properties": {
                "date": {
                  "type": "string"
                },
                "dateTime": {
                  "type": "string"
                },
                "timeZone": {
                  "type": "string"
                }
              },
              "additionalProperties": true
            },
            "attendees": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "email": {
                    "type": "string"
                  }
                },
                "additionalProperties": true
              }
            },
            "conferenceData": {
              "type": "object"
            }
          },
          "required": [
            "calendarId",
            "start",
            "end"
          ],
          "additionalProperties": true
        },
        "handlerCode": "async (input) => {\n  const { calendarId, ...body } = input\n  const path = `/calendars/${encodeURIComponent(calendarId)}/events`\n  const res = await integration.fetch(path, { method: 'POST', body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "events"
      },
      {
        "name": "patch_event",
        "description": "Partially update an event by providing only the fields to change. All other fields are preserved. Use this as the standard event update method. Provide changes in a 'body' object along with calendarId and eventId.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "calendarId": {
              "type": "string"
            },
            "eventId": {
              "type": "string"
            },
            "body": {
              "type": "object"
            }
          },
          "required": [
            "calendarId",
            "eventId",
            "body"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const path = `/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`\n  const res = await integration.fetch(path, { method: 'PATCH', body: input.body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "events"
      },
      {
        "name": "delete_event",
        "description": "Delete an event from a calendar. This permanently removes the event. For recurring events, this deletes only the specified instance. Use list_events to find event IDs.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "calendarId": {
              "type": "string",
              "description": "Calendar ID. Use 'primary' for the user's main calendar."
            },
            "eventId": {
              "type": "string",
              "description": "Event ID. Obtained from list_events results."
            },
            "fields": {
              "type": "string",
              "description": "Partial response fields selector to reduce response size. Example: 'id,summary,start,end,attendees'."
            }
          },
          "required": [
            "calendarId",
            "eventId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const path = `/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}`\n  const res = await integration.fetch(path, { method: 'DELETE' })\n  // Google Calendar delete returns 204 No Content, but proxy returns Response; handle empty body\n  try { return await res.json() }\n  catch { return { success: true } }\n}",
        "scope": "write",
        "toolset": "events"
      },
      {
        "name": "move_event",
        "description": "Move an event from one calendar to another. Provide the source calendarId, eventId, and the destination calendarId. Returns the updated event in the destination calendar.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "calendarId": {
              "type": "string"
            },
            "eventId": {
              "type": "string"
            },
            "destination": {
              "type": "string",
              "description": "Destination calendarId"
            }
          },
          "required": [
            "calendarId",
            "eventId",
            "destination"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams({ destination: input.destination })\n  const path = `/calendars/${encodeURIComponent(input.calendarId)}/events/${encodeURIComponent(input.eventId)}/move?${params.toString()}`\n  const res = await integration.fetch(path, { method: 'POST' })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "events"
      },
      {
        "name": "quick_add",
        "description": "Create an event using a natural language text string. Parses the text to extract event details automatically. Examples: 'Meeting with Bob tomorrow at 3pm for 1 hour', 'Dentist appointment on Friday at 2pm', 'Weekly standup every Monday at 9am'. Requires calendarId (use 'primary') and text.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "calendarId": {
              "type": "string"
            },
            "text": {
              "type": "string",
              "description": "Natural language event text"
            }
          },
          "required": [
            "calendarId",
            "text"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams({ text: input.text })\n  const path = `/calendars/${encodeURIComponent(input.calendarId)}/events/quickAdd?${params.toString()}`\n  const res = await integration.fetch(path, { method: 'POST' })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "events"
      },
      {
        "name": "list_acl",
        "description": "List the Access Control List (ACL) rules for a calendar. Returns rules defining who has access and at what permission level (reader, writer, owner). Use get_calendar to find the calendarId.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "calendarId": {
              "type": "string",
              "description": "Calendar ID (use 'primary' for primary)."
            }
          },
          "required": [
            "calendarId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const path = `/calendars/${encodeURIComponent(input.calendarId)}/acl`\n  const res = await integration.fetch(path)\n  return await res.json()\n}",
        "scope": "admin",
        "toolset": "sharing"
      },
      {
        "name": "get_acl",
        "description": "Get a specific ACL rule by its rule ID for a calendar. Use list_acl to find rule IDs.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "calendarId": {
              "type": "string"
            },
            "ruleId": {
              "type": "string"
            }
          },
          "required": [
            "calendarId",
            "ruleId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const path = `/calendars/${encodeURIComponent(input.calendarId)}/acl/${encodeURIComponent(input.ruleId)}`\n  const res = await integration.fetch(path)\n  return await res.json()\n}",
        "scope": "admin",
        "toolset": "sharing"
      },
      {
        "name": "insert_acl",
        "description": "Add a new ACL rule to grant a user or group access to a calendar. Roles: 'reader' (view), 'writer' (view + edit events), 'owner' (full control). Scope must include type ('user', 'group', 'domain', or 'default') and optionally value (email or domain).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "calendarId": {
              "type": "string"
            },
            "role": {
              "type": "string",
              "enum": [
                "none",
                "freeBusyReader",
                "reader",
                "writer",
                "owner"
              ]
            },
            "scope": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string",
                  "enum": [
                    "default",
                    "user",
                    "group",
                    "domain"
                  ]
                },
                "value": {
                  "type": "string"
                }
              },
              "required": [
                "type"
              ],
              "additionalProperties": false
            }
          },
          "required": [
            "calendarId",
            "role",
            "scope"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { calendarId, ...body } = input\n  const path = `/calendars/${encodeURIComponent(calendarId)}/acl`\n  const res = await integration.fetch(path, { method: 'POST', body })\n  return await res.json()\n}",
        "scope": "admin",
        "toolset": "sharing"
      },
      {
        "name": "update_acl",
        "description": "Update an existing ACL rule to change a user's or group's permission level on a calendar. Use list_acl to find the rule ID.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "calendarId": {
              "type": "string"
            },
            "ruleId": {
              "type": "string"
            },
            "role": {
              "type": "string",
              "enum": [
                "none",
                "freeBusyReader",
                "reader",
                "writer",
                "owner"
              ]
            }
          },
          "required": [
            "calendarId",
            "ruleId",
            "role"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { calendarId, ruleId, role } = input\n  const body = { role }\n  const path = `/calendars/${encodeURIComponent(calendarId)}/acl/${encodeURIComponent(ruleId)}`\n  const res = await integration.fetch(path, { method: 'PUT', body })\n  return await res.json()\n}",
        "scope": "admin",
        "toolset": "sharing"
      },
      {
        "name": "delete_acl",
        "description": "Remove an ACL rule from a calendar, revoking the associated user's or group's access. Use list_acl to find the rule ID.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "calendarId": {
              "type": "string"
            },
            "ruleId": {
              "type": "string"
            }
          },
          "required": [
            "calendarId",
            "ruleId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const path = `/calendars/${encodeURIComponent(input.calendarId)}/acl/${encodeURIComponent(input.ruleId)}`\n  const res = await integration.fetch(path, { method: 'DELETE' })\n  try { return await res.json() }\n  catch { return { success: true } }\n}",
        "scope": "admin",
        "toolset": "sharing"
      }
    ]
  },
  "google-gmail": {
    "manifest": {
      "name": "google-gmail",
      "version": "0.1.0",
      "baseUrl": "https://gmail.googleapis.com/gmail/v1",
      "toolsets": {
        "email": {
          "label": "Email",
          "description": "Search, read, compose, and send emails and drafts"
        },
        "organize": {
          "label": "Organize",
          "description": "Label, archive, trash, and delete messages and threads"
        }
      },
      "tools": [
        {
          "name": "get_profile",
          "description": "Get mailbox profile details for the authenticated user, including email address, messages total, threads total, and history ID. Useful for confirming the active account.",
          "inputSchema": "schemas/get_profile.json",
          "handler": "handlers/get_profile.js",
          "scope": "read",
          "toolset": "email"
        },
        {
          "name": "list_messages",
          "description": "List message IDs matching a Gmail search query or label filters. Returns only IDs and threadIds, not full content -- use read_email or get_message to fetch content for specific messages. Supports Gmail query operators: 'is:unread', 'from:user@example.com', 'to:user@example.com', 'subject:keyword', 'has:attachment', 'after:2024/01/01', 'before:2024/12/31', 'newer_than:7d', 'label:INBOX', 'in:sent'. Defaults to 20 results. Use pageToken from the response for the next page.",
          "inputSchema": "schemas/list_messages.json",
          "handler": "handlers/list_messages.js",
          "scope": "read",
          "toolset": "email"
        },
        {
          "name": "read_email",
          "description": "Read an email by message ID and return a flat, decoded result with subject, from, to, cc, date, snippet, body text, labelIds, and threadId. Use this for reading email content -- it handles base64 decoding and header extraction automatically. For raw API access or advanced format options, use get_message instead.",
          "inputSchema": "schemas/read_email.json",
          "handler": "handlers/read_email.js",
          "scope": "read",
          "toolset": "email"
        },
        {
          "name": "get_message",
          "description": "Get the raw Gmail message resource by message ID. Returns the full nested payload including base64url-encoded body parts and all headers. For most use cases, prefer read_email which decodes the response into a flat readable format. Use format='minimal' for lightweight ID+threadId+labelIds only, format='metadata' with metadataHeaders for specific headers only.",
          "inputSchema": "schemas/get_message.json",
          "handler": "handlers/get_message.js",
          "scope": "read",
          "toolset": "email"
        },
        {
          "name": "list_threads",
          "description": "List thread IDs matching a Gmail search query or label filters. Similar to list_messages but grouped by conversation thread. Returns only IDs -- use get_thread to fetch full thread content. Supports the same Gmail query operators as list_messages. Defaults to 20 results. Use pageToken from the response for the next page.",
          "inputSchema": "schemas/list_threads.json",
          "handler": "handlers/list_threads.js",
          "scope": "read",
          "toolset": "email"
        },
        {
          "name": "get_thread",
          "description": "Get a full thread resource by thread ID, including all messages in the conversation. Use list_threads to find thread IDs. Use format='minimal' to get only message IDs within the thread without full content.",
          "inputSchema": "schemas/get_thread.json",
          "handler": "handlers/get_thread.js",
          "scope": "read",
          "toolset": "email"
        },
        {
          "name": "list_drafts",
          "description": "List drafts in the mailbox. Returns draft IDs and the nested message ID. Use get_draft to fetch full draft content. Defaults to 20 results. Use pageToken for the next page.",
          "inputSchema": "schemas/list_drafts.json",
          "handler": "handlers/list_drafts.js",
          "scope": "read",
          "toolset": "email"
        },
        {
          "name": "get_draft",
          "description": "Get a draft by draft ID. Returns the draft object including the nested message resource. Use list_drafts to find draft IDs.",
          "inputSchema": "schemas/id_draft.json",
          "handler": "handlers/get_draft.js",
          "scope": "read",
          "toolset": "email"
        },
        {
          "name": "send_email",
          "description": "Send an email by providing flat fields: to, subject, and body. Handles MIME encoding and base64url conversion internally. For replies, provide replyToMessageId (the original message's ID) and threadId to keep the reply in the same conversation thread. Supports plain text and HTML bodies, CC, and BCC.",
          "inputSchema": "schemas/send_email.json",
          "handler": "handlers/send_email.js",
          "scope": "write",
          "toolset": "email"
        },
        {
          "name": "create_draft_email",
          "description": "Create a draft email using flat fields: subject, body, and optionally to, cc, bcc. Handles MIME encoding internally. The draft is saved but not sent -- use send_draft to send it later. For replies, provide replyToMessageId and threadId. Supports plain text and HTML bodies.",
          "inputSchema": "schemas/create_draft_email.json",
          "handler": "handlers/create_draft_email.js",
          "scope": "write",
          "toolset": "email"
        },
        {
          "name": "delete_draft",
          "description": "Permanently delete a draft by its draft ID. Use list_drafts to find draft IDs. This cannot be undone.",
          "inputSchema": "schemas/id_draft.json",
          "handler": "handlers/delete_draft.js",
          "scope": "write",
          "toolset": "email"
        },
        {
          "name": "send_draft",
          "description": "Send an existing draft by draft ID, or send a one-off draft payload (provide raw instead of draftId). One of draftId or raw must be provided. To send a previously created draft, provide only draftId. To send a new message without saving first, use send_email instead.",
          "inputSchema": "schemas/send_draft.json",
          "handler": "handlers/send_draft.js",
          "scope": "write",
          "toolset": "email"
        },
        {
          "name": "list_labels",
          "description": "List all labels in the user's mailbox, including system labels (INBOX, SENT, DRAFT, SPAM, TRASH, STARRED, IMPORTANT, UNREAD) and user-created labels. Returns label IDs needed for filtering in list_messages and list_threads.",
          "inputSchema": "schemas/list_labels.json",
          "handler": "handlers/list_labels.js",
          "scope": "read",
          "toolset": "organize"
        },
        {
          "name": "get_label",
          "description": "Get details for a specific label by its label ID. Returns name, type, visibility settings, and message/thread counts. Use list_labels first to find the label ID.",
          "inputSchema": "schemas/id_label.json",
          "handler": "handlers/get_label.js",
          "scope": "read",
          "toolset": "organize"
        },
        {
          "name": "modify_message",
          "description": "Add or remove labels on a single message. Provide addLabelIds, removeLabelIds, or both. Common label IDs: 'INBOX', 'UNREAD', 'STARRED', 'IMPORTANT', 'TRASH', 'SPAM'. To archive a message, remove 'INBOX'. To mark as read, remove 'UNREAD'. Use list_labels to find custom label IDs.",
          "inputSchema": "schemas/modify_message.json",
          "handler": "handlers/modify_message.js",
          "scope": "write",
          "toolset": "organize"
        },
        {
          "name": "trash_message",
          "description": "Move a message to the Trash. The message is not permanently deleted and can be restored with untrash_message. To permanently delete, use delete_message.",
          "inputSchema": "schemas/id_message.json",
          "handler": "handlers/trash_message.js",
          "scope": "write",
          "toolset": "organize"
        },
        {
          "name": "untrash_message",
          "description": "Restore a message from Trash back to the Inbox. Use list_messages with labelIds=['TRASH'] to find trashed message IDs.",
          "inputSchema": "schemas/id_message.json",
          "handler": "handlers/untrash_message.js",
          "scope": "write",
          "toolset": "organize"
        },
        {
          "name": "delete_message",
          "description": "Permanently and immediately delete a message by ID. This cannot be undone. For recoverable deletion, use trash_message instead.",
          "inputSchema": "schemas/id_message.json",
          "handler": "handlers/delete_message.js",
          "scope": "write",
          "toolset": "organize"
        },
        {
          "name": "modify_thread",
          "description": "Add or remove labels on all messages in a thread at once. Provide addLabelIds, removeLabelIds, or both. Common label IDs: 'INBOX', 'UNREAD', 'STARRED', 'IMPORTANT'. To archive a thread, remove 'INBOX'. Use list_labels to find custom label IDs.",
          "inputSchema": "schemas/modify_thread.json",
          "handler": "handlers/modify_thread.js",
          "scope": "write",
          "toolset": "organize"
        },
        {
          "name": "trash_thread",
          "description": "Move an entire thread to Trash. All messages in the thread are trashed. Can be reversed with untrash_thread.",
          "inputSchema": "schemas/id_thread.json",
          "handler": "handlers/trash_thread.js",
          "scope": "write",
          "toolset": "organize"
        },
        {
          "name": "untrash_thread",
          "description": "Restore an entire thread from Trash. Use list_threads with labelIds=['TRASH'] to find trashed thread IDs.",
          "inputSchema": "schemas/id_thread.json",
          "handler": "handlers/untrash_thread.js",
          "scope": "write",
          "toolset": "organize"
        },
        {
          "name": "delete_thread",
          "description": "Permanently and immediately delete an entire thread and all its messages. This cannot be undone. For recoverable deletion, use trash_thread instead.",
          "inputSchema": "schemas/id_thread.json",
          "handler": "handlers/delete_thread.js",
          "scope": "write",
          "toolset": "organize"
        },
        {
          "name": "create_label",
          "description": "Create a new mailbox label with optional visibility and color settings. Label names must be unique. After creating a label, use its returned ID with modify_message or modify_thread to apply it.",
          "inputSchema": "schemas/create_label.json",
          "handler": "handlers/create_label.js",
          "scope": "admin",
          "toolset": "organize"
        },
        {
          "name": "update_label",
          "description": "Update (patch) an existing mailbox label's name, color, or visibility settings by label ID. Use list_labels to find label IDs.",
          "inputSchema": "schemas/update_label.json",
          "handler": "handlers/update_label.js",
          "scope": "admin",
          "toolset": "organize"
        },
        {
          "name": "delete_label",
          "description": "Permanently delete a mailbox label by label ID. Messages with this label will have it removed but will not be deleted. Use list_labels to find label IDs. System labels (INBOX, SENT, etc.) cannot be deleted.",
          "inputSchema": "schemas/id_label.json",
          "handler": "handlers/delete_label.js",
          "scope": "admin",
          "toolset": "organize"
        }
      ]
    },
    "prompt": "## Gmail search query syntax\n\nGmail's `q` parameter supports a powerful search language. Key operators:\n\n- `is:unread` / `is:read` — filter by read status\n- `is:starred`, `is:important` — filter by markers\n- `from:user@example.com` — sender filter\n- `to:user@example.com`, `cc:user@example.com` — recipient filters\n- `subject:keyword` — subject line search\n- `has:attachment` — messages with attachments\n- `filename:report.pdf` — specific attachment filename\n- `label:INBOX` — filter by label (use label name or ID)\n- `after:2024/01/01`, `before:2024/12/31` — date range (YYYY/MM/DD)\n- `newer_than:7d`, `older_than:1y` — relative time (d=days, m=months, y=years)\n- `in:sent`, `in:drafts`, `in:trash`, `in:spam` — folder filters\n- `larger:5M`, `smaller:1M` — size filters\n\nCombine operators with spaces (implicit AND): `from:alice is:unread has:attachment`\n\n## Recommended workflows\n\n**Reading emails:**\n1. Use `list_messages` with a `q` query to find relevant message IDs\n2. Use `read_email` on each ID to get decoded subject, from, to, date, and body text\n3. For raw access or advanced format options, use `get_message` with `format='full'`\n\n**Searching for threads:**\n1. Use `list_threads` with `q` to find conversation threads\n2. Use `get_thread` to retrieve all messages in a conversation at once\n\n**Sending email:**\n- Use `send_email` for the vast majority of cases -- it accepts plain `to`, `subject`, `body` fields\n- Use `create_draft_email` + `send_draft` when you want to create a draft for review before sending\n\n**Replying to an email:**\n1. Get the original message with `read_email` to obtain its `threadId` and `id`\n2. Call `send_email` with `replyToMessageId` = original message `id` and `threadId` = original `threadId`\n3. The reply will appear in the same conversation thread\n\n## Label IDs\n\nSystem label IDs (always uppercase): `INBOX`, `UNREAD`, `STARRED`, `IMPORTANT`, `SENT`, `DRAFT`, `SPAM`, `TRASH`, `CATEGORY_PERSONAL`, `CATEGORY_SOCIAL`, `CATEGORY_PROMOTIONS`, `CATEGORY_UPDATES`, `CATEGORY_FORUMS`\n\nUser-created labels have auto-generated IDs. Use `list_labels` to discover them.\n\n## Archiving and organizing\n\n- Archive a message: `modify_message` with `removeLabelIds=['INBOX']`\n- Mark as read: `modify_message` with `removeLabelIds=['UNREAD']`\n- Star a message: `modify_message` with `addLabelIds=['STARRED']`\n- Apply a label: `modify_message` with `addLabelIds=['<labelId>']`\n- Use `modify_thread` to apply the same operation to all messages in a thread at once\n",
    "variants": {
      "variants": {
        "service_account": {
          "label": "Service Account (recommended)",
          "schema": {
            "type": "object",
            "properties": {
              "serviceAccountJson": {
                "type": "string",
                "title": "Service Account JSON",
                "description": "Full service account key JSON (contents of the downloaded JSON file from Google Cloud)."
              },
              "subject": {
                "type": "string",
                "title": "Subject / impersonated user (optional)",
                "description": "User email to impersonate via Google Workspace domain-wide delegation. Usually required for mailbox access."
              },
              "scopes": {
                "type": "array",
                "title": "OAuth scopes (optional)",
                "description": "Optional override for OAuth scopes. Defaults to full Gmail access.",
                "items": {
                  "type": "string"
                }
              }
            },
            "required": [
              "serviceAccountJson"
            ],
            "additionalProperties": false
          },
          "injection": {
            "headers": {
              "Authorization": "Bearer {{token}}"
            }
          },
          "preprocess": "google_service_account",
          "healthCheck": {
            "path": "/users/me/profile"
          }
        },
        "oauth_token": {
          "label": "OAuth Access Token (short-lived)",
          "schema": {
            "type": "object",
            "properties": {
              "token": {
                "type": "string",
                "title": "OAuth Access Token",
                "description": "Short-lived Google OAuth access token with Gmail scopes."
              }
            },
            "required": [
              "token"
            ],
            "additionalProperties": false
          },
          "injection": {
            "headers": {
              "Authorization": "Bearer {{token}}"
            }
          },
          "healthCheck": {
            "path": "/users/me/profile"
          }
        }
      },
      "default": "service_account"
    },
    "hint": null,
    "hintsByVariant": {
      "oauth_token": "Obtain a short-lived Google OAuth access token:\n\n1. Use the Google OAuth 2.0 Playground (`https://developers.google.com/oauthplayground/`) or your own OAuth flow\n2. Select scopes such as `https://www.googleapis.com/auth/gmail.modify` (and `https://www.googleapis.com/auth/gmail.send` if sending mail)\n3. Exchange the authorization code for an access token\n4. Paste the access token here\n\nNote: OAuth access tokens are short-lived (typically 1 hour). For long-running automation, prefer the Service Account variant with Workspace delegation.",
      "service_account": "Set up a Google Cloud Service Account:\n\n1. Open the [Google Cloud Console](https://console.cloud.google.com/)\n2. Enable the **Gmail API** for your project\n3. Go to **IAM & Admin -> Service Accounts** and create a new service account\n4. Under **Keys**, click **Add Key -> Create new key -> JSON** and download the file\n5. Paste the full contents of the JSON file here\n6. For Google Workspace mailboxes, configure domain-wide delegation and set `subject` to the target user's email\n\nFor personal Gmail accounts, use the OAuth token variant instead."
    },
    "tools": [
      {
        "name": "get_profile",
        "description": "Get mailbox profile details for the authenticated user, including email address, messages total, threads total, and history ID. Useful for confirming the active account.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or the special value 'me'. Defaults to 'me'."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const res = await integration.fetch(`/users/${userId}/profile`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "email"
      },
      {
        "name": "list_messages",
        "description": "List message IDs matching a Gmail search query or label filters. Returns only IDs and threadIds, not full content -- use read_email or get_message to fetch content for specific messages. Supports Gmail query operators: 'is:unread', 'from:user@example.com', 'to:user@example.com', 'subject:keyword', 'has:attachment', 'after:2024/01/01', 'before:2024/12/31', 'newer_than:7d', 'label:INBOX', 'in:sent'. Defaults to 20 results. Use pageToken from the response for the next page.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "q": {
              "type": "string",
              "description": "Gmail search query. Supported operators: 'is:unread', 'is:read', 'from:user@example.com', 'to:user@example.com', 'subject:keyword', 'has:attachment', 'label:INBOX', 'after:2024/01/01', 'before:2024/12/31', 'newer_than:7d', 'older_than:1y', 'in:sent', 'in:drafts'. Combine operators with spaces (implicit AND) or use OR/NOT."
            },
            "labelIds": {
              "type": "array",
              "description": "Filter to messages with all of these label IDs applied. Common IDs: 'INBOX', 'UNREAD', 'STARRED', 'SENT', 'DRAFT', 'SPAM', 'TRASH'. Use list_labels for custom label IDs.",
              "items": {
                "type": "string"
              }
            },
            "maxResults": {
              "type": "integer",
              "minimum": 1,
              "maximum": 500,
              "default": 20,
              "description": "Maximum number of messages to return. Defaults to 20. Use pageToken from the response for the next page of results."
            },
            "pageToken": {
              "type": "string",
              "description": "Page token from a previous list_messages response. Pass this to retrieve the next page."
            },
            "includeSpamTrash": {
              "type": "boolean",
              "description": "Include messages from SPAM and TRASH in results. Defaults to false."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const params = new URLSearchParams()\n  if (input.q)\n    params.set('q', input.q)\n  if (Array.isArray(input.labelIds)) {\n    for (const labelId of input.labelIds)\n      params.append('labelIds', String(labelId))\n  }\n  if (input.maxResults !== undefined)\n    params.set('maxResults', String(input.maxResults))\n  if (input.pageToken)\n    params.set('pageToken', input.pageToken)\n  if (input.includeSpamTrash !== undefined)\n    params.set('includeSpamTrash', String(input.includeSpamTrash))\n  const qs = params.toString()\n  const res = await integration.fetch(`/users/${userId}/messages${qs ? `?${qs}` : ''}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "email"
      },
      {
        "name": "read_email",
        "description": "Read an email by message ID and return a flat, decoded result with subject, from, to, cc, date, snippet, body text, labelIds, and threadId. Use this for reading email content -- it handles base64 decoding and header extraction automatically. For raw API access or advanced format options, use get_message instead.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "messageId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email or 'me'. Defaults to 'me'."
            },
            "messageId": {
              "type": "string",
              "description": "Gmail message ID. Obtain from list_messages or search results."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const messageId = encodeURIComponent(input.messageId)\n  const res = await integration.fetch(`/users/${userId}/messages/${messageId}?format=full`)\n  const msg = await res.json()\n\n  const getHeader = (name) => {\n    const h = (msg.payload?.headers || []).find(h => h.name.toLowerCase() === name.toLowerCase())\n    return h?.value || ''\n  }\n\n  const decodeBase64url = (data) => {\n    if (!data) return ''\n    try {\n      return decodeURIComponent(escape(atob(data.replace(/-/g, '+').replace(/_/g, '/'))))\n    }\n    catch {\n      return ''\n    }\n  }\n\n  // Recursively extract text body, preferring text/plain over text/html\n  const extractBody = (part) => {\n    if (!part) return ''\n    if (part.mimeType === 'text/plain' && part.body?.data)\n      return decodeBase64url(part.body.data)\n    if (part.parts) {\n      // Depth-first: try text/plain first across all parts\n      for (const p of part.parts) {\n        if (p.mimeType === 'text/plain' && p.body?.data)\n          return decodeBase64url(p.body.data)\n      }\n      // Recurse into nested multipart\n      for (const p of part.parts) {\n        const text = extractBody(p)\n        if (text) return text\n      }\n    }\n    if (part.mimeType === 'text/html' && part.body?.data)\n      return decodeBase64url(part.body.data)\n    return ''\n  }\n\n  return {\n    id: msg.id,\n    threadId: msg.threadId,\n    labelIds: msg.labelIds || [],\n    subject: getHeader('Subject'),\n    from: getHeader('From'),\n    to: getHeader('To'),\n    cc: getHeader('Cc'),\n    date: getHeader('Date'),\n    snippet: msg.snippet || '',\n    body: extractBody(msg.payload),\n  }\n}",
        "scope": "read",
        "toolset": "email"
      },
      {
        "name": "get_message",
        "description": "Get the raw Gmail message resource by message ID. Returns the full nested payload including base64url-encoded body parts and all headers. For most use cases, prefer read_email which decodes the response into a flat readable format. Use format='minimal' for lightweight ID+threadId+labelIds only, format='metadata' with metadataHeaders for specific headers only.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "messageId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "messageId": {
              "type": "string",
              "description": "Gmail message ID."
            },
            "format": {
              "type": "string",
              "enum": [
                "minimal",
                "full",
                "raw",
                "metadata"
              ],
              "description": "Message format. Defaults to full."
            },
            "metadataHeaders": {
              "type": "array",
              "description": "Headers to include when format is metadata.",
              "items": {
                "type": "string"
              }
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const messageId = encodeURIComponent(input.messageId)\n  const params = new URLSearchParams()\n  if (input.format)\n    params.set('format', input.format)\n  if (Array.isArray(input.metadataHeaders)) {\n    for (const header of input.metadataHeaders)\n      params.append('metadataHeaders', String(header))\n  }\n  const qs = params.toString()\n  const res = await integration.fetch(`/users/${userId}/messages/${messageId}${qs ? `?${qs}` : ''}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "email"
      },
      {
        "name": "list_threads",
        "description": "List thread IDs matching a Gmail search query or label filters. Similar to list_messages but grouped by conversation thread. Returns only IDs -- use get_thread to fetch full thread content. Supports the same Gmail query operators as list_messages. Defaults to 20 results. Use pageToken from the response for the next page.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "q": {
              "type": "string",
              "description": "Gmail search query. Supported operators: 'is:unread', 'from:user@example.com', 'to:user@example.com', 'subject:keyword', 'has:attachment', 'after:2024/01/01', 'newer_than:7d', 'label:INBOX'. Same syntax as list_messages."
            },
            "labelIds": {
              "type": "array",
              "description": "Filter to threads where all messages have these label IDs. Common IDs: 'INBOX', 'UNREAD', 'STARRED', 'SENT'. Use list_labels for custom label IDs.",
              "items": {
                "type": "string"
              }
            },
            "maxResults": {
              "type": "integer",
              "minimum": 1,
              "maximum": 500,
              "default": 20,
              "description": "Maximum number of threads to return. Defaults to 20. Use pageToken from the response for the next page of results."
            },
            "pageToken": {
              "type": "string",
              "description": "Page token from a previous list_threads response. Pass this to retrieve the next page."
            },
            "includeSpamTrash": {
              "type": "boolean",
              "description": "Include threads from SPAM and TRASH in results. Defaults to false."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const params = new URLSearchParams()\n  if (input.q)\n    params.set('q', input.q)\n  if (Array.isArray(input.labelIds)) {\n    for (const labelId of input.labelIds)\n      params.append('labelIds', String(labelId))\n  }\n  if (input.maxResults !== undefined)\n    params.set('maxResults', String(input.maxResults))\n  if (input.pageToken)\n    params.set('pageToken', input.pageToken)\n  if (input.includeSpamTrash !== undefined)\n    params.set('includeSpamTrash', String(input.includeSpamTrash))\n  const qs = params.toString()\n  const res = await integration.fetch(`/users/${userId}/threads${qs ? `?${qs}` : ''}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "email"
      },
      {
        "name": "get_thread",
        "description": "Get a full thread resource by thread ID, including all messages in the conversation. Use list_threads to find thread IDs. Use format='minimal' to get only message IDs within the thread without full content.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "threadId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "threadId": {
              "type": "string",
              "description": "Gmail thread ID."
            },
            "format": {
              "type": "string",
              "enum": [
                "minimal",
                "full",
                "metadata"
              ],
              "description": "Thread message format. Defaults to full."
            },
            "metadataHeaders": {
              "type": "array",
              "description": "Headers to include when format is metadata.",
              "items": {
                "type": "string"
              }
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const threadId = encodeURIComponent(input.threadId)\n  const params = new URLSearchParams()\n  if (input.format)\n    params.set('format', input.format)\n  if (Array.isArray(input.metadataHeaders)) {\n    for (const header of input.metadataHeaders)\n      params.append('metadataHeaders', String(header))\n  }\n  const qs = params.toString()\n  const res = await integration.fetch(`/users/${userId}/threads/${threadId}${qs ? `?${qs}` : ''}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "email"
      },
      {
        "name": "list_drafts",
        "description": "List drafts in the mailbox. Returns draft IDs and the nested message ID. Use get_draft to fetch full draft content. Defaults to 20 results. Use pageToken for the next page.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "q": {
              "type": "string",
              "description": "Gmail search query to filter drafts. Supports the same operators as list_messages: 'subject:keyword', 'to:user@example.com', etc."
            },
            "maxResults": {
              "type": "integer",
              "minimum": 1,
              "maximum": 500,
              "default": 20,
              "description": "Maximum number of drafts to return. Defaults to 20. Use pageToken from the response for the next page."
            },
            "pageToken": {
              "type": "string",
              "description": "Page token from a previous list_drafts response. Pass this to retrieve the next page."
            },
            "includeSpamTrash": {
              "type": "boolean",
              "description": "Include drafts from SPAM and TRASH in results. Defaults to false."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const params = new URLSearchParams()\n  if (input.q)\n    params.set('q', input.q)\n  if (input.maxResults !== undefined)\n    params.set('maxResults', String(input.maxResults))\n  if (input.pageToken)\n    params.set('pageToken', input.pageToken)\n  if (input.includeSpamTrash !== undefined)\n    params.set('includeSpamTrash', String(input.includeSpamTrash))\n  const qs = params.toString()\n  const res = await integration.fetch(`/users/${userId}/drafts${qs ? `?${qs}` : ''}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "email"
      },
      {
        "name": "get_draft",
        "description": "Get a draft by draft ID. Returns the draft object including the nested message resource. Use list_drafts to find draft IDs.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "draftId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "draftId": {
              "type": "string",
              "description": "Gmail draft ID."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const draftId = encodeURIComponent(input.draftId)\n  const res = await integration.fetch(`/users/${userId}/drafts/${draftId}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "email"
      },
      {
        "name": "send_email",
        "description": "Send an email by providing flat fields: to, subject, and body. Handles MIME encoding and base64url conversion internally. For replies, provide replyToMessageId (the original message's ID) and threadId to keep the reply in the same conversation thread. Supports plain text and HTML bodies, CC, and BCC.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "to",
            "subject",
            "body"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email or 'me'. Defaults to 'me'."
            },
            "to": {
              "type": "string",
              "description": "Recipient email address. Use comma-separated values for multiple recipients (e.g. 'alice@example.com, bob@example.com')."
            },
            "cc": {
              "type": "string",
              "description": "CC recipients, comma-separated."
            },
            "bcc": {
              "type": "string",
              "description": "BCC recipients, comma-separated."
            },
            "subject": {
              "type": "string",
              "description": "Email subject line."
            },
            "body": {
              "type": "string",
              "description": "Plain text email body. Required unless htmlBody is provided."
            },
            "htmlBody": {
              "type": "string",
              "description": "HTML email body. If provided, takes precedence over body and the email is sent as text/html."
            },
            "replyToMessageId": {
              "type": "string",
              "description": "Message ID of the email being replied to. Sets the In-Reply-To header for proper threading. Use with threadId."
            },
            "threadId": {
              "type": "string",
              "description": "Thread ID to add this message to. Required when replying so the reply appears in the same conversation."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const lines = [`To: ${input.to}`, `Subject: ${input.subject}`]\n  if (input.cc) lines.push(`Cc: ${input.cc}`)\n  if (input.bcc) lines.push(`Bcc: ${input.bcc}`)\n  if (input.replyToMessageId) lines.push(`In-Reply-To: ${input.replyToMessageId}`)\n  lines.push('MIME-Version: 1.0')\n  if (input.htmlBody) {\n    lines.push('Content-Type: text/html; charset=UTF-8')\n    lines.push('', input.htmlBody)\n  }\n  else {\n    lines.push('Content-Type: text/plain; charset=UTF-8')\n    lines.push('', input.body)\n  }\n  const mime = lines.join('\\r\\n')\n  const raw = btoa(unescape(encodeURIComponent(mime))).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '')\n  const body = { raw }\n  if (input.threadId) body.threadId = input.threadId\n  const res = await integration.fetch(`/users/${userId}/messages/send`, { method: 'POST', body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "email"
      },
      {
        "name": "create_draft_email",
        "description": "Create a draft email using flat fields: subject, body, and optionally to, cc, bcc. Handles MIME encoding internally. The draft is saved but not sent -- use send_draft to send it later. For replies, provide replyToMessageId and threadId. Supports plain text and HTML bodies.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email or 'me'. Defaults to 'me'."
            },
            "to": {
              "type": "string",
              "description": "Recipient email address. Optional for drafts."
            },
            "cc": {
              "type": "string",
              "description": "CC recipients, comma-separated."
            },
            "bcc": {
              "type": "string",
              "description": "BCC recipients, comma-separated."
            },
            "subject": {
              "type": "string",
              "description": "Draft subject line."
            },
            "body": {
              "type": "string",
              "description": "Plain text draft body. Used when htmlBody is not provided."
            },
            "htmlBody": {
              "type": "string",
              "description": "HTML draft body. If provided, takes precedence over body."
            },
            "replyToMessageId": {
              "type": "string",
              "description": "Message ID being replied to. Sets In-Reply-To header."
            },
            "threadId": {
              "type": "string",
              "description": "Thread ID to place the draft in an existing conversation."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const lines = []\n  if (input.to) lines.push(`To: ${input.to}`)\n  lines.push(`Subject: ${input.subject || ''}`)\n  if (input.cc) lines.push(`Cc: ${input.cc}`)\n  if (input.bcc) lines.push(`Bcc: ${input.bcc}`)\n  if (input.replyToMessageId) lines.push(`In-Reply-To: ${input.replyToMessageId}`)\n  lines.push('MIME-Version: 1.0')\n  if (input.htmlBody) {\n    lines.push('Content-Type: text/html; charset=UTF-8')\n    lines.push('', input.htmlBody)\n  }\n  else {\n    lines.push('Content-Type: text/plain; charset=UTF-8')\n    lines.push('', input.body || '')\n  }\n  const raw = btoa(unescape(encodeURIComponent(lines.join('\\r\\n')))).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '')\n  const message = { raw }\n  if (input.threadId) message.threadId = input.threadId\n\n  const res = await integration.fetch(`/users/${userId}/drafts`, {\n    method: 'POST',\n    body: { message },\n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "email"
      },
      {
        "name": "delete_draft",
        "description": "Permanently delete a draft by its draft ID. Use list_drafts to find draft IDs. This cannot be undone.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "draftId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "draftId": {
              "type": "string",
              "description": "Gmail draft ID."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const draftId = encodeURIComponent(input.draftId)\n  const res = await integration.fetch(`/users/${userId}/drafts/${draftId}`, { method: 'DELETE' })\n  if (res.status === 204)\n    return { success: true }\n  try {\n    return await res.json()\n  }\n  catch {\n    return { success: true }\n  }\n}",
        "scope": "write",
        "toolset": "email"
      },
      {
        "name": "send_draft",
        "description": "Send an existing draft by draft ID, or send a one-off draft payload (provide raw instead of draftId). One of draftId or raw must be provided. To send a previously created draft, provide only draftId. To send a new message without saving first, use send_email instead.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "draftId": {
              "type": "string",
              "description": "Draft ID to send."
            },
            "raw": {
              "type": "string",
              "description": "Optional base64url encoded RFC822 message string for one-off send."
            },
            "threadId": {
              "type": "string",
              "description": "Optional existing thread ID when sending a one-off draft payload."
            },
            "labelIds": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Optional label IDs when sending a one-off draft payload."
            }
          },
          "anyOf": [
            {
              "required": [
                "draftId"
              ]
            },
            {
              "required": [
                "raw"
              ]
            }
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const body = {}\n  if (input.draftId)\n    body.id = input.draftId\n  if (input.raw) {\n    body.message = { raw: input.raw }\n    if (input.threadId)\n      body.message.threadId = input.threadId\n    if (Array.isArray(input.labelIds))\n      body.message.labelIds = input.labelIds\n  }\n  const res = await integration.fetch(`/users/${userId}/drafts/send`, { method: 'POST', body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "email"
      },
      {
        "name": "list_labels",
        "description": "List all labels in the user's mailbox, including system labels (INBOX, SENT, DRAFT, SPAM, TRASH, STARRED, IMPORTANT, UNREAD) and user-created labels. Returns label IDs needed for filtering in list_messages and list_threads.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or the special value 'me'. Defaults to 'me'."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const res = await integration.fetch(`/users/${userId}/labels`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "organize"
      },
      {
        "name": "get_label",
        "description": "Get details for a specific label by its label ID. Returns name, type, visibility settings, and message/thread counts. Use list_labels first to find the label ID.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "labelId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "labelId": {
              "type": "string",
              "description": "Gmail label ID."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const labelId = encodeURIComponent(input.labelId)\n  const res = await integration.fetch(`/users/${userId}/labels/${labelId}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "organize"
      },
      {
        "name": "modify_message",
        "description": "Add or remove labels on a single message. Provide addLabelIds, removeLabelIds, or both. Common label IDs: 'INBOX', 'UNREAD', 'STARRED', 'IMPORTANT', 'TRASH', 'SPAM'. To archive a message, remove 'INBOX'. To mark as read, remove 'UNREAD'. Use list_labels to find custom label IDs.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "messageId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "messageId": {
              "type": "string",
              "description": "Gmail message ID."
            },
            "addLabelIds": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Label IDs to add."
            },
            "removeLabelIds": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Label IDs to remove."
            }
          },
          "anyOf": [
            {
              "required": [
                "addLabelIds"
              ]
            },
            {
              "required": [
                "removeLabelIds"
              ]
            }
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const messageId = encodeURIComponent(input.messageId)\n  const body = {}\n  if (Array.isArray(input.addLabelIds))\n    body.addLabelIds = input.addLabelIds\n  if (Array.isArray(input.removeLabelIds))\n    body.removeLabelIds = input.removeLabelIds\n  const res = await integration.fetch(`/users/${userId}/messages/${messageId}/modify`, { method: 'POST', body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "organize"
      },
      {
        "name": "trash_message",
        "description": "Move a message to the Trash. The message is not permanently deleted and can be restored with untrash_message. To permanently delete, use delete_message.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "messageId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "messageId": {
              "type": "string",
              "description": "Gmail message ID."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const messageId = encodeURIComponent(input.messageId)\n  const res = await integration.fetch(`/users/${userId}/messages/${messageId}/trash`, { method: 'POST' })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "organize"
      },
      {
        "name": "untrash_message",
        "description": "Restore a message from Trash back to the Inbox. Use list_messages with labelIds=['TRASH'] to find trashed message IDs.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "messageId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "messageId": {
              "type": "string",
              "description": "Gmail message ID."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const messageId = encodeURIComponent(input.messageId)\n  const res = await integration.fetch(`/users/${userId}/messages/${messageId}/untrash`, { method: 'POST' })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "organize"
      },
      {
        "name": "delete_message",
        "description": "Permanently and immediately delete a message by ID. This cannot be undone. For recoverable deletion, use trash_message instead.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "messageId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "messageId": {
              "type": "string",
              "description": "Gmail message ID."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const messageId = encodeURIComponent(input.messageId)\n  const res = await integration.fetch(`/users/${userId}/messages/${messageId}`, { method: 'DELETE' })\n  if (res.status === 204)\n    return { success: true }\n  try {\n    return await res.json()\n  }\n  catch {\n    return { success: true }\n  }\n}",
        "scope": "write",
        "toolset": "organize"
      },
      {
        "name": "modify_thread",
        "description": "Add or remove labels on all messages in a thread at once. Provide addLabelIds, removeLabelIds, or both. Common label IDs: 'INBOX', 'UNREAD', 'STARRED', 'IMPORTANT'. To archive a thread, remove 'INBOX'. Use list_labels to find custom label IDs.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "threadId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "threadId": {
              "type": "string",
              "description": "Gmail thread ID."
            },
            "addLabelIds": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Label IDs to add."
            },
            "removeLabelIds": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Label IDs to remove."
            }
          },
          "anyOf": [
            {
              "required": [
                "addLabelIds"
              ]
            },
            {
              "required": [
                "removeLabelIds"
              ]
            }
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const threadId = encodeURIComponent(input.threadId)\n  const body = {}\n  if (Array.isArray(input.addLabelIds))\n    body.addLabelIds = input.addLabelIds\n  if (Array.isArray(input.removeLabelIds))\n    body.removeLabelIds = input.removeLabelIds\n  const res = await integration.fetch(`/users/${userId}/threads/${threadId}/modify`, { method: 'POST', body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "organize"
      },
      {
        "name": "trash_thread",
        "description": "Move an entire thread to Trash. All messages in the thread are trashed. Can be reversed with untrash_thread.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "threadId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "threadId": {
              "type": "string",
              "description": "Gmail thread ID."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const threadId = encodeURIComponent(input.threadId)\n  const res = await integration.fetch(`/users/${userId}/threads/${threadId}/trash`, { method: 'POST' })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "organize"
      },
      {
        "name": "untrash_thread",
        "description": "Restore an entire thread from Trash. Use list_threads with labelIds=['TRASH'] to find trashed thread IDs.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "threadId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "threadId": {
              "type": "string",
              "description": "Gmail thread ID."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const threadId = encodeURIComponent(input.threadId)\n  const res = await integration.fetch(`/users/${userId}/threads/${threadId}/untrash`, { method: 'POST' })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "organize"
      },
      {
        "name": "delete_thread",
        "description": "Permanently and immediately delete an entire thread and all its messages. This cannot be undone. For recoverable deletion, use trash_thread instead.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "threadId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "threadId": {
              "type": "string",
              "description": "Gmail thread ID."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const threadId = encodeURIComponent(input.threadId)\n  const res = await integration.fetch(`/users/${userId}/threads/${threadId}`, { method: 'DELETE' })\n  if (res.status === 204)\n    return { success: true }\n  try {\n    return await res.json()\n  }\n  catch {\n    return { success: true }\n  }\n}",
        "scope": "write",
        "toolset": "organize"
      },
      {
        "name": "create_label",
        "description": "Create a new mailbox label with optional visibility and color settings. Label names must be unique. After creating a label, use its returned ID with modify_message or modify_thread to apply it.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "name"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "name": {
              "type": "string",
              "description": "Label display name."
            },
            "messageListVisibility": {
              "type": "string",
              "enum": [
                "show",
                "hide"
              ]
            },
            "labelListVisibility": {
              "type": "string",
              "enum": [
                "labelShow",
                "labelShowIfUnread",
                "labelHide"
              ]
            },
            "color": {
              "type": "object",
              "properties": {
                "textColor": {
                  "type": "string",
                  "description": "Hex color, e.g. #000000"
                },
                "backgroundColor": {
                  "type": "string",
                  "description": "Hex color, e.g. #ffffff"
                }
              },
              "additionalProperties": false
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const body = { name: input.name }\n  if (input.messageListVisibility)\n    body.messageListVisibility = input.messageListVisibility\n  if (input.labelListVisibility)\n    body.labelListVisibility = input.labelListVisibility\n  if (input.color)\n    body.color = input.color\n  const res = await integration.fetch(`/users/${userId}/labels`, { method: 'POST', body })\n  return await res.json()\n}",
        "scope": "admin",
        "toolset": "organize"
      },
      {
        "name": "update_label",
        "description": "Update (patch) an existing mailbox label's name, color, or visibility settings by label ID. Use list_labels to find label IDs.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "labelId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "labelId": {
              "type": "string",
              "description": "Gmail label ID."
            },
            "name": {
              "type": "string",
              "description": "Label display name."
            },
            "messageListVisibility": {
              "type": "string",
              "enum": [
                "show",
                "hide"
              ]
            },
            "labelListVisibility": {
              "type": "string",
              "enum": [
                "labelShow",
                "labelShowIfUnread",
                "labelHide"
              ]
            },
            "color": {
              "type": "object",
              "properties": {
                "textColor": {
                  "type": "string",
                  "description": "Hex color, e.g. #000000"
                },
                "backgroundColor": {
                  "type": "string",
                  "description": "Hex color, e.g. #ffffff"
                }
              },
              "additionalProperties": false
            }
          },
          "anyOf": [
            {
              "required": [
                "name"
              ]
            },
            {
              "required": [
                "messageListVisibility"
              ]
            },
            {
              "required": [
                "labelListVisibility"
              ]
            },
            {
              "required": [
                "color"
              ]
            }
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const labelId = encodeURIComponent(input.labelId)\n  const body = {}\n  if (input.name !== undefined)\n    body.name = input.name\n  if (input.messageListVisibility !== undefined)\n    body.messageListVisibility = input.messageListVisibility\n  if (input.labelListVisibility !== undefined)\n    body.labelListVisibility = input.labelListVisibility\n  if (input.color !== undefined)\n    body.color = input.color\n  const res = await integration.fetch(`/users/${userId}/labels/${labelId}`, { method: 'PATCH', body })\n  return await res.json()\n}",
        "scope": "admin",
        "toolset": "organize"
      },
      {
        "name": "delete_label",
        "description": "Permanently delete a mailbox label by label ID. Messages with this label will have it removed but will not be deleted. Use list_labels to find label IDs. System labels (INBOX, SENT, etc.) cannot be deleted.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "labelId"
          ],
          "properties": {
            "userId": {
              "type": "string",
              "description": "User email address or 'me'. Defaults to 'me'."
            },
            "labelId": {
              "type": "string",
              "description": "Gmail label ID."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const userId = encodeURIComponent(input.userId || 'me')\n  const labelId = encodeURIComponent(input.labelId)\n  const res = await integration.fetch(`/users/${userId}/labels/${labelId}`, { method: 'DELETE' })\n  if (res.status === 204)\n    return { success: true }\n  try {\n    return await res.json()\n  }\n  catch {\n    return { success: true }\n  }\n}",
        "scope": "admin",
        "toolset": "organize"
      }
    ]
  },
  "google-workspace": {
    "manifest": {
      "name": "google-workspace",
      "version": "0.1.0",
      "baseUrl": "https://www.googleapis.com/drive/v3",
      "allowedOrigins": [
        "https://*.googleapis.com"
      ],
      "toolsets": {
        "drive": {
          "label": "Drive",
          "description": "Find, read, create, move, share, and delete Drive files and folders"
        },
        "docs": {
          "label": "Docs",
          "description": "Read and edit Google Docs documents"
        },
        "sheets": {
          "label": "Sheets",
          "description": "Read and edit Google Sheets spreadsheets"
        },
        "slides": {
          "label": "Slides",
          "description": "Read and edit Google Slides presentations"
        }
      },
      "tools": [
        {
          "name": "list_files",
          "description": "List files in a Google Drive folder or across all of Drive. Returns id, name, mimeType, modifiedTime, size, and parents for each file. Excludes trashed files by default. Use folderId to scope to a specific folder. For name- or type-based search, use search_files instead. Defaults to 50 results per page; use pageToken from the response for the next page.",
          "inputSchema": "schemas/drive/list_files.json",
          "handler": "handlers/drive/list_files.js",
          "scope": "read",
          "toolset": "drive"
        },
        {
          "name": "search_files",
          "description": "Search Google Drive for files by name, MIME type, or raw Drive query syntax. Use the 'name' shorthand for simple name searches (e.g. name='quarterly report'). Use 'mimeType' to filter by type. Use 'query' for advanced Drive search expressions (e.g. \"modifiedTime > '2024-01-01'\" or \"'folderId' in parents and mimeType='application/pdf'\"). All provided filters are combined with AND. Defaults to 20 results per page.",
          "inputSchema": "schemas/drive/search_files.json",
          "handler": "handlers/drive/search_files.js",
          "scope": "read",
          "toolset": "drive"
        },
        {
          "name": "get_file_meta",
          "description": "Get metadata for a Drive file or folder by ID. Returns id, name, mimeType, modifiedTime, createdTime, size, parents, trashed status, and webViewLink by default. To read the actual file contents, use read_file_content. To find a file by name, use search_files.",
          "inputSchema": "schemas/drive/get_file_meta.json",
          "handler": "handlers/drive/get_file_meta.js",
          "scope": "read",
          "toolset": "drive"
        },
        {
          "name": "read_file_content",
          "description": "Read any authorized Google Workspace or uploaded Drive file into agent-friendly text. Supports Docs, Sheets, Slides, PDF, DOCX, XLSX, and PPTX. Pass the mimeType from get_file_meta or search_files when available for the best behavior.",
          "inputSchema": "schemas/drive/read_file_content.json",
          "handler": "handlers/drive/read_file_content.js",
          "scope": "read",
          "toolset": "drive"
        },
        {
          "name": "create_folder",
          "description": "Create a new folder in Google Drive. Optionally nest it inside a parent folder using parentId. Returns the created folder's metadata including its ID, which can be used as a parentId for subsequent file creation.",
          "inputSchema": "schemas/drive/create_folder.json",
          "handler": "handlers/drive/create_folder.js",
          "scope": "write",
          "toolset": "drive"
        },
        {
          "name": "create_file",
          "description": "Create a new Drive file (metadata only -- no content upload). To create a Google Workspace file, use the appropriate mimeType: 'application/vnd.google-apps.document' for Docs, 'application/vnd.google-apps.spreadsheet' for Sheets, 'application/vnd.google-apps.presentation' for Slides. Optionally place it in a folder with parentId. Returns the created file's metadata including its ID.",
          "inputSchema": "schemas/drive/create_file.json",
          "handler": "handlers/drive/create_file.js",
          "scope": "write",
          "toolset": "drive"
        },
        {
          "name": "move_file",
          "description": "Move a file or folder to a different parent folder by updating its parents. Provide the destination folder ID as addParents and optionally the current parent ID as removeParents (to remove it from the old location). Get the current parents from get_file_meta.",
          "inputSchema": "schemas/drive/move_file.json",
          "handler": "handlers/drive/move_file.js",
          "scope": "write",
          "toolset": "drive"
        },
        {
          "name": "share_file",
          "description": "Share a Drive file or folder with a specific user, group, domain, or make it publicly accessible. Use type='user' with emailAddress for individual sharing. Use type='anyone' with role='reader' to create a public view link. Use type='domain' with domain for organization-wide sharing. Returns the created permission resource.",
          "inputSchema": "schemas/drive/share_file.json",
          "handler": "handlers/drive/share_file.js",
          "scope": "write",
          "toolset": "drive"
        },
        {
          "name": "delete_file",
          "description": "Permanently and immediately delete a Drive file or folder by ID. This bypasses Trash and cannot be undone. To move to Trash instead, use the Google Drive UI or modify file properties. Use search_files or list_files to find file IDs.",
          "inputSchema": "schemas/drive/delete_file.json",
          "handler": "handlers/drive/delete_file.js",
          "scope": "write",
          "toolset": "drive"
        },
        {
          "name": "read_document",
          "description": "Read a Google Doc and return its content as clean Markdown. Preserves headings, bold, italic, strikethrough, links, code spans, ordered/unordered lists with nesting, and tables. This is the standard way to read document content. For editing, use append_text, replace_all_text, first-match tools, or docs_batch_update.",
          "inputSchema": "schemas/docs/read_document.json",
          "handler": "handlers/docs/read_document.js",
          "scope": "read",
          "toolset": "docs"
        },
        {
          "name": "search_docs",
          "description": "Search Google Drive for Google Docs only. Use this when the agent needs to discover Docs by name or Drive query without manually constructing a MIME type filter.",
          "inputSchema": "schemas/docs/search_docs.json",
          "handler": "handlers/docs/search_docs.js",
          "scope": "read",
          "toolset": "docs"
        },
        {
          "name": "create_document",
          "description": "Create a new empty Google Doc with the given title. Returns the created document's metadata including its documentId, which is needed for all subsequent operations on the document.",
          "inputSchema": "schemas/docs/create_document.json",
          "handler": "handlers/docs/create_document.js",
          "scope": "write",
          "toolset": "docs"
        },
        {
          "name": "docs_batch_update",
          "description": "Send a documents.batchUpdate request to modify a document with one or more structured requests. Supports insertText, deleteContentRange, replaceAllText, createNamedRange, updateTextStyle, updateParagraphStyle, insertTable, insertInlineImage, and more. For common operations, prefer the higher-level Docs tools.",
          "inputSchema": "schemas/docs/batch_update.json",
          "handler": "handlers/docs/batch_update.js",
          "scope": "write",
          "toolset": "docs"
        },
        {
          "name": "append_text",
          "description": "Append plain text to the end of a Google Doc. Automatically fetches the document to find the correct end index and inserts the text there. Use this for adding content to the end of a document without needing to know the document structure.",
          "inputSchema": "schemas/docs/append_text.json",
          "handler": "handlers/docs/append_text.js",
          "scope": "write",
          "toolset": "docs"
        },
        {
          "name": "replace_all_text",
          "description": "Replace all occurrences of a text string in a Google Doc with new text. Case-sensitive by default. More efficient than the first-match tools when you need to replace every occurrence. Returns the number of occurrences replaced.",
          "inputSchema": "schemas/docs/replace_all_text.json",
          "handler": "handlers/docs/replace_all_text.js",
          "scope": "write",
          "toolset": "docs"
        },
        {
          "name": "style_first_match",
          "description": "Find the first occurrence of text in a document and apply a TextStyle to it (bold, italic, fontSize, foregroundColor, etc.). Uses a marker-based approach: replaces the text with a unique marker, locates the marker's position, applies the style, then restores the original text. Returns {applied: true/false}.",
          "inputSchema": "schemas/docs/style_first_match.json",
          "handler": "handlers/docs/style_first_match.js",
          "scope": "write",
          "toolset": "docs"
        },
        {
          "name": "insert_text_after_first_match",
          "description": "Find the first occurrence of text and insert new text immediately before or after it. Useful for inserting content at a specific anchor point in the document without knowing exact character indices. Returns {applied: true/false}.",
          "inputSchema": "schemas/docs/insert_text_after_first_match.json",
          "handler": "handlers/docs/insert_text_after_first_match.js",
          "scope": "write",
          "toolset": "docs"
        },
        {
          "name": "insert_table_after_first_match",
          "description": "Find the first occurrence of text and insert a table with the specified number of rows and columns nearby. Returns {applied: true/false}.",
          "inputSchema": "schemas/docs/insert_table_after_first_match.json",
          "handler": "handlers/docs/insert_table_after_first_match.js",
          "scope": "write",
          "toolset": "docs"
        },
        {
          "name": "insert_page_break_after_first_match",
          "description": "Find the first occurrence of text and insert a page break nearby. Useful for structuring long documents. Returns {applied: true/false}.",
          "inputSchema": "schemas/docs/insert_page_break_after_first_match.json",
          "handler": "handlers/docs/insert_page_break_after_first_match.js",
          "scope": "write",
          "toolset": "docs"
        },
        {
          "name": "insert_inline_image_after_first_match",
          "description": "Find the first occurrence of text and insert an inline image nearby, referenced by URL. Returns {applied: true/false}.",
          "inputSchema": "schemas/docs/insert_inline_image_after_first_match.json",
          "handler": "handlers/docs/insert_inline_image_after_first_match.js",
          "scope": "write",
          "toolset": "docs"
        },
        {
          "name": "delete_first_match",
          "description": "Find the first occurrence of text in the document and delete it. Only the first match is removed. Use replace_all_text with an empty string to remove all occurrences. Returns {applied: true/false}.",
          "inputSchema": "schemas/docs/delete_first_match.json",
          "handler": "handlers/docs/delete_first_match.js",
          "scope": "write",
          "toolset": "docs"
        },
        {
          "name": "update_paragraph_style_for_first_match",
          "description": "Find the first occurrence of text and update the paragraph style for the paragraph containing it. Use to apply heading levels (HEADING_1 through HEADING_6), NORMAL_TEXT, or adjust spacing, alignment, and indentation. Returns {applied: true/false}.",
          "inputSchema": "schemas/docs/update_paragraph_style_for_first_match.json",
          "handler": "handlers/docs/update_paragraph_style_for_first_match.js",
          "scope": "write",
          "toolset": "docs"
        },
        {
          "name": "update_document_style",
          "description": "Update document-level style properties such as page size (pageSize.width, pageSize.height in pt), margins (marginTop, marginBottom, marginLeft, marginRight in pt), and page orientation. Does not affect individual paragraph or text styles.",
          "inputSchema": "schemas/docs/update_document_style.json",
          "handler": "handlers/docs/update_document_style.js",
          "scope": "write",
          "toolset": "docs"
        },
        {
          "name": "get_spreadsheet",
          "description": "Retrieve spreadsheet metadata including all sheet names, IDs, and properties. Set includeGridData=false (the default) to get only metadata without cell values. Use read_sheet for cell content. Use the 'fields' parameter to limit the response (e.g. fields='sheets.properties' to get only sheet names and IDs). The spreadsheetId appears in the URL: https://docs.google.com/spreadsheets/d/{spreadsheetId}/.",
          "inputSchema": "schemas/sheets/get_spreadsheet.json",
          "handler": "handlers/sheets/get_spreadsheet.js",
          "scope": "read",
          "toolset": "sheets"
        },
        {
          "name": "search_sheets",
          "description": "Search Google Drive for Google Sheets only. Use this when the agent needs to discover spreadsheets by name or Drive query without manually constructing a MIME type filter.",
          "inputSchema": "schemas/sheets/search_sheets.json",
          "handler": "handlers/sheets/search_sheets.js",
          "scope": "read",
          "toolset": "sheets"
        },
        {
          "name": "read_sheet",
          "description": "Read cell values from a sheet range and return as a Markdown table with A1 column headers and row numbers. Use this to read and understand spreadsheet data -- the coordinates in the output can be used directly with update_values and append_values for writes. Supports optional valueRenderOption for formulas or raw numbers. Use get_spreadsheet first to discover sheet names.",
          "inputSchema": "schemas/sheets/read_sheet.json",
          "handler": "handlers/sheets/read_sheet.js",
          "scope": "read",
          "toolset": "sheets"
        },
        {
          "name": "create_spreadsheet",
          "description": "Create a new Google Spreadsheet. Accepts a full spreadsheet resource body, allowing you to specify the title, initial sheets, and cell data. Minimum: provide {title: 'My Spreadsheet'}. Returns the created spreadsheet including its spreadsheetId.",
          "inputSchema": "schemas/sheets/create_spreadsheet.json",
          "handler": "handlers/sheets/create_spreadsheet.js",
          "scope": "write",
          "toolset": "sheets"
        },
        {
          "name": "update_values",
          "description": "Write values to a specific A1 range, replacing existing content. Use valueInputOption='USER_ENTERED' to parse values as the user would type them (supports formulas, dates, currency). Use 'RAW' to store values as literal strings. Provide values as a 2D array (rows of columns).",
          "inputSchema": "schemas/sheets/update_values.json",
          "handler": "handlers/sheets/update_values.js",
          "scope": "write",
          "toolset": "sheets"
        },
        {
          "name": "append_values",
          "description": "Append rows of values after the last row of existing data in a range. Useful for adding new rows to a table without knowing the exact next row number. Uses USER_ENTERED valueInputOption by default. The range determines which sheet to append to.",
          "inputSchema": "schemas/sheets/append_values.json",
          "handler": "handlers/sheets/append_values.js",
          "scope": "write",
          "toolset": "sheets"
        },
        {
          "name": "batch_update_values",
          "description": "Write values to multiple A1 ranges in a single API call. More efficient than calling update_values multiple times. Provide a data array where each item has range and values. Use valueInputOption='USER_ENTERED' for formulas and dates.",
          "inputSchema": "schemas/sheets/batch_update_values.json",
          "handler": "handlers/sheets/batch_update_values.js",
          "scope": "write",
          "toolset": "sheets"
        },
        {
          "name": "clear_values",
          "description": "Clear all values (but not formatting) in the specified A1 range. The cells remain but their content is removed. To clear formatting as well, use sheets_batch_update with a repeatCell request.",
          "inputSchema": "schemas/sheets/clear_values.json",
          "handler": "handlers/sheets/clear_values.js",
          "scope": "write",
          "toolset": "sheets"
        },
        {
          "name": "batch_clear_values",
          "description": "Clear values from multiple A1 ranges in a single API call. More efficient than calling clear_values multiple times.",
          "inputSchema": "schemas/sheets/batch_clear_values.json",
          "handler": "handlers/sheets/batch_clear_values.js",
          "scope": "write",
          "toolset": "sheets"
        },
        {
          "name": "sheets_batch_update",
          "description": "Send a spreadsheets.batchUpdate request for structural changes such as addSheet, deleteSheet, duplicateSheet, insertDimension, deleteDimension, mergeCells, sortRange, addConditionalFormatRule, and more. Accepts a requests array. Use update_values or batch_update_values for writing cell data.",
          "inputSchema": "schemas/sheets/batch_update.json",
          "handler": "handlers/sheets/batch_update.js",
          "scope": "write",
          "toolset": "sheets"
        },
        {
          "name": "copy_to_spreadsheet",
          "description": "Copy a specific sheet (tab) from one spreadsheet to another. Provide the source spreadsheetId, the sheetId (integer, from get_spreadsheet), and the destination spreadsheetId. Returns the copied sheet's properties in the destination spreadsheet.",
          "inputSchema": "schemas/sheets/copy_to_spreadsheet.json",
          "handler": "handlers/sheets/copy_to_spreadsheet.js",
          "scope": "write",
          "toolset": "sheets"
        },
        {
          "name": "read_presentation",
          "description": "Read a Google Slides presentation and return a human-readable summary including the title, slide count, and text content extracted from each slide. Returns the text found in all shapes on each slide with slide IDs for reference. Use this to understand what is in a presentation before editing. For low-level modifications, use slides_batch_update.",
          "inputSchema": "schemas/slides/get_presentation.json",
          "handler": "handlers/slides/read_presentation.js",
          "scope": "read",
          "toolset": "slides"
        },
        {
          "name": "search_slides",
          "description": "Search Google Drive for Google Slides only. Use this when the agent needs to discover presentations by name or Drive query without manually constructing a MIME type filter.",
          "inputSchema": "schemas/slides/search_slides.json",
          "handler": "handlers/slides/search_slides.js",
          "scope": "read",
          "toolset": "slides"
        },
        {
          "name": "get_page_thumbnail",
          "description": "Generate a thumbnail image URL for a specific slide (page) in a presentation. Requires the presentation ID and the slide's objectId (page ID from read_presentation). Returns a contentUrl for the thumbnail image. Useful for previewing slides.",
          "inputSchema": "schemas/slides/get_page_thumbnail.json",
          "handler": "handlers/slides/get_page_thumbnail.js",
          "scope": "read",
          "toolset": "slides"
        },
        {
          "name": "create_presentation",
          "description": "Create a new empty Google Slides presentation with an optional title. Returns the created presentation's metadata including its presentationId, which is needed for all subsequent operations.",
          "inputSchema": "schemas/slides/create_presentation.json",
          "handler": "handlers/slides/create_presentation.js",
          "scope": "write",
          "toolset": "slides"
        },
        {
          "name": "slides_batch_update",
          "description": "Send a presentations.batchUpdate request for low-level slide modifications. Accepts an array of requests (createSlide, deleteObject, insertText, deleteText, createShape, createTable, replaceAllText, updateTextStyle, updateShapeProperties, etc.). For common text and styling operations, prefer the higher-level Slides tools.",
          "inputSchema": "schemas/slides/batch_update.json",
          "handler": "handlers/slides/batch_update.js",
          "scope": "write",
          "toolset": "slides"
        },
        {
          "name": "append_text_to_title_of_slide_index",
          "description": "Append text to the title shape of a specific slide by its 0-based index (slideIndex=0 is the first slide, default). Fetches the presentation to find the title shape's objectId then inserts text at the end of its content.",
          "inputSchema": "schemas/slides/append_text_to_title_of_first_slide.json",
          "handler": "handlers/slides/append_text_to_title_of_first_slide.js",
          "scope": "write",
          "toolset": "slides"
        },
        {
          "name": "replace_text_first_match",
          "description": "Replace the first occurrence of text anywhere in the presentation with new text. Note: the Slides API replaceAllText always replaces all occurrences; this tool uses replaceAllText internally. For replacing only one instance, use style_text_first_match to locate and style the match, then follow up with slides_batch_update. Returns the API response.",
          "inputSchema": "schemas/slides/replace_text_first_match.json",
          "handler": "handlers/slides/replace_text_first_match.js",
          "scope": "write",
          "toolset": "slides"
        },
        {
          "name": "style_text_first_match",
          "description": "Find the first occurrence of text in the presentation and apply a text style to it (bold, italic, fontSize, foregroundColor, etc.). Uses a marker pattern: replaces the text with a unique marker, finds the marker's objectId and range, applies the style, then restores the original text. Returns {applied: true/false}.",
          "inputSchema": "schemas/slides/style_text_first_match.json",
          "handler": "handlers/slides/style_text_first_match.js",
          "scope": "write",
          "toolset": "slides"
        },
        {
          "name": "insert_shape_after_first_match",
          "description": "Find the first slide containing a text match and insert a rectangle shape on that slide at the specified position. Positions use EMU units (1 inch = 914400 EMU). Returns {applied: true/false}.",
          "inputSchema": "schemas/slides/insert_shape_after_first_match.json",
          "handler": "handlers/slides/insert_shape_after_first_match.js",
          "scope": "write",
          "toolset": "slides"
        },
        {
          "name": "insert_image_after_first_match",
          "description": "Find the first slide containing a text match and insert an image on that slide from a URL. Position and size use EMU units (1 inch = 914400 EMU). Returns {applied: true/false}.",
          "inputSchema": "schemas/slides/insert_image_after_first_match.json",
          "handler": "handlers/slides/insert_image_after_first_match.js",
          "scope": "write",
          "toolset": "slides"
        },
        {
          "name": "create_slide_after_first_match",
          "description": "Find the first slide containing a text match and create a new blank slide immediately after it. Useful for inserting slides at a specific position in the deck. Returns {applied: true/false} and the new slide's objectId.",
          "inputSchema": "schemas/slides/create_slide_after_first_match.json",
          "handler": "handlers/slides/create_slide_after_first_match.js",
          "scope": "write",
          "toolset": "slides"
        },
        {
          "name": "set_background_color_for_slide_index",
          "description": "Set the background color for a specific slide by its 0-based index (slideIndex=0 is the first slide). Provide r, g, b values in 0.0-1.0 range (e.g. r=1.0, g=0.0, b=0.0 for red). Fetches the presentation first to resolve the slide's objectId from the index.",
          "inputSchema": "schemas/slides/set_background_color_for_slide_index.json",
          "handler": "handlers/slides/set_background_color_for_slide_index.js",
          "scope": "write",
          "toolset": "slides"
        }
      ]
    },
    "prompt": null,
    "variants": {
      "variants": {
        "service_account": {
          "label": "Service Account (recommended for enterprise)",
          "schema": {
            "type": "object",
            "properties": {
              "serviceAccountJson": {
                "type": "string",
                "title": "Service Account JSON",
                "description": "Full service account key JSON (contents of the downloaded JSON file from Google Cloud)."
              },
              "subject": {
                "type": "string",
                "title": "Subject / impersonated user (optional)",
                "description": "Optional user email to impersonate when using Google Workspace domain-wide delegation."
              },
              "scopes": {
                "type": "array",
                "title": "OAuth scopes (optional)",
                "description": "Optional override for OAuth scopes. Defaults to drive + documents + spreadsheets + presentations.",
                "items": {
                  "type": "string"
                }
              }
            },
            "required": [
              "serviceAccountJson"
            ],
            "additionalProperties": false
          },
          "injection": {
            "headers": {
              "Authorization": "Bearer {{token}}"
            }
          },
          "preprocess": "google_service_account",
          "healthCheck": {
            "notViable": true
          }
        },
        "oauth_token": {
          "label": "OAuth Access Token (short-lived)",
          "schema": {
            "type": "object",
            "properties": {
              "token": {
                "type": "string",
                "title": "OAuth Access Token",
                "description": "Short-lived Google OAuth access token with drive.file, documents, spreadsheets, and presentations scopes."
              }
            },
            "required": [
              "token"
            ],
            "additionalProperties": false
          },
          "injection": {
            "headers": {
              "Authorization": "Bearer {{token}}"
            }
          },
          "healthCheck": {
            "notViable": true
          }
        }
      },
      "default": "service_account"
    },
    "hint": null,
    "hintsByVariant": {
      "oauth_token": "Obtain a short-lived Google OAuth access token using these scopes:\n\n- `https://www.googleapis.com/auth/drive.file`\n- `https://www.googleapis.com/auth/documents`\n- `https://www.googleapis.com/auth/spreadsheets`\n- `https://www.googleapis.com/auth/presentations`\n\nYou can use the Google OAuth 2.0 Playground (`https://developers.google.com/oauthplayground/`) or your own OAuth flow.\n\nNote: OAuth access tokens are short-lived (typically 1 hour). For long-running use or full enterprise access, prefer the Service Account variant.",
      "service_account": "Provide a Google service account JSON key.\n\nOptional fields:\n\n1. `subject` if you are using domain-wide delegation and want to impersonate a user\n2. `scopes` if you need to override the defaults\n\nDefault scopes for this integration:\n\n- `https://www.googleapis.com/auth/drive`\n- `https://www.googleapis.com/auth/documents`\n- `https://www.googleapis.com/auth/spreadsheets`\n- `https://www.googleapis.com/auth/presentations`\n\nFor full Workspace access, make sure the service account has been granted access to the relevant Drive files or shared drives, or use domain-wide delegation where appropriate."
    },
    "tools": [
      {
        "name": "list_files",
        "description": "List files in a Google Drive folder or across all of Drive. Returns id, name, mimeType, modifiedTime, size, and parents for each file. Excludes trashed files by default. Use folderId to scope to a specific folder. For name- or type-based search, use search_files instead. Defaults to 50 results per page; use pageToken from the response for the next page.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "folderId": {
              "type": "string",
              "description": "Parent folder ID to list contents of. Omit to list files across all of Drive (not scoped to a folder). Use search_files with query=\"'root' in parents\" to list only root-level files."
            },
            "pageSize": {
              "type": "integer",
              "minimum": 1,
              "maximum": 1000,
              "default": 50,
              "description": "Maximum results per page. Defaults to 50. Use pageToken from the response for the next page."
            },
            "pageToken": {
              "type": "string",
              "description": "Page token from a previous list_files response to retrieve the next page of results."
            },
            "orderBy": {
              "type": "string",
              "description": "Sort order. Examples: 'modifiedTime desc', 'name', 'createdTime desc'. Default is unspecified."
            },
            "fields": {
              "type": "string",
              "description": "Override the fields returned in each file. Defaults to 'nextPageToken,files(id,name,mimeType,modifiedTime,size,parents)'."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  const qParts = ['trashed = false']\n  if (input.folderId)\n    qParts.push(`'${input.folderId}' in parents`)\n  params.set('q', qParts.join(' and '))\n  params.set('fields', input.fields || 'nextPageToken,files(id,name,mimeType,modifiedTime,size,parents)')\n  params.set('pageSize', String(input.pageSize || 50))\n  if (input.pageToken)\n    params.set('pageToken', input.pageToken)\n  if (input.orderBy)\n    params.set('orderBy', input.orderBy)\n  const res = await integration.fetch(`/files?${params.toString()}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "drive"
      },
      {
        "name": "search_files",
        "description": "Search Google Drive for files by name, MIME type, or raw Drive query syntax. Use the 'name' shorthand for simple name searches (e.g. name='quarterly report'). Use 'mimeType' to filter by type. Use 'query' for advanced Drive search expressions (e.g. \"modifiedTime > '2024-01-01'\" or \"'folderId' in parents and mimeType='application/pdf'\"). All provided filters are combined with AND. Defaults to 20 results per page.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Raw Drive query string using the Drive search syntax. Examples: \"name contains 'budget' and mimeType = 'application/vnd.google-apps.spreadsheet'\", \"modifiedTime > '2024-01-01'\", \"'folderId' in parents\". Combined with name/mimeType shorthand via AND."
            },
            "name": {
              "type": "string",
              "description": "Shorthand for name-based search. Translates to \"name contains 'value'\". Combined with query and mimeType via AND."
            },
            "mimeType": {
              "type": "string",
              "description": "Filter by MIME type. Common values: 'application/vnd.google-apps.document' (Docs), 'application/vnd.google-apps.spreadsheet' (Sheets), 'application/vnd.google-apps.presentation' (Slides), 'application/vnd.google-apps.folder' (folders), 'application/pdf', 'text/plain'."
            },
            "includeTrashed": {
              "type": "boolean",
              "description": "Include trashed files in results. Defaults to false (trashed files excluded)."
            },
            "pageSize": {
              "type": "integer",
              "minimum": 1,
              "maximum": 1000,
              "default": 20,
              "description": "Maximum results per page. Defaults to 20. Use pageToken from the response for the next page."
            },
            "pageToken": {
              "type": "string",
              "description": "Page token from a previous search_files response to retrieve the next page of results."
            },
            "fields": {
              "type": "string",
              "description": "Override the fields returned in each file. Defaults to 'nextPageToken,files(id,name,mimeType,modifiedTime,size,parents)'."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  const qParts = []\n  if (input.query)\n    qParts.push(input.query)\n  if (input.name)\n    qParts.push(`name contains '${input.name.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, \"\\\\'\")}'`)\n  if (input.mimeType)\n    qParts.push(`mimeType = '${input.mimeType}'`)\n  if (!input.includeTrashed)\n    qParts.push('trashed = false')\n  if (qParts.length > 0)\n    params.set('q', qParts.join(' and '))\n  params.set('fields', input.fields || 'nextPageToken,files(id,name,mimeType,modifiedTime,size,parents)')\n  params.set('pageSize', String(input.pageSize || 20))\n  if (input.pageToken)\n    params.set('pageToken', input.pageToken)\n  const res = await integration.fetch(`/files?${params.toString()}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "drive"
      },
      {
        "name": "get_file_meta",
        "description": "Get metadata for a Drive file or folder by ID. Returns id, name, mimeType, modifiedTime, createdTime, size, parents, trashed status, and webViewLink by default. To read the actual file contents, use read_file_content. To find a file by name, use search_files.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "fileId"
          ],
          "additionalProperties": false,
          "properties": {
            "fileId": {
              "type": "string",
              "description": "Drive file or folder ID. Use search_files or list_files to find file IDs."
            },
            "fields": {
              "type": "string",
              "description": "Comma-separated list of fields to return. Defaults to 'id,name,mimeType,modifiedTime,createdTime,size,parents,trashed,webViewLink'. See the Drive API fields reference for all available fields."
            }
          }
        },
        "handlerCode": "async (input) => {\n  const fields = input.fields || 'id,name,mimeType,modifiedTime,createdTime,size,parents,trashed,webViewLink'\n  const res = await integration.fetch(`/files/${encodeURIComponent(input.fileId)}?fields=${encodeURIComponent(fields)}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "drive"
      },
      {
        "name": "read_file_content",
        "description": "Read any authorized Google Workspace or uploaded Drive file into agent-friendly text. Supports Docs, Sheets, Slides, PDF, DOCX, XLSX, and PPTX. Pass the mimeType from get_file_meta or search_files when available for the best behavior.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "fileId"
          ],
          "properties": {
            "fileId": {
              "type": "string",
              "description": "Drive file ID. Use search_files or list_files to find file IDs."
            },
            "mimeType": {
              "type": "string",
              "description": "Optional Drive MIME type from get_file_meta or search_files."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const googleNativeExports = {\n    'application/vnd.google-apps.document': 'text/markdown',\n    'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',\n    'application/vnd.google-apps.presentation': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',\n    'application/vnd.google-apps.drawing': 'image/svg+xml',\n    'application/vnd.google-apps.script': 'application/vnd.google-apps.script+json',\n  }\n  const isTextLikeMimeType = (value) => {\n    const mimeType = String(value || '').split(';', 1)[0].trim().toLowerCase()\n    return mimeType.startsWith('text/')\n      || mimeType.includes('json')\n      || mimeType.includes('csv')\n      || mimeType === 'application/xml'\n      || mimeType === 'text/xml'\n      || mimeType.endsWith('+xml')\n      || mimeType.includes('javascript')\n      || mimeType.includes('svg')\n  }\n  const resolveMimeType = async () => {\n    if (typeof input.mimeType === 'string' && input.mimeType.trim())\n      return input.mimeType.trim()\n\n    const metaRes = await integration.fetch(`/files/${fileId}?fields=id,name,mimeType`)\n    const meta = await metaRes.json()\n    return meta?.mimeType || ''\n  }\n  const readTextContent = async (source) => {\n    const res = await integration.fetch(source)\n    const contentMimeType = res.headers?.get?.('content-type') || ''\n    const content = await res.text()\n    return { contentMimeType, content }\n  }\n\n  const fileId = encodeURIComponent(input.fileId)\n  const mimeType = await resolveMimeType()\n\n  if (!mimeType) {\n    return {\n      fileId: input.fileId,\n      mimeType: null,\n      content: null,\n      message: 'Could not determine the Drive file MIME type.',\n    }\n  }\n\n  if (mimeType === 'application/vnd.google-apps.folder') {\n    return {\n      fileId: input.fileId,\n      mimeType,\n      content: null,\n      message: 'Folders do not have readable file content.',\n    }\n  }\n\n  const isGoogleNative = mimeType.startsWith('application/vnd.google-apps.')\n  const exportMimeType = isGoogleNative\n    ? (typeof input.exportMimeType === 'string' && input.exportMimeType.trim())\n        ? input.exportMimeType.trim()\n        : googleNativeExports[mimeType] || null\n    : null\n\n  if (isGoogleNative && !exportMimeType) {\n    return {\n      fileId: input.fileId,\n      mimeType,\n      content: null,\n      message: 'This Google-native file type does not have a configured export path for read_file_content.',\n    }\n  }\n\n  const source = isGoogleNative\n    ? `/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`\n    : `/files/${fileId}?alt=media`\n\n  if (isTextLikeMimeType(exportMimeType || mimeType)) {\n    const textResult = await readTextContent(source)\n    return {\n      fileId: input.fileId,\n      mimeType,\n      contentMimeType: textResult.contentMimeType || exportMimeType || mimeType,\n      content: textResult.content,\n    }\n  }\n\n  const extracted = await utils.extractFileContent({\n    auth: true,\n    source,\n  })\n\n  return {\n    fileId: input.fileId,\n    mimeType,\n    contentMimeType: exportMimeType || mimeType,\n    ...extracted,\n  }\n}",
        "scope": "read",
        "toolset": "drive"
      },
      {
        "name": "create_folder",
        "description": "Create a new folder in Google Drive. Optionally nest it inside a parent folder using parentId. Returns the created folder's metadata including its ID, which can be used as a parentId for subsequent file creation.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "name"
          ],
          "additionalProperties": false,
          "properties": {
            "name": {
              "type": "string"
            },
            "parentId": {
              "type": "string",
              "description": "Optional parent folder fileId"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const body = {\n    name: input.name,\n    mimeType: 'application/vnd.google-apps.folder',\n  }\n  if (input.parentId)\n    body.parents = [input.parentId]\n\n  const res = await integration.fetch('/files', {\n    method: 'POST',\n    body,\n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "drive"
      },
      {
        "name": "create_file",
        "description": "Create a new Drive file (metadata only -- no content upload). To create a Google Workspace file, use the appropriate mimeType: 'application/vnd.google-apps.document' for Docs, 'application/vnd.google-apps.spreadsheet' for Sheets, 'application/vnd.google-apps.presentation' for Slides. Optionally place it in a folder with parentId. Returns the created file's metadata including its ID.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "name",
            "mimeType"
          ],
          "additionalProperties": false,
          "properties": {
            "name": {
              "type": "string"
            },
            "mimeType": {
              "type": "string",
              "description": "Drive mimeType (e.g. application/vnd.google-apps.document)"
            },
            "parentId": {
              "type": "string",
              "description": "Optional parent folder fileId"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const body = {\n    name: input.name,\n    mimeType: input.mimeType,\n  }\n  if (input.parentId)\n    body.parents = [input.parentId]\n\n  const res = await integration.fetch('/files', {\n    method: 'POST',\n    body,\n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "drive"
      },
      {
        "name": "move_file",
        "description": "Move a file or folder to a different parent folder by updating its parents. Provide the destination folder ID as addParents and optionally the current parent ID as removeParents (to remove it from the old location). Get the current parents from get_file_meta.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "fileId",
            "addParents"
          ],
          "additionalProperties": false,
          "properties": {
            "fileId": {
              "type": "string"
            },
            "addParents": {
              "type": "string",
              "description": "Comma-separated parent IDs to add"
            },
            "removeParents": {
              "type": "string",
              "description": "Comma-separated parent IDs to remove (optional)"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  params.set('addParents', input.addParents)\n  if (input.removeParents)\n    params.set('removeParents', input.removeParents)\n\n  const res = await integration.fetch(`/files/${encodeURIComponent(input.fileId)}?${params.toString()}`, {\n    method: 'PATCH',\n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "drive"
      },
      {
        "name": "share_file",
        "description": "Share a Drive file or folder with a specific user, group, domain, or make it publicly accessible. Use type='user' with emailAddress for individual sharing. Use type='anyone' with role='reader' to create a public view link. Use type='domain' with domain for organization-wide sharing. Returns the created permission resource.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "fileId",
            "role",
            "type"
          ],
          "properties": {
            "fileId": {
              "type": "string",
              "description": "Drive file or folder ID to share."
            },
            "role": {
              "type": "string",
              "enum": [
                "reader",
                "commenter",
                "writer",
                "organizer",
                "owner"
              ],
              "description": "Permission level. 'reader' = view only, 'commenter' = view + comment, 'writer' = edit, 'organizer' = organize in shared drives, 'owner' = full ownership transfer."
            },
            "type": {
              "type": "string",
              "enum": [
                "user",
                "group",
                "domain",
                "anyone"
              ],
              "description": "Grantee type. 'user' requires emailAddress, 'group' requires emailAddress, 'domain' requires domain, 'anyone' grants access to all (use role='reader' for public link)."
            },
            "emailAddress": {
              "type": "string",
              "description": "Email address of the user or group to share with. Required when type is 'user' or 'group'."
            },
            "domain": {
              "type": "string",
              "description": "Domain to share with (e.g. 'example.com'). Required when type is 'domain'."
            },
            "sendNotificationEmail": {
              "type": "boolean",
              "description": "Whether to send a notification email to the new recipient. Defaults to true. Set to false to share silently."
            },
            "emailMessage": {
              "type": "string",
              "description": "Custom message to include in the notification email."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const fileId = encodeURIComponent(input.fileId)\n  const params = new URLSearchParams()\n  if (input.sendNotificationEmail !== undefined)\n    params.set('sendNotificationEmail', String(input.sendNotificationEmail))\n  if (input.emailMessage)\n    params.set('emailMessage', input.emailMessage)\n  const body = {\n    role: input.role,\n    type: input.type,\n  }\n  if (input.emailAddress) body.emailAddress = input.emailAddress\n  if (input.domain) body.domain = input.domain\n  const qs = params.toString()\n  const res = await integration.fetch(`/files/${fileId}/permissions${qs ? `?${qs}` : ''}`, {\n    method: 'POST',\n    body,\n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "drive"
      },
      {
        "name": "delete_file",
        "description": "Permanently and immediately delete a Drive file or folder by ID. This bypasses Trash and cannot be undone. To move to Trash instead, use the Google Drive UI or modify file properties. Use search_files or list_files to find file IDs.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "fileId"
          ],
          "additionalProperties": false,
          "properties": {
            "fileId": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/files/${encodeURIComponent(input.fileId)}`, {\n    method: 'DELETE',\n  })\n  if (res.status === 204)\n    return { success: true, status: 204 }\n  try {\n    return await res.json()\n  }\n  catch {\n    return { success: res.ok, status: res.status }\n  }\n}",
        "scope": "write",
        "toolset": "drive"
      },
      {
        "name": "read_document",
        "description": "Read a Google Doc and return its content as clean Markdown. Preserves headings, bold, italic, strikethrough, links, code spans, ordered/unordered lists with nesting, and tables. This is the standard way to read document content. For editing, use append_text, replace_all_text, first-match tools, or docs_batch_update.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "documentId"
          ],
          "properties": {
            "documentId": {
              "type": "string",
              "description": "Google Doc documentId from URL: https://docs.google.com/document/d/{documentId}/edit"
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const MONO_FONTS = new Set([\n    'Courier',\n    'Courier New',\n    'Consolas',\n    'Menlo',\n    'Monaco',\n    'Roboto Mono',\n    'Source Code Pro',\n  ])\n\n  const HEADING_MAP = {\n    TITLE: '#',\n    SUBTITLE: '##',\n    HEADING_1: '#',\n    HEADING_2: '##',\n    HEADING_3: '###',\n    HEADING_4: '####',\n    HEADING_5: '#####',\n    HEADING_6: '######',\n  }\n\n  const BULLET_GLYPHS = new Set([\n    'BULLET_DISC_CIRCLE_SQUARE',\n    'BULLET_DIAMONDX_ARROW3D_SQUARE',\n    'BULLET_CHECKBOX',\n    'BULLET_ARROW_DIAMOND_DISC',\n    'BULLET_STAR_CIRCLE_SQUARE',\n  ])\n\n  const LIST_NUMBER_GLYPHS = new Set([\n    'DECIMAL',\n    'ZERO_DECIMAL',\n    'UPPER_ALPHA',\n    'ALPHA',\n    'UPPER_ROMAN',\n    'ROMAN',\n  ])\n\n  const trimEndWhitespace = (value) => (value || '').replace(/[ \\t]+$/g, '')\n\n  const escapeCell = (value) =>\n    String(value ?? '')\n      .replace(/\\|/g, '\\\\|')\n      .replace(/\\r?\\n/g, '<br>')\n\n  const extractPlainTextFromParagraph = (paragraph) => {\n    let text = ''\n    for (const element of paragraph?.elements || []) {\n      text += element?.textRun?.content || ''\n    }\n    return trimEndWhitespace(text)\n  }\n\n  const applyTextStyle = (text, textStyle = {}) => {\n    const raw = (text || '').replace(/\\n/g, '')\n    if (!raw) return ''\n\n    let out = raw\n    if (textStyle.link?.url) out = `[${out}](${textStyle.link.url})`\n\n    const fontFamily = textStyle.weightedFontFamily?.fontFamily || ''\n    const isMono = textStyle.smallCaps || MONO_FONTS.has(fontFamily)\n\n    if (isMono) out = `\\`${out}\\``\n    if (textStyle.bold) out = `**${out}**`\n    if (textStyle.italic) out = `*${out}*`\n    if (textStyle.strikethrough) out = `~~${out}~~`\n\n    return out\n  }\n\n  const paragraphToMarkdown = (paragraph, docLists) => {\n    const styleType = paragraph?.paragraphStyle?.namedStyleType\n    const headingPrefix = HEADING_MAP[styleType] || ''\n\n    let line = ''\n    for (const element of paragraph?.elements || []) {\n      line += applyTextStyle(element?.textRun?.content || '', element?.textRun?.textStyle || {})\n    }\n    line = trimEndWhitespace(line)\n\n    if (!line) return ''\n\n    const bullet = paragraph?.bullet\n    if (bullet) {\n      const nestingLevel = bullet.nestingLevel || 0\n      const listMeta = docLists?.[bullet.listId]\n      const nesting = listMeta?.listProperties?.nestingLevels?.[nestingLevel]\n      const glyphType = nesting?.glyphType || ''\n      const isNumbered = LIST_NUMBER_GLYPHS.has(glyphType) && !BULLET_GLYPHS.has(glyphType)\n      const indent = '  '.repeat(Math.max(0, nestingLevel))\n      return `${indent}${isNumbered ? '1.' : '-'} ${line}`\n    }\n\n    if (headingPrefix) return `${headingPrefix} ${line}`\n    return line\n  }\n\n  const tableToMarkdown = (table, docLists) => {\n    const rows = table?.tableRows || []\n    if (!rows.length) return ''\n\n    const normalized = rows.map((row) =>\n      (row?.tableCells || []).map((cell) => {\n        const parts = []\n        for (const c of cell?.content || []) {\n          if (c?.paragraph) {\n            const p = paragraphToMarkdown(c.paragraph, docLists)\n            if (p) parts.push(p)\n          }\n        }\n        return escapeCell(parts.join('<br>'))\n      }),\n    )\n\n    const width = Math.max(...normalized.map((r) => r.length), 1)\n    const padded = normalized.map((r) => [...r, ...Array(width - r.length).fill('')])\n    const header = padded[0] || Array(width).fill('')\n    const separator = Array(width).fill('---')\n    const body = padded.slice(1)\n\n    const lines = [\n      `| ${header.join(' | ')} |`,\n      `| ${separator.join(' | ')} |`,\n      ...body.map((r) => `| ${r.join(' | ')} |`),\n    ]\n    return lines.join('\\n')\n  }\n\n  const docToPlainText = (docBodyContent) => {\n    const lines = []\n    for (const item of docBodyContent || []) {\n      if (item?.paragraph) {\n        const text = extractPlainTextFromParagraph(item.paragraph)\n        if (text) lines.push(text)\n      } else if (item?.table) {\n        for (const row of item.table.tableRows || []) {\n          const cells = (row.tableCells || []).map((cell) => {\n            const pieces = []\n            for (const contentItem of cell.content || []) {\n              if (contentItem?.paragraph) {\n                const text = extractPlainTextFromParagraph(contentItem.paragraph)\n                if (text) pieces.push(text)\n              }\n            }\n            return pieces.join(' ')\n          })\n          if (cells.some(Boolean)) lines.push(cells.join(' | '))\n        }\n      }\n    }\n    return lines.join('\\n\\n').trim()\n  }\n\n  const { documentId } = input\n  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n  const doc = await res.json()\n\n  const content = doc?.body?.content || []\n  const lists = doc?.lists || {}\n\n  const blocks = []\n  for (const item of content) {\n    if (item?.paragraph) {\n      const line = paragraphToMarkdown(item.paragraph, lists)\n      if (line) blocks.push(line)\n    } else if (item?.table) {\n      const table = tableToMarkdown(item.table, lists)\n      if (table) blocks.push(table)\n    }\n  }\n\n  const markdown = blocks.join('\\n\\n').trim()\n  if (markdown) {\n    return {\n      documentId: doc?.documentId || documentId,\n      title: doc?.title || '',\n      markdown,\n    }\n  }\n\n  // Escape hatch: return plain text if markdown conversion produced nothing.\n  return {\n    documentId: doc?.documentId || documentId,\n    title: doc?.title || '',\n    markdown: docToPlainText(content),\n  }\n}",
        "scope": "read",
        "toolset": "docs"
      },
      {
        "name": "search_docs",
        "description": "Search Google Drive for Google Docs only. Use this when the agent needs to discover Docs by name or Drive query without manually constructing a MIME type filter.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Raw Drive query string for Google Docs only. Examples: \"modifiedTime > '2024-01-01'\", \"'folderId' in parents\". Combined with the fixed Docs MIME type and name filter via AND."
            },
            "name": {
              "type": "string",
              "description": "Shorthand for name-based search. Translates to \"name contains 'value'\" and is combined with the fixed Docs MIME type."
            },
            "includeTrashed": {
              "type": "boolean",
              "description": "Include trashed Docs in results. Defaults to false."
            },
            "pageSize": {
              "type": "integer",
              "minimum": 1,
              "maximum": 1000,
              "default": 20,
              "description": "Maximum results per page. Defaults to 20. Use pageToken from the response for the next page."
            },
            "pageToken": {
              "type": "string",
              "description": "Page token from a previous search_docs response to retrieve the next page of results."
            },
            "fields": {
              "type": "string",
              "description": "Override the fields returned in each file. Defaults to 'nextPageToken,files(id,name,mimeType,modifiedTime,size,parents)'."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  const qParts = [`mimeType = 'application/vnd.google-apps.document'`]\n  if (input.query)\n    qParts.push(input.query)\n  if (input.name)\n    qParts.push(`name contains '${input.name.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, \"\\\\'\")}'`)\n  if (!input.includeTrashed)\n    qParts.push('trashed = false')\n  if (qParts.length > 0)\n    params.set('q', qParts.join(' and '))\n  params.set('fields', input.fields || 'nextPageToken,files(id,name,mimeType,modifiedTime,size,parents)')\n  params.set('pageSize', String(input.pageSize || 20))\n  if (input.pageToken)\n    params.set('pageToken', input.pageToken)\n  const res = await integration.fetch(`/files?${params.toString()}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "docs"
      },
      {
        "name": "create_document",
        "description": "Create a new empty Google Doc with the given title. Returns the created document's metadata including its documentId, which is needed for all subsequent operations on the document.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "description": "Title for the new document."
            }
          },
          "additionalProperties": true
        },
        "handlerCode": "async (input) => {\n  const { title, ...rest } = input\n  const body = {}\n  if (title !== undefined)\n    body.title = title\n  Object.assign(body, rest)\n  const res = await integration.fetch(`/documents`, { method: 'POST', body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "docs"
      },
      {
        "name": "docs_batch_update",
        "description": "Send a documents.batchUpdate request to modify a document with one or more structured requests. Supports insertText, deleteContentRange, replaceAllText, createNamedRange, updateTextStyle, updateParagraphStyle, insertTable, insertInlineImage, and more. For common operations, prefer the higher-level Docs tools.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "documentId": {
              "type": "string",
              "description": "The document ID of the Google Doc."
            },
            "requests": {
              "type": "array",
              "description": "Array of Docs API requests (insertText, updateParagraphStyle, replaceAllText, etc).",
              "items": {
                "type": "object"
              }
            },
            "writeControl": {
              "type": "object",
              "description": "Write control to ensure idempotency (requiredRevisionId, targetRevisionId)."
            },
            "includeTabStops": {
              "type": "boolean",
              "description": "Include tab stops in responses where applicable."
            }
          },
          "required": [
            "documentId",
            "requests"
          ],
          "additionalProperties": true
        },
        "handlerCode": "async (input) => {\n  const { documentId, requests, writeControl, includeTabStops } = input\n  const params = new URLSearchParams()\n  if (includeTabStops !== undefined)\n    params.set('includeTabStops', String(includeTabStops))\n  const qs = params.toString()\n  const path = `/documents/${encodeURIComponent(documentId)}:batchUpdate${qs ? `?${qs}` : ''}`\n  const body = { requests }\n  if (writeControl)\n    body.writeControl = writeControl\n  const res = await integration.fetch(path, { method: 'POST', body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "docs"
      },
      {
        "name": "append_text",
        "description": "Append plain text to the end of a Google Doc. Automatically fetches the document to find the correct end index and inserts the text there. Use this for adding content to the end of a document without needing to know the document structure.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "documentId": {
              "type": "string"
            },
            "text": {
              "type": "string"
            }
          },
          "required": [
            "documentId",
            "text"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { documentId, text } = input\n  // Get doc to find end index\n  const metaRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n  const meta = await metaRes.json()\n  const endIndex = meta?.body?.content?.[meta.body.content.length - 1]?.endIndex || 1\n  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {\n    method: 'POST',\n    body: { requests: [{ insertText: { text, location: { index: endIndex - 1 } } }] },\n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "docs"
      },
      {
        "name": "replace_all_text",
        "description": "Replace all occurrences of a text string in a Google Doc with new text. Case-sensitive by default. More efficient than the first-match tools when you need to replace every occurrence. Returns the number of occurrences replaced.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "documentId": {
              "type": "string"
            },
            "findText": {
              "type": "string"
            },
            "replaceText": {
              "type": "string"
            },
            "matchCase": {
              "type": "boolean"
            }
          },
          "required": [
            "documentId",
            "findText",
            "replaceText"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { documentId, findText, replaceText, matchCase } = input\n  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {\n    method: 'POST',\n    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: Boolean(matchCase) }, replaceText } }] },\n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "docs"
      },
      {
        "name": "style_first_match",
        "description": "Find the first occurrence of text in a document and apply a TextStyle to it (bold, italic, fontSize, foregroundColor, etc.). Uses a marker-based approach: replaces the text with a unique marker, locates the marker's position, applies the style, then restores the original text. Returns {applied: true/false}.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "documentId": {
              "type": "string"
            },
            "findText": {
              "type": "string"
            },
            "textStyle": {
              "type": "object"
            },
            "fields": {
              "type": "string"
            }
          },
          "required": [
            "documentId",
            "findText",
            "textStyle"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { documentId, findText, textStyle, fields } = input\n  // 1) Find first match via replaceAllText with unique marker\n  const marker = `__CMD_MARK_${Date.now()}__`\n  const replaceRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {\n    method: 'POST',\n    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: false }, replaceText: marker } }] },\n  })\n  const rep = await replaceRes.json()\n  // 2) Get doc, locate marker, compute indices\n  const getRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n  const doc = await getRes.json()\n  let startIndex = -1\n  let endIndex = -1\n  for (const el of (doc?.body?.content || [])) {\n    const p = el.paragraph\n    if (!p)\n      continue\n    for (const e of (p.elements || [])) {\n      const t = e?.textRun?.content\n      if (!t)\n        continue\n      const idx = t.indexOf(marker)\n      if (idx >= 0) {\n        const elStart = e.startIndex || 1\n        startIndex = elStart + idx\n        endIndex = startIndex + marker.length\n        break\n      }\n    }\n    if (startIndex >= 0)\n      break\n  }\n  if (startIndex < 0)\n    return rep\n  // 3) Apply style and restore original text\n  const requests = []\n  requests.push({ updateTextStyle: { range: { startIndex, endIndex }, textStyle, fields: fields || Object.keys(textStyle || {}).join(',') } })\n  requests.push({ replaceAllText: { containsText: { text: marker, matchCase: true }, replaceText: findText } })\n  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, { method: 'POST', body: { requests } })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "docs"
      },
      {
        "name": "insert_text_after_first_match",
        "description": "Find the first occurrence of text and insert new text immediately before or after it. Useful for inserting content at a specific anchor point in the document without knowing exact character indices. Returns {applied: true/false}.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "documentId": {
              "type": "string"
            },
            "findText": {
              "type": "string"
            },
            "insertText": {
              "type": "string"
            },
            "position": {
              "type": "string",
              "enum": [
                "after",
                "before"
              ],
              "default": "after"
            }
          },
          "required": [
            "documentId",
            "findText",
            "insertText"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { documentId, findText, insertText, position } = input\n  const marker = `__CMD_MARK_${Date.now()}__`\n  // Replace first occurrence by marker only (simulate single by replacing all, then revert later to first span)\n  const replaceRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {\n    method: 'POST',\n    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: false }, replaceText: marker } }] },\n  })\n  await replaceRes.json()\n\n  const getRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n  const doc = await getRes.json()\n  let insertIndex = -1\n  for (const el of (doc?.body?.content || [])) {\n    const p = el.paragraph\n    if (!p)\n      continue\n    for (const e of (p.elements || [])) {\n      const t = e?.textRun?.content\n      if (!t)\n        continue\n      const idx = t.indexOf(marker)\n      if (idx >= 0) {\n        const elStart = e.startIndex || 1\n        const startIndex = elStart + idx\n        const endIndex = startIndex + marker.length\n        insertIndex = position === 'before' ? startIndex : endIndex\n        break\n      }\n    }\n    if (insertIndex >= 0)\n      break\n  }\n  if (insertIndex < 0) {\n    const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n    const got = await confirm.json()\n    return { documentId: got?.documentId || documentId, applied: false, replies: [] }\n  }\n\n  const requests = []\n  requests.push({ insertText: { text: insertText, location: { index: insertIndex } } })\n  // restore marker back to original findText everywhere\n  requests.push({ replaceAllText: { containsText: { text: marker, matchCase: true }, replaceText: findText } })\n  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, { method: 'POST', body: { requests } })\n  const out = await res.json()\n  if (out?.documentId || Array.isArray(out?.replies))\n    return { ...out, applied: true }\n  const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n  const got = await confirm.json()\n  return { documentId: got?.documentId || documentId, applied: true, replies: Array.isArray(out?.replies) ? out.replies : [] }\n}",
        "scope": "write",
        "toolset": "docs"
      },
      {
        "name": "insert_table_after_first_match",
        "description": "Find the first occurrence of text and insert a table with the specified number of rows and columns nearby. Returns {applied: true/false}.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "documentId": {
              "type": "string"
            },
            "findText": {
              "type": "string"
            },
            "rows": {
              "type": "number",
              "minimum": 1
            },
            "columns": {
              "type": "number",
              "minimum": 1
            },
            "position": {
              "type": "string",
              "enum": [
                "after",
                "before"
              ],
              "default": "after"
            }
          },
          "required": [
            "documentId",
            "findText",
            "rows",
            "columns"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { documentId, findText, rows, columns, position } = input\n  const marker = `__CMD_MARK_${Date.now()}__`\n  const replaceRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {\n    method: 'POST',\n    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: false }, replaceText: marker } }] },\n  })\n  await replaceRes.json()\n\n  const getRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n  const doc = await getRes.json()\n  let baseIndex = -1\n  for (const el of (doc?.body?.content || [])) {\n    const p = el.paragraph\n    if (!p)\n      continue\n    for (const e of (p.elements || [])) {\n      const t = e?.textRun?.content\n      if (!t)\n        continue\n      const idx = t.indexOf(marker)\n      if (idx >= 0) {\n        const elStart = e.startIndex || 1\n        const startIndex = elStart + idx\n        const endIndex = startIndex + marker.length\n        baseIndex = position === 'before' ? startIndex : endIndex\n        break\n      }\n    }\n    if (baseIndex >= 0)\n      break\n  }\n  if (baseIndex < 0) {\n    const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n    const got = await confirm.json()\n    return { documentId: got?.documentId || documentId, applied: false, replies: [] }\n  }\n\n  const requests = []\n  requests.push({ insertTable: { location: { index: baseIndex }, rows, columns } })\n  requests.push({ replaceAllText: { containsText: { text: marker, matchCase: true }, replaceText: findText } })\n  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, { method: 'POST', body: { requests } })\n  const out = await res.json()\n  if (out?.documentId || Array.isArray(out?.replies))\n    return { ...out, applied: true }\n  const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n  const got = await confirm.json()\n  return { documentId: got?.documentId || documentId, applied: true, replies: Array.isArray(out?.replies) ? out.replies : [] }\n}",
        "scope": "write",
        "toolset": "docs"
      },
      {
        "name": "insert_page_break_after_first_match",
        "description": "Find the first occurrence of text and insert a page break nearby. Useful for structuring long documents. Returns {applied: true/false}.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "documentId": {
              "type": "string"
            },
            "findText": {
              "type": "string"
            },
            "position": {
              "type": "string",
              "enum": [
                "after",
                "before"
              ],
              "default": "after"
            }
          },
          "required": [
            "documentId",
            "findText"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { documentId, findText, position } = input\n  const marker = `__CMD_MARK_${Date.now()}__`\n  const replaceRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {\n    method: 'POST',\n    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: false }, replaceText: marker } }] },\n  })\n  await replaceRes.json()\n\n  const getRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n  const doc = await getRes.json()\n  let baseIndex = -1\n  for (const el of (doc?.body?.content || [])) {\n    const p = el.paragraph\n    if (!p)\n      continue\n    for (const e of (p.elements || [])) {\n      const t = e?.textRun?.content\n      if (!t)\n        continue\n      const idx = t.indexOf(marker)\n      if (idx >= 0) {\n        const elStart = e.startIndex || 1\n        const startIndex = elStart + idx\n        const endIndex = startIndex + marker.length\n        baseIndex = position === 'before' ? startIndex : endIndex\n        break\n      }\n    }\n    if (baseIndex >= 0)\n      break\n  }\n  if (baseIndex < 0) {\n    const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n    const got = await confirm.json()\n    return { documentId: got?.documentId || documentId, applied: false, replies: [] }\n  }\n\n  const requests = []\n  requests.push({ insertPageBreak: { location: { index: baseIndex } } })\n  requests.push({ replaceAllText: { containsText: { text: marker, matchCase: true }, replaceText: findText } })\n  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, { method: 'POST', body: { requests } })\n  const out = await res.json()\n  if (out?.documentId || Array.isArray(out?.replies))\n    return { ...out, applied: true }\n  const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n  const got = await confirm.json()\n  return { documentId: got?.documentId || documentId, applied: true, replies: Array.isArray(out?.replies) ? out.replies : [] }\n}",
        "scope": "write",
        "toolset": "docs"
      },
      {
        "name": "insert_inline_image_after_first_match",
        "description": "Find the first occurrence of text and insert an inline image nearby, referenced by URL. Returns {applied: true/false}.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "documentId": {
              "type": "string"
            },
            "findText": {
              "type": "string"
            },
            "uri": {
              "type": "string"
            },
            "position": {
              "type": "string",
              "enum": [
                "after",
                "before"
              ],
              "default": "after"
            }
          },
          "required": [
            "documentId",
            "findText",
            "uri"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { documentId, findText, uri, altText, position } = input\n  const marker = `__CMD_MARK_${Date.now()}__`\n  const replaceRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {\n    method: 'POST',\n    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: false }, replaceText: marker } }] },\n  })\n  await replaceRes.json()\n\n  const getRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n  const doc = await getRes.json()\n  let baseIndex = -1\n  for (const el of (doc?.body?.content || [])) {\n    const p = el.paragraph\n    if (!p)\n      continue\n    for (const e of (p.elements || [])) {\n      const t = e?.textRun?.content\n      if (!t)\n        continue\n      const idx = t.indexOf(marker)\n      if (idx >= 0) {\n        const elStart = e.startIndex || 1\n        const startIndex = elStart + idx\n        const endIndex = startIndex + marker.length\n        baseIndex = position === 'before' ? startIndex : endIndex\n        break\n      }\n    }\n    if (baseIndex >= 0)\n      break\n  }\n  if (baseIndex < 0)\n    return { ok: true }\n\n  const requests = []\n  requests.push({ insertInlineImage: { location: { index: baseIndex }, uri } })\n  requests.push({ replaceAllText: { containsText: { text: marker, matchCase: true }, replaceText: findText } })\n  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, { method: 'POST', body: { requests } })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "docs"
      },
      {
        "name": "delete_first_match",
        "description": "Find the first occurrence of text in the document and delete it. Only the first match is removed. Use replace_all_text with an empty string to remove all occurrences. Returns {applied: true/false}.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "documentId": {
              "type": "string"
            },
            "findText": {
              "type": "string"
            }
          },
          "required": [
            "documentId",
            "findText"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { documentId, findText } = input\n  const marker = `__CMD_MARK_${Date.now()}__`\n  const replaceRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {\n    method: 'POST',\n    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: false }, replaceText: marker } }] },\n  })\n  await replaceRes.json()\n\n  const getRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n  const doc = await getRes.json()\n  let startIndex = -1\n  let endIndex = -1\n  for (const el of (doc?.body?.content || [])) {\n    const p = el.paragraph\n    if (!p)\n      continue\n    for (const e of (p.elements || [])) {\n      const t = e?.textRun?.content\n      if (!t)\n        continue\n      const idx = t.indexOf(marker)\n      if (idx >= 0) {\n        const elStart = e.startIndex || 1\n        startIndex = elStart + idx\n        endIndex = startIndex + marker.length\n        break\n      }\n    }\n    if (startIndex >= 0)\n      break\n  }\n  if (startIndex < 0) {\n    const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n    const got = await confirm.json()\n    return { documentId: got?.documentId || documentId, applied: false, replies: [] }\n  }\n\n  const requests = []\n  requests.push({ deleteContentRange: { range: { startIndex, endIndex } } })\n  // also clean any remaining markers\n  requests.push({ replaceAllText: { containsText: { text: marker, matchCase: true }, replaceText: '' } })\n  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, { method: 'POST', body: { requests } })\n  const out = await res.json()\n  if (out?.documentId || Array.isArray(out?.replies))\n    return { ...out, applied: true }\n  const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n  const got = await confirm.json()\n  return { documentId: got?.documentId || documentId, applied: true, replies: Array.isArray(out?.replies) ? out.replies : [] }\n}",
        "scope": "write",
        "toolset": "docs"
      },
      {
        "name": "update_paragraph_style_for_first_match",
        "description": "Find the first occurrence of text and update the paragraph style for the paragraph containing it. Use to apply heading levels (HEADING_1 through HEADING_6), NORMAL_TEXT, or adjust spacing, alignment, and indentation. Returns {applied: true/false}.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "documentId": {
              "type": "string"
            },
            "findText": {
              "type": "string"
            },
            "paragraphStyle": {
              "type": "object"
            },
            "fields": {
              "type": "string"
            }
          },
          "required": [
            "documentId",
            "findText",
            "paragraphStyle"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { documentId, findText, paragraphStyle, fields } = input\n  const marker = `__CMD_MARK_${Date.now()}__`\n  const replaceRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {\n    method: 'POST',\n    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: false }, replaceText: marker } }] },\n  })\n  await replaceRes.json()\n\n  const getRes = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n  const doc = await getRes.json()\n  let paragraphStart = -1\n  let paragraphEnd = -1\n  for (const el of (doc?.body?.content || [])) {\n    const p = el.paragraph\n    if (!p)\n      continue\n    for (const e of (p.elements || [])) {\n      const t = e?.textRun?.content\n      if (!t)\n        continue\n      const idx = t.indexOf(marker)\n      if (idx >= 0) {\n        paragraphStart = p.elements?.[0]?.startIndex || e.startIndex || 1\n        paragraphEnd = (p.elements?.[p.elements.length - 1]?.endIndex) || (e.endIndex) || (paragraphStart + marker.length)\n        break\n      }\n    }\n    if (paragraphStart >= 0)\n      break\n  }\n  if (paragraphStart < 0) {\n    const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n    const got = await confirm.json()\n    return { documentId: got?.documentId || documentId, applied: false, replies: [] }\n  }\n\n  const requests = []\n  requests.push({ updateParagraphStyle: { range: { startIndex: paragraphStart, endIndex: paragraphEnd }, paragraphStyle, fields: fields || Object.keys(paragraphStyle || {}).join(',') } })\n  requests.push({ replaceAllText: { containsText: { text: marker, matchCase: true }, replaceText: findText } })\n  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, { method: 'POST', body: { requests } })\n  const out = await res.json()\n  if (out?.documentId || Array.isArray(out?.replies))\n    return { ...out, applied: true }\n  const confirm = await integration.fetch(`/documents/${encodeURIComponent(documentId)}`)\n  const got = await confirm.json()\n  return { documentId: got?.documentId || documentId, applied: true, replies: Array.isArray(out?.replies) ? out.replies : [] }\n}",
        "scope": "write",
        "toolset": "docs"
      },
      {
        "name": "update_document_style",
        "description": "Update document-level style properties such as page size (pageSize.width, pageSize.height in pt), margins (marginTop, marginBottom, marginLeft, marginRight in pt), and page orientation. Does not affect individual paragraph or text styles.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "documentId": {
              "type": "string"
            },
            "documentStyle": {
              "type": "object",
              "description": "Docs API DocumentStyle object"
            },
            "fields": {
              "type": "string"
            }
          },
          "required": [
            "documentId",
            "documentStyle"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { documentId, documentStyle, fields } = input\n  const res = await integration.fetch(`/documents/${encodeURIComponent(documentId)}:batchUpdate`, {\n    method: 'POST',\n    body: { requests: [{ updateDocumentStyle: { documentStyle, fields: fields || Object.keys(documentStyle || {}).join(',') } }] },\n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "docs"
      },
      {
        "name": "get_spreadsheet",
        "description": "Retrieve spreadsheet metadata including all sheet names, IDs, and properties. Set includeGridData=false (the default) to get only metadata without cell values. Use read_sheet for cell content. Use the 'fields' parameter to limit the response (e.g. fields='sheets.properties' to get only sheet names and IDs). The spreadsheetId appears in the URL: https://docs.google.com/spreadsheets/d/{spreadsheetId}/.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "spreadsheetId"
          ],
          "properties": {
            "spreadsheetId": {
              "type": "string",
              "description": "Spreadsheet ID. Found in the spreadsheet URL: https://docs.google.com/spreadsheets/d/{spreadsheetId}/."
            },
            "includeGridData": {
              "type": "boolean",
              "description": "Whether to include cell grid data. Defaults to false. Set to true only when you need cell values -- use get_values or batch_get_values for targeted range reads instead."
            },
            "ranges": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Optional A1 notation ranges to include when includeGridData is true. Example: ['Sheet1!A1:D10', 'Sheet2!A:A']."
            },
            "fields": {
              "type": "string",
              "description": "Partial response fields selector to reduce response size. Example: 'sheets.properties' to get only sheet names and IDs without cell data. See Sheets API fields reference."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { spreadsheetId, includeGridData, ranges } = input\n  const params = new URLSearchParams()\n  if (includeGridData !== undefined)\n    params.set('includeGridData', String(includeGridData))\n  if (Array.isArray(ranges))\n    ranges.forEach(r => params.append('ranges', String(r)))\n  if (input.fields)\n    params.set('fields', input.fields)\n  const qs = params.toString()\n  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}${qs ? `?${qs}` : ''}`\n  const res = await integration.fetch(path)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "sheets"
      },
      {
        "name": "search_sheets",
        "description": "Search Google Drive for Google Sheets only. Use this when the agent needs to discover spreadsheets by name or Drive query without manually constructing a MIME type filter.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Raw Drive query string for Google Sheets only. Examples: \"modifiedTime > '2024-01-01'\", \"'folderId' in parents\". Combined with the fixed Sheets MIME type and name filter via AND."
            },
            "name": {
              "type": "string",
              "description": "Shorthand for name-based search. Translates to \"name contains 'value'\" and is combined with the fixed Sheets MIME type."
            },
            "includeTrashed": {
              "type": "boolean",
              "description": "Include trashed Sheets in results. Defaults to false."
            },
            "pageSize": {
              "type": "integer",
              "minimum": 1,
              "maximum": 1000,
              "default": 20,
              "description": "Maximum results per page. Defaults to 20. Use pageToken from the response for the next page."
            },
            "pageToken": {
              "type": "string",
              "description": "Page token from a previous search_sheets response to retrieve the next page of results."
            },
            "fields": {
              "type": "string",
              "description": "Override the fields returned in each file. Defaults to 'nextPageToken,files(id,name,mimeType,modifiedTime,size,parents)'."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  const qParts = [`mimeType = 'application/vnd.google-apps.spreadsheet'`]\n  if (input.query)\n    qParts.push(input.query)\n  if (input.name)\n    qParts.push(`name contains '${input.name.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, \"\\\\'\")}'`)\n  if (!input.includeTrashed)\n    qParts.push('trashed = false')\n  if (qParts.length > 0)\n    params.set('q', qParts.join(' and '))\n  params.set('fields', input.fields || 'nextPageToken,files(id,name,mimeType,modifiedTime,size,parents)')\n  params.set('pageSize', String(input.pageSize || 20))\n  if (input.pageToken)\n    params.set('pageToken', input.pageToken)\n  const res = await integration.fetch(`/files?${params.toString()}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "sheets"
      },
      {
        "name": "read_sheet",
        "description": "Read cell values from a sheet range and return as a Markdown table with A1 column headers and row numbers. Use this to read and understand spreadsheet data -- the coordinates in the output can be used directly with update_values and append_values for writes. Supports optional valueRenderOption for formulas or raw numbers. Use get_spreadsheet first to discover sheet names.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "spreadsheetId"
          ],
          "properties": {
            "spreadsheetId": {
              "type": "string",
              "description": "Spreadsheet ID from URL: https://docs.google.com/spreadsheets/d/{spreadsheetId}/edit"
            },
            "range": {
              "type": "string",
              "description": "A1 notation range to read, e.g. 'Sheet1!A1:D20'. Defaults to 'A1:Z1000'."
            },
            "valueRenderOption": {
              "type": "string",
              "enum": [
                "FORMATTED_VALUE",
                "UNFORMATTED_VALUE",
                "FORMULA"
              ],
              "description": "How values should be represented in the output."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const toColumnName = (index) => {\n    let n = index + 1\n    let out = ''\n    while (n > 0) {\n      const rem = (n - 1) % 26\n      out = String.fromCharCode(65 + rem) + out\n      n = Math.floor((n - 1) / 26)\n    }\n    return out\n  }\n\n  const columnNameToIndex = (name) => {\n    let value = 0\n    for (const ch of name.toUpperCase()) {\n      const code = ch.charCodeAt(0)\n      if (code < 65 || code > 90) continue\n      value = value * 26 + (code - 64)\n    }\n    return Math.max(0, value - 1)\n  }\n\n  const parseResolvedRange = (resolvedRange) => {\n    // Examples: \"Sheet1!A1:D5\", \"Sheet1!B:B\", \"Sheet1!2:9\"\n    const a1 = String(resolvedRange || '').split('!')[1] || ''\n    const [start = 'A1'] = a1.split(':')\n    const letters = (start.match(/[A-Za-z]+/) || ['A'])[0]\n    const rowDigits = (start.match(/\\d+/) || ['1'])[0]\n    return {\n      startColumn: columnNameToIndex(letters),\n      startRow: Math.max(1, parseInt(rowDigits, 10) || 1),\n    }\n  }\n\n  const escapeCell = (value) =>\n    String(value ?? '')\n      .replace(/\\|/g, '\\\\|')\n      .replace(/\\r?\\n/g, '<br>')\n\n  const spreadsheetId = input.spreadsheetId\n  const range = input.range || 'A1:Z1000'\n  const params = new URLSearchParams()\n  if (input.valueRenderOption) params.set('valueRenderOption', input.valueRenderOption)\n\n  const qs = params.toString()\n  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}${qs ? `?${qs}` : ''}`\n  const res = await integration.fetch(path)\n  const payload = await res.json()\n\n  const values = Array.isArray(payload?.values) ? payload.values : []\n  const resolvedRange = payload?.range || range\n  const { startColumn, startRow } = parseResolvedRange(resolvedRange)\n\n  const width = Math.max(1, ...values.map((row) => (Array.isArray(row) ? row.length : 0)))\n  const headerCells = Array.from({ length: width }, (_, i) => toColumnName(startColumn + i))\n  const lines = [\n    `|   | ${headerCells.join(' | ')} |`,\n    `|---|${Array(width).fill('---').join('|')}|`,\n  ]\n\n  for (let i = 0; i < values.length; i += 1) {\n    const row = Array.isArray(values[i]) ? values[i] : []\n    const padded = [...row, ...Array(width - row.length).fill('')]\n    const escaped = padded.map((cell) => escapeCell(cell))\n    lines.push(`| ${startRow + i} | ${escaped.join(' | ')} |`)\n  }\n\n  return {\n    spreadsheetId,\n    range: resolvedRange,\n    rowCount: values.length,\n    columnCount: width,\n    markdown: lines.join('\\n'),\n  }\n}",
        "scope": "read",
        "toolset": "sheets"
      },
      {
        "name": "create_spreadsheet",
        "description": "Create a new Google Spreadsheet. Accepts a full spreadsheet resource body, allowing you to specify the title, initial sheets, and cell data. Minimum: provide {title: 'My Spreadsheet'}. Returns the created spreadsheet including its spreadsheetId.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "properties": {
              "type": "object",
              "description": "Spreadsheet properties"
            },
            "sheets": {
              "type": "array",
              "items": {
                "type": "object"
              }
            },
            "namedRanges": {
              "type": "array",
              "items": {
                "type": "object"
              }
            },
            "dataSources": {
              "type": "array",
              "items": {
                "type": "object"
              }
            }
          },
          "additionalProperties": true
        },
        "handlerCode": "async (input) => {\n  const path = `/spreadsheets`\n  const res = await integration.fetch(path, { method: 'POST', body: input })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "sheets"
      },
      {
        "name": "update_values",
        "description": "Write values to a specific A1 range, replacing existing content. Use valueInputOption='USER_ENTERED' to parse values as the user would type them (supports formulas, dates, currency). Use 'RAW' to store values as literal strings. Provide values as a 2D array (rows of columns).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "spreadsheetId",
            "range",
            "values"
          ],
          "properties": {
            "spreadsheetId": {
              "type": "string"
            },
            "range": {
              "type": "string"
            },
            "values": {
              "type": "array",
              "items": {
                "type": "array",
                "items": {}
              }
            },
            "valueInputOption": {
              "type": "string",
              "enum": [
                "RAW",
                "USER_ENTERED"
              ]
            },
            "includeValuesInResponse": {
              "type": "boolean"
            },
            "responseValueRenderOption": {
              "type": "string",
              "enum": [
                "FORMATTED_VALUE",
                "UNFORMATTED_VALUE",
                "FORMULA"
              ]
            },
            "responseDateTimeRenderOption": {
              "type": "string",
              "enum": [
                "SERIAL_NUMBER",
                "FORMATTED_STRING"
              ]
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { spreadsheetId, range, values, valueInputOption, includeValuesInResponse, responseValueRenderOption, responseDateTimeRenderOption } = input\n  const params = new URLSearchParams()\n  if (valueInputOption)\n    params.set('valueInputOption', valueInputOption)\n  if (includeValuesInResponse !== undefined)\n    params.set('includeValuesInResponse', String(includeValuesInResponse))\n  if (responseValueRenderOption)\n    params.set('responseValueRenderOption', responseValueRenderOption)\n  if (responseDateTimeRenderOption)\n    params.set('responseDateTimeRenderOption', responseDateTimeRenderOption)\n  const qs = params.toString()\n  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}${qs ? `?${qs}` : ''}`\n  const res = await integration.fetch(path, { method: 'PUT', body: { values } })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "sheets"
      },
      {
        "name": "append_values",
        "description": "Append rows of values after the last row of existing data in a range. Useful for adding new rows to a table without knowing the exact next row number. Uses USER_ENTERED valueInputOption by default. The range determines which sheet to append to.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "spreadsheetId",
            "range",
            "values"
          ],
          "properties": {
            "spreadsheetId": {
              "type": "string"
            },
            "range": {
              "type": "string"
            },
            "values": {
              "type": "array",
              "items": {
                "type": "array",
                "items": {}
              }
            },
            "valueInputOption": {
              "type": "string",
              "enum": [
                "RAW",
                "USER_ENTERED"
              ]
            },
            "insertDataOption": {
              "type": "string",
              "enum": [
                "OVERWRITE",
                "INSERT_ROWS"
              ]
            },
            "includeValuesInResponse": {
              "type": "boolean"
            },
            "responseValueRenderOption": {
              "type": "string",
              "enum": [
                "FORMATTED_VALUE",
                "UNFORMATTED_VALUE",
                "FORMULA"
              ]
            },
            "responseDateTimeRenderOption": {
              "type": "string",
              "enum": [
                "SERIAL_NUMBER",
                "FORMATTED_STRING"
              ]
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { spreadsheetId, range, values, valueInputOption, insertDataOption, includeValuesInResponse, responseValueRenderOption, responseDateTimeRenderOption } = input\n  const params = new URLSearchParams()\n  if (valueInputOption)\n    params.set('valueInputOption', valueInputOption)\n  if (insertDataOption)\n    params.set('insertDataOption', insertDataOption)\n  if (includeValuesInResponse !== undefined)\n    params.set('includeValuesInResponse', String(includeValuesInResponse))\n  if (responseValueRenderOption)\n    params.set('responseValueRenderOption', responseValueRenderOption)\n  if (responseDateTimeRenderOption)\n    params.set('responseDateTimeRenderOption', responseDateTimeRenderOption)\n  const qs = params.toString()\n  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append${qs ? `?${qs}` : ''}`\n  const res = await integration.fetch(path, { method: 'POST', body: { values } })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "sheets"
      },
      {
        "name": "batch_update_values",
        "description": "Write values to multiple A1 ranges in a single API call. More efficient than calling update_values multiple times. Provide a data array where each item has range and values. Use valueInputOption='USER_ENTERED' for formulas and dates.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "spreadsheetId",
            "data"
          ],
          "properties": {
            "spreadsheetId": {
              "type": "string"
            },
            "data": {
              "type": "array",
              "items": {
                "type": "object",
                "required": [
                  "range",
                  "values"
                ],
                "properties": {
                  "range": {
                    "type": "string"
                  },
                  "values": {
                    "type": "array",
                    "items": {
                      "type": "array",
                      "items": {}
                    }
                  },
                  "majorDimension": {
                    "type": "string",
                    "enum": [
                      "ROWS",
                      "COLUMNS"
                    ]
                  }
                }
              }
            },
            "valueInputOption": {
              "type": "string",
              "enum": [
                "RAW",
                "USER_ENTERED"
              ]
            },
            "includeValuesInResponse": {
              "type": "boolean"
            },
            "responseValueRenderOption": {
              "type": "string",
              "enum": [
                "FORMATTED_VALUE",
                "UNFORMATTED_VALUE",
                "FORMULA"
              ]
            },
            "responseDateTimeRenderOption": {
              "type": "string",
              "enum": [
                "SERIAL_NUMBER",
                "FORMATTED_STRING"
              ]
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { spreadsheetId, data, valueInputOption, includeValuesInResponse, responseValueRenderOption, responseDateTimeRenderOption } = input\n  const params = new URLSearchParams()\n  if (valueInputOption)\n    params.set('valueInputOption', valueInputOption)\n  if (includeValuesInResponse !== undefined)\n    params.set('includeValuesInResponse', String(includeValuesInResponse))\n  if (responseValueRenderOption)\n    params.set('responseValueRenderOption', responseValueRenderOption)\n  if (responseDateTimeRenderOption)\n    params.set('responseDateTimeRenderOption', responseDateTimeRenderOption)\n  const qs = params.toString()\n  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate${qs ? `?${qs}` : ''}`\n  const res = await integration.fetch(path, { method: 'POST', body: { data } })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "sheets"
      },
      {
        "name": "clear_values",
        "description": "Clear all values (but not formatting) in the specified A1 range. The cells remain but their content is removed. To clear formatting as well, use sheets_batch_update with a repeatCell request.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "spreadsheetId",
            "range"
          ],
          "properties": {
            "spreadsheetId": {
              "type": "string"
            },
            "range": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { spreadsheetId, range } = input\n  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:clear`\n  const res = await integration.fetch(path, { method: 'POST', body: {} })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "sheets"
      },
      {
        "name": "batch_clear_values",
        "description": "Clear values from multiple A1 ranges in a single API call. More efficient than calling clear_values multiple times.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "spreadsheetId",
            "ranges"
          ],
          "properties": {
            "spreadsheetId": {
              "type": "string"
            },
            "ranges": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { spreadsheetId, ranges } = input\n  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchClear`\n  const res = await integration.fetch(path, { method: 'POST', body: { ranges } })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "sheets"
      },
      {
        "name": "sheets_batch_update",
        "description": "Send a spreadsheets.batchUpdate request for structural changes such as addSheet, deleteSheet, duplicateSheet, insertDimension, deleteDimension, mergeCells, sortRange, addConditionalFormatRule, and more. Accepts a requests array. Use update_values or batch_update_values for writing cell data.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "spreadsheetId",
            "requests"
          ],
          "properties": {
            "spreadsheetId": {
              "type": "string"
            },
            "requests": {
              "type": "array",
              "items": {
                "type": "object"
              }
            },
            "includeSpreadsheetInResponse": {
              "type": "boolean"
            },
            "responseRanges": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "responseIncludeGridData": {
              "type": "boolean"
            }
          },
          "additionalProperties": true
        },
        "handlerCode": "async (input) => {\n  const { spreadsheetId, requests, includeSpreadsheetInResponse, responseRanges, responseIncludeGridData } = input\n  const params = new URLSearchParams()\n  if (includeSpreadsheetInResponse !== undefined)\n    params.set('includeSpreadsheetInResponse', String(includeSpreadsheetInResponse))\n  if (Array.isArray(responseRanges))\n    responseRanges.forEach(r => params.append('responseRanges', String(r)))\n  if (responseIncludeGridData !== undefined)\n    params.set('responseIncludeGridData', String(responseIncludeGridData))\n  const qs = params.toString()\n  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate${qs ? `?${qs}` : ''}`\n  const res = await integration.fetch(path, { method: 'POST', body: { requests } })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "sheets"
      },
      {
        "name": "copy_to_spreadsheet",
        "description": "Copy a specific sheet (tab) from one spreadsheet to another. Provide the source spreadsheetId, the sheetId (integer, from get_spreadsheet), and the destination spreadsheetId. Returns the copied sheet's properties in the destination spreadsheet.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "spreadsheetId",
            "sheetId",
            "destinationSpreadsheetId"
          ],
          "properties": {
            "spreadsheetId": {
              "type": "string",
              "description": "Source spreadsheet ID"
            },
            "sheetId": {
              "type": "integer",
              "description": "Source sheet numeric ID"
            },
            "destinationSpreadsheetId": {
              "type": "string",
              "description": "Destination spreadsheet ID"
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { spreadsheetId, sheetId, destinationSpreadsheetId } = input\n  const path = `/spreadsheets/${encodeURIComponent(spreadsheetId)}/sheets/${encodeURIComponent(sheetId)}:copyTo`\n  const res = await integration.fetch(path, { method: 'POST', body: { destinationSpreadsheetId } })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "sheets"
      },
      {
        "name": "read_presentation",
        "description": "Read a Google Slides presentation and return a human-readable summary including the title, slide count, and text content extracted from each slide. Returns the text found in all shapes on each slide with slide IDs for reference. Use this to understand what is in a presentation before editing. For low-level modifications, use slides_batch_update.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "presentationId"
          ],
          "properties": {
            "presentationId": {
              "type": "string",
              "description": "ID of the presentation."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const extractSlideText = (slide) => {\n    const lines = []\n    for (const element of slide?.pageElements || []) {\n      const textElements = element?.shape?.text?.textElements || []\n      let combined = ''\n      for (const t of textElements) {\n        combined += t?.textRun?.content || ''\n      }\n      const trimmed = combined\n        .split('\\n')\n        .map((line) => line.trim())\n        .filter(Boolean)\n      lines.push(...trimmed)\n    }\n    return lines\n  }\n\n  const { presentationId } = input\n  const path = `/presentations/${encodeURIComponent(presentationId)}`\n  const res = await integration.fetch(path)\n  const presentation = await res.json()\n\n  const title = presentation?.title || 'Untitled presentation'\n  const deckId = presentation?.presentationId || presentationId\n  const slides = presentation?.slides || []\n\n  const lines = [\n    `Presentation: \"${title}\" (ID: ${deckId})`,\n    `URL: https://docs.google.com/presentation/d/${deckId}/edit`,\n    `Total Slides: ${slides.length}`,\n    '',\n  ]\n\n  for (let i = 0; i < slides.length; i += 1) {\n    const slide = slides[i]\n    const slideId = slide?.objectId || `slide_${i + 1}`\n    const elementCount = (slide?.pageElements || []).length\n    lines.push(`Slide ${i + 1}: ID ${slideId}, ${elementCount} element(s)`)\n\n    const textLines = extractSlideText(slide)\n    if (!textLines.length) {\n      lines.push(' > (No text content)')\n    } else {\n      for (const text of textLines) lines.push(` > ${text}`)\n    }\n    lines.push('')\n  }\n\n  return lines.join('\\n').trim()\n}",
        "scope": "read",
        "toolset": "slides"
      },
      {
        "name": "search_slides",
        "description": "Search Google Drive for Google Slides only. Use this when the agent needs to discover presentations by name or Drive query without manually constructing a MIME type filter.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Raw Drive query string for Google Slides only. Examples: \"modifiedTime > '2024-01-01'\", \"'folderId' in parents\". Combined with the fixed Slides MIME type and name filter via AND."
            },
            "name": {
              "type": "string",
              "description": "Shorthand for name-based search. Translates to \"name contains 'value'\" and is combined with the fixed Slides MIME type."
            },
            "includeTrashed": {
              "type": "boolean",
              "description": "Include trashed Slides in results. Defaults to false."
            },
            "pageSize": {
              "type": "integer",
              "minimum": 1,
              "maximum": 1000,
              "default": 20,
              "description": "Maximum results per page. Defaults to 20. Use pageToken from the response for the next page."
            },
            "pageToken": {
              "type": "string",
              "description": "Page token from a previous search_slides response to retrieve the next page of results."
            },
            "fields": {
              "type": "string",
              "description": "Override the fields returned in each file. Defaults to 'nextPageToken,files(id,name,mimeType,modifiedTime,size,parents)'."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  const qParts = [`mimeType = 'application/vnd.google-apps.presentation'`]\n  if (input.query)\n    qParts.push(input.query)\n  if (input.name)\n    qParts.push(`name contains '${input.name.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, \"\\\\'\")}'`)\n  if (!input.includeTrashed)\n    qParts.push('trashed = false')\n  if (qParts.length > 0)\n    params.set('q', qParts.join(' and '))\n  params.set('fields', input.fields || 'nextPageToken,files(id,name,mimeType,modifiedTime,size,parents)')\n  params.set('pageSize', String(input.pageSize || 20))\n  if (input.pageToken)\n    params.set('pageToken', input.pageToken)\n  const res = await integration.fetch(`/files?${params.toString()}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "slides"
      },
      {
        "name": "get_page_thumbnail",
        "description": "Generate a thumbnail image URL for a specific slide (page) in a presentation. Requires the presentation ID and the slide's objectId (page ID from read_presentation). Returns a contentUrl for the thumbnail image. Useful for previewing slides.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "presentationId",
            "pageObjectId"
          ],
          "properties": {
            "presentationId": {
              "type": "string",
              "description": "ID of the presentation."
            },
            "pageObjectId": {
              "type": "string",
              "description": "Object ID of the page (slide)."
            },
            "thumbnailProperties.thumbnailSize": {
              "type": "string",
              "enum": [
                "THUMBNAIL_SIZE_UNSPECIFIED",
                "LARGE",
                "MEDIUM",
                "SMALL"
              ],
              "description": "Requested size hint for the thumbnail."
            },
            "thumbnailProperties.mimeType": {
              "type": "string",
              "enum": [
                "PNG",
                "JPEG"
              ],
              "description": "Requested image MIME type."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { presentationId, pageObjectId } = input\n  const params = new URLSearchParams()\n  if (input['thumbnailProperties.thumbnailSize'])\n    params.set('thumbnailProperties.thumbnailSize', String(input['thumbnailProperties.thumbnailSize']))\n  if (input['thumbnailProperties.mimeType'])\n    params.set('thumbnailProperties.mimeType', String(input['thumbnailProperties.mimeType']))\n  const qs = params.toString()\n  const path = `/presentations/${encodeURIComponent(presentationId)}/pages/${encodeURIComponent(pageObjectId)}/thumbnail${qs ? `?${qs}` : ''}`\n  const res = await integration.fetch(path)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "slides"
      },
      {
        "name": "create_presentation",
        "description": "Create a new empty Google Slides presentation with an optional title. Returns the created presentation's metadata including its presentationId, which is needed for all subsequent operations.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "description": "Optional title for the new presentation."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {}\n  if (input && typeof input.title === 'string') {\n    body.title = input.title\n  }\n  const res = await integration.fetch('/presentations', { method: 'POST', body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "slides"
      },
      {
        "name": "slides_batch_update",
        "description": "Send a presentations.batchUpdate request for low-level slide modifications. Accepts an array of requests (createSlide, deleteObject, insertText, deleteText, createShape, createTable, replaceAllText, updateTextStyle, updateShapeProperties, etc.). For common text and styling operations, prefer the higher-level Slides tools.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "presentationId",
            "requests"
          ],
          "properties": {
            "presentationId": {
              "type": "string",
              "description": "ID of the presentation."
            },
            "requests": {
              "type": "array",
              "items": {
                "type": "object"
              },
              "description": "Array of Slides API requests."
            },
            "writeControl": {
              "type": "object",
              "description": "Optional write control object."
            },
            "includePresentationInResponse": {
              "type": "boolean"
            },
            "responsePageObjectIds": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { presentationId, requests, includePresentationInResponse, responsePageObjectIds, writeControl } = input\n  const params = new URLSearchParams()\n  if (includePresentationInResponse !== undefined)\n    params.set('includePresentationInResponse', String(includePresentationInResponse))\n  if (Array.isArray(responsePageObjectIds))\n    responsePageObjectIds.forEach(id => params.append('responsePageObjectIds', String(id)))\n  const qs = params.toString()\n  const path = `/presentations/${encodeURIComponent(presentationId)}:batchUpdate${qs ? `?${qs}` : ''}`\n  const body = { requests }\n  if (writeControl)\n    body.writeControl = writeControl\n  const res = await integration.fetch(path, { method: 'POST', body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "slides"
      },
      {
        "name": "append_text_to_title_of_slide_index",
        "description": "Append text to the title shape of a specific slide by its 0-based index (slideIndex=0 is the first slide, default). Fetches the presentation to find the title shape's objectId then inserts text at the end of its content.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "presentationId": {
              "type": "string"
            },
            "text": {
              "type": "string"
            },
            "slideIndex": {
              "type": "number",
              "minimum": 0,
              "description": "Zero-based slide index to target (default 0)."
            }
          },
          "required": [
            "presentationId",
            "text"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { presentationId, text, slideIndex = 0 } = input\n  const presRes = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}`)\n  const pres = await presRes.json()\n  const slide = (pres?.slides || [])[slideIndex]\n  if (!slide)\n    return { presentationId, applied: false, replies: [] }\n  const titleShape = (slide.pageElements || []).find(el => el.shape?.placeholder?.type === 'TITLE')\n  if (!titleShape?.objectId)\n    return { presentationId, applied: false, replies: [] }\n  const res = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}:batchUpdate`, {\n    method: 'POST',\n    body: { requests: [{ insertText: { objectId: titleShape.objectId, insertionIndex: -1, text } }] },\n  })\n  const out = await res.json()\n  return out?.presentationId ? { ...out, applied: true } : { presentationId, applied: true, replies: out?.replies || [] }\n}",
        "scope": "write",
        "toolset": "slides"
      },
      {
        "name": "replace_text_first_match",
        "description": "Replace the first occurrence of text anywhere in the presentation with new text. Note: the Slides API replaceAllText always replaces all occurrences; this tool uses replaceAllText internally. For replacing only one instance, use style_text_first_match to locate and style the match, then follow up with slides_batch_update. Returns the API response.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "presentationId": {
              "type": "string"
            },
            "findText": {
              "type": "string"
            },
            "replaceText": {
              "type": "string"
            },
            "matchCase": {
              "type": "boolean"
            }
          },
          "required": [
            "presentationId",
            "findText",
            "replaceText"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { presentationId, findText, replaceText, matchCase } = input\n  const res = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}:batchUpdate`, {\n    method: 'POST',\n    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: Boolean(matchCase) }, replaceText } }] },\n  })\n  const out = await res.json()\n  return out?.presentationId ? { ...out, applied: true } : { presentationId, applied: true, replies: out?.replies || [] }\n}",
        "scope": "write",
        "toolset": "slides"
      },
      {
        "name": "style_text_first_match",
        "description": "Find the first occurrence of text in the presentation and apply a text style to it (bold, italic, fontSize, foregroundColor, etc.). Uses a marker pattern: replaces the text with a unique marker, finds the marker's objectId and range, applies the style, then restores the original text. Returns {applied: true/false}.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "presentationId": {
              "type": "string"
            },
            "findText": {
              "type": "string"
            },
            "textStyle": {
              "type": "object"
            },
            "fields": {
              "type": "string"
            }
          },
          "required": [
            "presentationId",
            "findText",
            "textStyle"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { presentationId, findText, textStyle, fields } = input\n  // Replace first match with a marker to derive objectId/range\n  const marker = `__CMD_MARK_${Date.now()}__`\n  const rep = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}:batchUpdate`, {\n    method: 'POST',\n    body: { requests: [{ replaceAllText: { containsText: { text: findText, matchCase: false }, replaceText: marker } }] },\n  })\n  await rep.json()\n  // Scan pages for marker and apply style to that range on the text element\n  const presRes = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}`)\n  const pres = await presRes.json()\n  let targetObjectId = null\n  let startIndex = -1\n  let endIndex = -1\n  for (const slide of (pres?.slides || [])) {\n    for (const el of (slide.pageElements || [])) {\n      const text = el.shape?.text\n      if (!text)\n        continue\n      for (const pe of (text.textElements || [])) {\n        const t = pe.textRun?.content\n        if (!t)\n          continue\n        const idx = t.indexOf(marker)\n        if (idx >= 0) {\n          targetObjectId = el.objectId\n          startIndex = (pe.startIndex || 0) + idx\n          endIndex = startIndex + marker.length\n          break\n        }\n      }\n      if (targetObjectId)\n        break\n    }\n    if (targetObjectId)\n      break\n  }\n  if (!targetObjectId)\n    return { presentationId, applied: false, replies: [] }\n  const requests = [\n    { updateTextStyle: { objectId: targetObjectId, style: textStyle, textRange: { type: 'FIXED_RANGE', startIndex, endIndex }, fields: fields || Object.keys(textStyle || {}).join(',') } },\n    { replaceAllText: { containsText: { text: marker, matchCase: true }, replaceText: findText } },\n  ]\n  const res = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}:batchUpdate`, { method: 'POST', body: { requests } })\n  const out = await res.json()\n  return out?.presentationId ? { ...out, applied: true } : { presentationId, applied: true, replies: out?.replies || [] }\n}",
        "scope": "write",
        "toolset": "slides"
      },
      {
        "name": "insert_shape_after_first_match",
        "description": "Find the first slide containing a text match and insert a rectangle shape on that slide at the specified position. Positions use EMU units (1 inch = 914400 EMU). Returns {applied: true/false}.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "presentationId": {
              "type": "string"
            },
            "findText": {
              "type": "string"
            },
            "shapeType": {
              "type": "string",
              "default": "RECTANGLE"
            },
            "width": {
              "type": "number",
              "default": 2000000
            },
            "height": {
              "type": "number",
              "default": 1000000
            }
          },
          "required": [
            "presentationId",
            "findText"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { presentationId, findText, shapeType = 'RECTANGLE', width = 2000000, height = 1000000 } = input\n  const presRes = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}`)\n  const pres = await presRes.json()\n  // Find slide with first text match\n  let targetSlideId = null\n  for (const slide of (pres?.slides || [])) {\n    const text = JSON.stringify(slide)\n    if (text && text.includes(findText)) { targetSlideId = slide.objectId; break }\n  }\n  if (!targetSlideId)\n    return { presentationId, applied: false, replies: [] }\n  // Insert a shape at a default position near center\n  const elementId = `shape_${Date.now()}`\n  const requests = [\n    { createShape: { objectId: elementId, shapeType, elementProperties: { pageObjectId: targetSlideId, size: { width: { magnitude: width, unit: 'EMU' }, height: { magnitude: height, unit: 'EMU' } }, transform: { scaleX: 1, scaleY: 1, translateX: 1000000, translateY: 1000000, unit: 'EMU' } } } },\n  ]\n  const res = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}:batchUpdate`, { method: 'POST', body: { requests } })\n  const out = await res.json()\n  return out?.presentationId ? { ...out, applied: true } : { presentationId, applied: true, replies: out?.replies || [] }\n}",
        "scope": "write",
        "toolset": "slides"
      },
      {
        "name": "insert_image_after_first_match",
        "description": "Find the first slide containing a text match and insert an image on that slide from a URL. Position and size use EMU units (1 inch = 914400 EMU). Returns {applied: true/false}.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "presentationId": {
              "type": "string"
            },
            "findText": {
              "type": "string"
            },
            "uri": {
              "type": "string"
            },
            "width": {
              "type": "number",
              "default": 2000000
            },
            "height": {
              "type": "number",
              "default": 2000000
            }
          },
          "required": [
            "presentationId",
            "findText",
            "uri"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { presentationId, findText, uri, width = 2000000, height = 2000000 } = input\n  const presRes = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}`)\n  const pres = await presRes.json()\n  let targetSlideId = null\n  for (const slide of (pres?.slides || [])) {\n    const text = JSON.stringify(slide)\n    if (text && text.includes(findText)) { targetSlideId = slide.objectId; break }\n  }\n  if (!targetSlideId)\n    return { presentationId, applied: false, replies: [] }\n  const elementId = `image_${Date.now()}`\n  const requests = [\n    { createImage: { objectId: elementId, url: uri, elementProperties: { pageObjectId: targetSlideId, size: { width: { magnitude: width, unit: 'EMU' }, height: { magnitude: height, unit: 'EMU' } }, transform: { scaleX: 1, scaleY: 1, translateX: 1000000, translateY: 1000000, unit: 'EMU' } } } },\n  ]\n  const res = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}:batchUpdate`, { method: 'POST', body: { requests } })\n  const out = await res.json()\n  return out?.presentationId ? { ...out, applied: true } : { presentationId, applied: true, replies: out?.replies || [] }\n}",
        "scope": "write",
        "toolset": "slides"
      },
      {
        "name": "create_slide_after_first_match",
        "description": "Find the first slide containing a text match and create a new blank slide immediately after it. Useful for inserting slides at a specific position in the deck. Returns {applied: true/false} and the new slide's objectId.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "presentationId": {
              "type": "string"
            },
            "findText": {
              "type": "string"
            },
            "layout": {
              "type": "string",
              "default": "BLANK"
            }
          },
          "required": [
            "presentationId",
            "findText"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { presentationId, findText, layout = 'BLANK' } = input\n  const presRes = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}`)\n  const pres = await presRes.json()\n  let targetSlideId = null\n  for (const slide of (pres?.slides || [])) {\n    const text = JSON.stringify(slide)\n    if (text && text.includes(findText)) { targetSlideId = slide.objectId; break }\n  }\n  if (!targetSlideId)\n    return { presentationId, applied: false, replies: [] }\n  const newSlideId = `slide_${Date.now()}`\n  const currentIndex = (pres?.slides || []).findIndex(s => s.objectId === targetSlideId)\n  const requests = [\n    { createSlide: { objectId: newSlideId, insertionIndex: currentIndex >= 0 ? currentIndex + 1 : (pres?.slides?.length || 0), slideLayoutReference: { predefinedLayout: layout } } },\n  ]\n  const res = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}:batchUpdate`, { method: 'POST', body: { requests } })\n  const out = await res.json()\n  return out?.presentationId ? { ...out, applied: true } : { presentationId, applied: true, replies: out?.replies || [] }\n}",
        "scope": "write",
        "toolset": "slides"
      },
      {
        "name": "set_background_color_for_slide_index",
        "description": "Set the background color for a specific slide by its 0-based index (slideIndex=0 is the first slide). Provide r, g, b values in 0.0-1.0 range (e.g. r=1.0, g=0.0, b=0.0 for red). Fetches the presentation first to resolve the slide's objectId from the index.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "presentationId": {
              "type": "string"
            },
            "slideIndex": {
              "type": "number",
              "minimum": 0
            },
            "rgbColor": {
              "type": "object",
              "properties": {
                "red": {
                  "type": "number"
                },
                "green": {
                  "type": "number"
                },
                "blue": {
                  "type": "number"
                }
              },
              "required": [
                "red",
                "green",
                "blue"
              ]
            }
          },
          "required": [
            "presentationId",
            "slideIndex",
            "rgbColor"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const { presentationId, slideIndex, rgbColor } = input\n  const presRes = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}`)\n  const pres = await presRes.json()\n  const slide = (pres?.slides || [])[slideIndex]\n  if (!slide?.objectId)\n    return { presentationId, applied: false, replies: [] }\n  const color = { color: { rgbColor } }\n  const res = await integration.fetch(`/presentations/${encodeURIComponent(presentationId)}:batchUpdate`, {\n    method: 'POST',\n    body: { requests: [{ updatePageProperties: { objectId: slide.objectId, pageProperties: { pageBackgroundFill: { solidFill: color } }, fields: 'pageBackgroundFill.solidFill.color' } }] },\n  })\n  const out = await res.json()\n  return out?.presentationId ? { ...out, applied: true } : { presentationId, applied: true, replies: out?.replies || [] }\n}",
        "scope": "write",
        "toolset": "slides"
      }
    ]
  },
  "hubspot": {
    "manifest": {
      "name": "hubspot",
      "version": "0.1.0",
      "baseUrl": "https://api.hubapi.com",
      "tools": [
        {
          "name": "search_contacts",
          "description": "Search for contacts. Use query for simple free-text search, and filters for precise property-based filtering. Returns a compact list of matching contacts.",
          "inputSchema": "schemas/search_contacts.json",
          "handler": "handlers/search_contacts.js",
          "scope": "read"
        },
        {
          "name": "get_contact",
          "description": "Get a contact by ID. Use properties to request specific fields, and associations to include linked object IDs (e.g. companies, deals, tickets).",
          "inputSchema": "schemas/get_contact.json",
          "handler": "handlers/get_contact.js",
          "scope": "read"
        },
        {
          "name": "create_contact",
          "description": "Create a contact. Provide common fields (firstname/lastname/email) and/or a properties map for other HubSpot contact properties.",
          "inputSchema": "schemas/create_contact.json",
          "handler": "handlers/create_contact.js",
          "scope": "write"
        },
        {
          "name": "update_contact",
          "description": "Update a contact by ID. Provide any fields to update as common fields and/or in the properties map. Fields not provided are unchanged.",
          "inputSchema": "schemas/update_contact.json",
          "handler": "handlers/update_contact.js",
          "scope": "write"
        },
        {
          "name": "archive_contact",
          "description": "Archive (delete) a contact by ID. This moves the record to the recycle bin.",
          "inputSchema": "schemas/archive_contact.json",
          "handler": "handlers/archive_contact.js",
          "scope": "write"
        },
        {
          "name": "search_companies",
          "description": "Search for companies. Use query for free-text search and filters for property-based filtering. Returns a compact list of matching companies.",
          "inputSchema": "schemas/search_companies.json",
          "handler": "handlers/search_companies.js",
          "scope": "read"
        },
        {
          "name": "get_company",
          "description": "Get a company by ID. Use properties to request specific fields, and associations to include linked object IDs (e.g. contacts, deals, tickets).",
          "inputSchema": "schemas/get_company.json",
          "handler": "handlers/get_company.js",
          "scope": "read"
        },
        {
          "name": "create_company",
          "description": "Create a company. Provide name/domain and/or a properties map for other HubSpot company properties.",
          "inputSchema": "schemas/create_company.json",
          "handler": "handlers/create_company.js",
          "scope": "write"
        },
        {
          "name": "update_company",
          "description": "Update a company by ID. Provide any fields to update as common fields and/or in the properties map. Fields not provided are unchanged.",
          "inputSchema": "schemas/update_company.json",
          "handler": "handlers/update_company.js",
          "scope": "write"
        },
        {
          "name": "archive_company",
          "description": "Archive (delete) a company by ID. This moves the record to the recycle bin.",
          "inputSchema": "schemas/archive_company.json",
          "handler": "handlers/archive_company.js",
          "scope": "write"
        },
        {
          "name": "list_owners",
          "description": "List CRM owners (users) available in the HubSpot account. Useful for assigning owners to records via hubspot_owner_id.",
          "inputSchema": "schemas/list_owners.json",
          "handler": "handlers/list_owners.js",
          "scope": "read"
        },
        {
          "name": "list_properties",
          "description": "List properties for an object type (e.g. contacts, companies, deals, tickets). Use this to discover valid property names for filtering and updates.",
          "inputSchema": "schemas/list_properties.json",
          "handler": "handlers/list_properties.js",
          "scope": "read"
        },
        {
          "name": "list_pipelines",
          "description": "List pipelines and stages for an object type (commonly deals or tickets). Use this to find valid pipeline and stage IDs before creating/updating records.",
          "inputSchema": "schemas/list_pipelines.json",
          "handler": "handlers/list_pipelines.js",
          "scope": "read"
        },
        {
          "name": "get_associations",
          "description": "Get associations from a CRM record to another object type. Returns the associated record IDs (paginated).",
          "inputSchema": "schemas/get_associations.json",
          "handler": "handlers/get_associations.js",
          "scope": "read"
        },
        {
          "name": "create_association",
          "description": "Create a default (unlabeled) association between two CRM records. Example: associate a contact with a company or a deal with a contact.",
          "inputSchema": "schemas/create_association.json",
          "handler": "handlers/create_association.js",
          "scope": "write"
        },
        {
          "name": "remove_association",
          "description": "Remove an association between two CRM records. This uses HubSpot's association batch archive endpoint under the hood.",
          "inputSchema": "schemas/remove_association.json",
          "handler": "handlers/remove_association.js",
          "scope": "write"
        },
        {
          "name": "search_deals",
          "description": "Search for deals. Use query for free-text search and filters for property-based filtering (e.g. pipeline, dealstage, amount).",
          "inputSchema": "schemas/search_deals.json",
          "handler": "handlers/search_deals.js",
          "scope": "read"
        },
        {
          "name": "get_deal",
          "description": "Get a deal by ID. Use properties to request specific fields, and associations to include linked object IDs.",
          "inputSchema": "schemas/get_deal.json",
          "handler": "handlers/get_deal.js",
          "scope": "read"
        },
        {
          "name": "create_deal",
          "description": "Create a deal. Provide dealname/amount/pipeline/dealstage and/or a properties map for other HubSpot deal properties.",
          "inputSchema": "schemas/create_deal.json",
          "handler": "handlers/create_deal.js",
          "scope": "write"
        },
        {
          "name": "update_deal",
          "description": "Update a deal by ID. Common updates include moving stages via dealstage. Fields not provided are unchanged.",
          "inputSchema": "schemas/update_deal.json",
          "handler": "handlers/update_deal.js",
          "scope": "write"
        },
        {
          "name": "archive_deal",
          "description": "Archive (delete) a deal by ID. This moves the record to the recycle bin.",
          "inputSchema": "schemas/archive_deal.json",
          "handler": "handlers/archive_deal.js",
          "scope": "write"
        },
        {
          "name": "search_tickets",
          "description": "Search for tickets. Use query for free-text search and filters for property-based filtering (e.g. hs_pipeline, hs_pipeline_stage, priority).",
          "inputSchema": "schemas/search_tickets.json",
          "handler": "handlers/search_tickets.js",
          "scope": "read"
        },
        {
          "name": "get_ticket",
          "description": "Get a ticket by ID. Use properties to request specific fields, and associations to include linked object IDs.",
          "inputSchema": "schemas/get_ticket.json",
          "handler": "handlers/get_ticket.js",
          "scope": "read"
        },
        {
          "name": "create_ticket",
          "description": "Create a ticket. Provide subject/content/pipeline/stage and/or a properties map for other HubSpot ticket properties.",
          "inputSchema": "schemas/create_ticket.json",
          "handler": "handlers/create_ticket.js",
          "scope": "write"
        },
        {
          "name": "update_ticket",
          "description": "Update a ticket by ID. Common updates include changing hs_pipeline_stage. Fields not provided are unchanged.",
          "inputSchema": "schemas/update_ticket.json",
          "handler": "handlers/update_ticket.js",
          "scope": "write"
        },
        {
          "name": "archive_ticket",
          "description": "Archive (delete) a ticket by ID. This moves the record to the recycle bin.",
          "inputSchema": "schemas/archive_ticket.json",
          "handler": "handlers/archive_ticket.js",
          "scope": "write"
        },
        {
          "name": "search_notes",
          "description": "Search notes. Use query for free-text search and filters for precise property-based filtering.",
          "inputSchema": "schemas/search_notes.json",
          "handler": "handlers/search_notes.js",
          "scope": "read"
        },
        {
          "name": "create_note",
          "description": "Create a note and (optionally) associate it to one or more CRM records (contacts, companies, deals, tickets). Provide body text; the handler sets hs_note_body and hs_timestamp automatically unless overridden.",
          "inputSchema": "schemas/create_note.json",
          "handler": "handlers/create_note.js",
          "scope": "write"
        },
        {
          "name": "search_tasks",
          "description": "Search tasks. Use query for free-text search and filters for precise property-based filtering.",
          "inputSchema": "schemas/search_tasks.json",
          "handler": "handlers/search_tasks.js",
          "scope": "read"
        },
        {
          "name": "create_task",
          "description": "Create a task and (optionally) associate it to one or more CRM records. Provide subject/body/status/priority and a due timestamp; the handler maps these to HubSpot task properties.",
          "inputSchema": "schemas/create_task.json",
          "handler": "handlers/create_task.js",
          "scope": "write"
        },
        {
          "name": "update_task",
          "description": "Update a task by ID. Common updates include setting hs_task_status to COMPLETED.",
          "inputSchema": "schemas/update_task.json",
          "handler": "handlers/update_task.js",
          "scope": "write"
        }
      ]
    },
    "prompt": "## HubSpot guidance\n\nThis integration uses HubSpot CRM v3 object endpoints and CRM v4 association endpoints.\n\n- Prefer `search_*` tools for discovery (they support free-text `query` and structured `filters`).\n- Use `get_*` tools when you already have an object ID and want full details / associations.\n\n### Search filters\n\nAll `search_*` tools accept:\n\n- `query`: free-text search (optional)\n- `filters`: property-based filtering. Each filter is `{ propertyName, operator, value? }`.\n\nCommon operators:\n\n- `EQ`, `NEQ`\n- `LT`, `LTE`, `GT`, `GTE` (numbers or millisecond timestamps)\n- `CONTAINS_TOKEN` (tokenized contains)\n- `HAS_PROPERTY`, `NOT_HAS_PROPERTY` (value ignored)\n- `BETWEEN` (pass `value` as a string `\"low,high\"`; timestamps in ms recommended)\n\n### Common property names (quick reference)\n\nContacts:\n- `firstname`, `lastname`, `email`\n\nCompanies:\n- `name`, `domain`\n\nDeals:\n- `dealname`, `amount`, `pipeline`, `dealstage`, `closedate`\n\nTickets:\n- `subject`, `content`, `hs_pipeline`, `hs_pipeline_stage`\n\n### Pipelines and stages (deals/tickets)\n\nPipelines and stages are stored as IDs (not human-friendly names). Recommended workflow:\n\n1. Call `list_pipelines` with `objectType: \"deals\"` or `objectType: \"tickets\"`.\n2. Pick a pipeline ID and stage ID from the response.\n3. Use those IDs when calling `create_deal` / `update_deal` (via `pipeline` / `dealstage`) or `create_ticket` / `update_ticket` (via `hs_pipeline` / `hs_pipeline_stage`).\n\n### Associations\n\n- Use `get_associations` to list linked records (returns associated IDs).\n- Use `create_association` to link two records (default/unlabeled association).\n- Use `remove_association` to unlink records.\n\n### Engagement objects\n\nNotes:\n- Content: `hs_note_body`\n- Timestamp: `hs_timestamp` (milliseconds)\n\nTasks:\n- Subject: `hs_task_subject`\n- Body: `hs_task_body`\n- Status: `hs_task_status` (`NOT_STARTED` or `COMPLETED`)\n- Priority: `hs_task_priority` (`LOW`, `MEDIUM`, `HIGH`)\n- Due timestamp: `hs_timestamp` (milliseconds)\n\nThe `create_note` and `create_task` tools can also associate the engagement to CRM records in the same call.\n\n### Pagination\n\nHubSpot uses cursor-based pagination. When a response includes `paging.next.after`, pass that value back as `after` in your next call.\n\n",
    "variants": {
      "variants": {
        "private_app_token": {
          "label": "Private App Token",
          "schema": {
            "type": "object",
            "properties": {
              "token": {
                "type": "string",
                "title": "Private app access token",
                "description": "HubSpot private app access token. This is sent as a Bearer token in the Authorization header."
              }
            },
            "required": [
              "token"
            ],
            "additionalProperties": false
          },
          "injection": {
            "headers": {
              "Authorization": "Bearer {{token}}",
              "Accept": "application/json"
            }
          },
          "healthCheck": {
            "path": "/crm/v3/owners?limit=1"
          }
        },
        "oauth_token": {
          "label": "OAuth Access Token",
          "schema": {
            "type": "object",
            "properties": {
              "token": {
                "type": "string",
                "title": "OAuth access token",
                "description": "OAuth 2.0 access token for HubSpot (Bearer token)."
              }
            },
            "required": [
              "token"
            ],
            "additionalProperties": false
          },
          "injection": {
            "headers": {
              "Authorization": "Bearer {{token}}",
              "Accept": "application/json"
            }
          },
          "healthCheck": {
            "path": "/crm/v3/owners?limit=1"
          }
        }
      },
      "default": "private_app_token"
    },
    "hint": "## HubSpot credentials (Private App Token)\n\n1. In HubSpot, open **Settings**.\n2. Go to **Integrations** → **Private Apps**.\n3. Click **Create private app**.\n4. Name the app (e.g. \"Commandable MCP\") and save.\n5. In **Scopes**, enable at least:\n   - `crm.objects.contacts.read` / `crm.objects.contacts.write`\n   - `crm.objects.companies.read` / `crm.objects.companies.write`\n   - `crm.objects.deals.read` / `crm.objects.deals.write`\n   - `tickets` (for tickets read/write)\n   - `crm.objects.owners.read`\n   - `crm.schemas.contacts.read`, `crm.schemas.companies.read`, `crm.schemas.deals.read`, `crm.schemas.tickets.read` (for listing properties)\n6. Create the app and copy the generated **Access token**.\n7. Paste the token into this integration's `token` credential field.\n\nNotes:\n- Keep this token secret. Anyone with the token can access your HubSpot account within the app's scopes.\n- If you get 401/403 errors, double-check the app scopes and that the token is still active.",
    "hintsByVariant": {
      "oauth_token": "## HubSpot credentials (OAuth access token)\n\n1. Create (or use an existing) HubSpot public app that can issue OAuth 2.0 access tokens.\n2. Ensure the app requests the scopes you need (for example):\n   - `crm.objects.contacts.read` / `crm.objects.contacts.write`\n   - `crm.objects.companies.read` / `crm.objects.companies.write`\n   - `crm.objects.deals.read` / `crm.objects.deals.write`\n   - `tickets`\n   - `crm.objects.owners.read`\n   - relevant `crm.schemas.*.read` scopes if you want to list properties\n3. Complete the OAuth authorization code flow to obtain an **access token**.\n4. Paste the access token into this integration's `token` credential field.\n\nNotes:\n- HubSpot OAuth access tokens are short-lived. If calls start failing with 401, refresh and provide a new access token."
    },
    "tools": [
      {
        "name": "search_contacts",
        "description": "Search for contacts. Use query for simple free-text search, and filters for precise property-based filtering. Returns a compact list of matching contacts.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "title": "Query",
              "description": "Free-text search query (optional)."
            },
            "filters": {
              "type": "array",
              "title": "Filters",
              "description": "Property-based filters converted into HubSpot filterGroups.",
              "items": {
                "type": "object",
                "properties": {
                  "propertyName": {
                    "type": "string"
                  },
                  "operator": {
                    "type": "string",
                    "enum": [
                      "EQ",
                      "NEQ",
                      "LT",
                      "LTE",
                      "GT",
                      "GTE",
                      "BETWEEN",
                      "HAS_PROPERTY",
                      "NOT_HAS_PROPERTY",
                      "CONTAINS_TOKEN"
                    ]
                  },
                  "value": {
                    "type": [
                      "string",
                      "number",
                      "boolean"
                    ]
                  }
                },
                "required": [
                  "propertyName",
                  "operator"
                ],
                "additionalProperties": false
              }
            },
            "properties": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Which contact properties to return. If omitted, HubSpot returns a default set."
            },
            "limit": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "description": "Max results per page."
            },
            "after": {
              "type": "string",
              "description": "Paging cursor token (from paging.next.after)."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const summarize = (row) => ({\n    id: row?.id ?? null,\n    archived: !!row?.archived,\n    createdAt: row?.createdAt ?? null,\n    updatedAt: row?.updatedAt ?? null,\n    email: row?.properties?.email ?? null,\n    firstname: row?.properties?.firstname ?? null,\n    lastname: row?.properties?.lastname ?? null,\n    phone: row?.properties?.phone ?? null,\n    company: row?.properties?.company ?? null,\n    jobtitle: row?.properties?.jobtitle ?? null,\n  })\n\n  const filterGroups = []\n  if (Array.isArray(input.filters) && input.filters.length > 0) {\n    const filters = input.filters.map((f) => {\n      const base = {\n        propertyName: f.propertyName,\n        operator: f.operator,\n      }\n\n      if (f.operator === 'BETWEEN' && typeof f.value === 'string' && f.value.includes(',')) {\n        const [low, high] = f.value.split(',', 2).map((s) => s.trim())\n        return { ...base, value: low, highValue: high }\n      }\n\n      if (f.operator === 'HAS_PROPERTY' || f.operator === 'NOT_HAS_PROPERTY') {\n        return base\n      }\n\n      if (f.value !== undefined) {\n        return { ...base, value: f.value }\n      }\n\n      return base\n    })\n\n    filterGroups.push({ filters })\n  }\n\n  const body = {\n    query: input.query,\n    filterGroups: filterGroups.length ? filterGroups : undefined,\n    properties: input.properties,\n    limit: input.limit,\n    after: input.after,\n  }\n\n  const res = await integration.fetch(`/crm/v3/objects/contacts/search`, {\n    method: 'POST',\n    body,\n  })\n  const data = await res.json()\n  const contacts = Array.isArray(data?.results) ? data.results.map(summarize) : []\n  return {\n    total: typeof data?.total === 'number' ? data.total : contacts.length,\n    count: contacts.length,\n    paging: data?.paging ?? null,\n    note: 'Use id with get_contact for full record details.',\n    contacts,\n  }\n}",
        "scope": "read"
      },
      {
        "name": "get_contact",
        "description": "Get a contact by ID. Use properties to request specific fields, and associations to include linked object IDs (e.g. companies, deals, tickets).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "title": "Contact ID",
              "description": "HubSpot contact object ID."
            },
            "properties": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Specific property names to return (e.g. firstname, lastname, email, phone)."
            },
            "associations": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Associated object types to include (e.g. companies, deals, tickets)."
            },
            "archived": {
              "type": "boolean",
              "description": "Whether to return archived records."
            }
          },
          "required": [
            "id"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n\n  if (Array.isArray(input.properties)) {\n    for (const p of input.properties) params.append('properties', p)\n  }\n\n  if (Array.isArray(input.associations)) {\n    for (const a of input.associations) params.append('associations', a)\n  }\n\n  if (typeof input.archived === 'boolean') params.set('archived', String(input.archived))\n\n  const suffix = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/crm/v3/objects/contacts/${encodeURIComponent(input.id)}${suffix}`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "create_contact",
        "description": "Create a contact. Provide common fields (firstname/lastname/email) and/or a properties map for other HubSpot contact properties.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "firstname": {
              "type": "string"
            },
            "lastname": {
              "type": "string"
            },
            "email": {
              "type": "string"
            },
            "properties": {
              "type": "object",
              "description": "Additional HubSpot contact properties to set (propertyName -> value).",
              "additionalProperties": true
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const props = { ...(input.properties || {}) }\n  if (input.firstname !== undefined) props.firstname = input.firstname\n  if (input.lastname !== undefined) props.lastname = input.lastname\n  if (input.email !== undefined) props.email = input.email\n\n  const body = { properties: props }\n  const res = await integration.fetch(`/crm/v3/objects/contacts`, {\n    method: 'POST',\n    body,\n  })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "update_contact",
        "description": "Update a contact by ID. Provide any fields to update as common fields and/or in the properties map. Fields not provided are unchanged.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "title": "Contact ID",
              "description": "HubSpot contact object ID."
            },
            "firstname": {
              "type": "string"
            },
            "lastname": {
              "type": "string"
            },
            "email": {
              "type": "string"
            },
            "properties": {
              "type": "object",
              "description": "HubSpot contact properties to update (propertyName -> value).",
              "additionalProperties": true
            }
          },
          "required": [
            "id"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const props = { ...(input.properties || {}) }\n  if (input.firstname !== undefined) props.firstname = input.firstname\n  if (input.lastname !== undefined) props.lastname = input.lastname\n  if (input.email !== undefined) props.email = input.email\n\n  const body = { properties: props }\n  const res = await integration.fetch(`/crm/v3/objects/contacts/${encodeURIComponent(input.id)}`, {\n    method: 'PATCH',\n    body,\n  })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "archive_contact",
        "description": "Archive (delete) a contact by ID. This moves the record to the recycle bin.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "title": "Contact ID",
              "description": "HubSpot contact object ID."
            }
          },
          "required": [
            "id"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/crm/v3/objects/contacts/${encodeURIComponent(input.id)}`, {\n    method: 'DELETE',\n  })\n  const text = await res.text()\n  if (!text) return { ok: res.ok, status: res.status }\n  try {\n    return JSON.parse(text)\n  } catch {\n    return { ok: res.ok, status: res.status, body: text }\n  }\n}",
        "scope": "write"
      },
      {
        "name": "search_companies",
        "description": "Search for companies. Use query for free-text search and filters for property-based filtering. Returns a compact list of matching companies.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "title": "Query",
              "description": "Free-text search query (optional)."
            },
            "filters": {
              "type": "array",
              "title": "Filters",
              "description": "Property-based filters converted into HubSpot filterGroups.",
              "items": {
                "type": "object",
                "properties": {
                  "propertyName": {
                    "type": "string"
                  },
                  "operator": {
                    "type": "string",
                    "enum": [
                      "EQ",
                      "NEQ",
                      "LT",
                      "LTE",
                      "GT",
                      "GTE",
                      "BETWEEN",
                      "HAS_PROPERTY",
                      "NOT_HAS_PROPERTY",
                      "CONTAINS_TOKEN"
                    ]
                  },
                  "value": {
                    "type": [
                      "string",
                      "number",
                      "boolean"
                    ]
                  }
                },
                "required": [
                  "propertyName",
                  "operator"
                ],
                "additionalProperties": false
              }
            },
            "properties": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Which company properties to return. If omitted, HubSpot returns a default set."
            },
            "limit": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "description": "Max results per page."
            },
            "after": {
              "type": "string",
              "description": "Paging cursor token (from paging.next.after)."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const summarize = (row) => ({\n    id: row?.id ?? null,\n    archived: !!row?.archived,\n    createdAt: row?.createdAt ?? null,\n    updatedAt: row?.updatedAt ?? null,\n    name: row?.properties?.name ?? null,\n    domain: row?.properties?.domain ?? null,\n    city: row?.properties?.city ?? null,\n    state: row?.properties?.state ?? null,\n    country: row?.properties?.country ?? null,\n    phone: row?.properties?.phone ?? null,\n  })\n\n  const filterGroups = []\n  if (Array.isArray(input.filters) && input.filters.length > 0) {\n    const filters = input.filters.map((f) => {\n      const base = {\n        propertyName: f.propertyName,\n        operator: f.operator,\n      }\n\n      if (f.operator === 'BETWEEN' && typeof f.value === 'string' && f.value.includes(',')) {\n        const [low, high] = f.value.split(',', 2).map((s) => s.trim())\n        return { ...base, value: low, highValue: high }\n      }\n\n      if (f.operator === 'HAS_PROPERTY' || f.operator === 'NOT_HAS_PROPERTY') {\n        return base\n      }\n\n      if (f.value !== undefined) {\n        return { ...base, value: f.value }\n      }\n\n      return base\n    })\n\n    filterGroups.push({ filters })\n  }\n\n  const body = {\n    query: input.query,\n    filterGroups: filterGroups.length ? filterGroups : undefined,\n    properties: input.properties,\n    limit: input.limit,\n    after: input.after,\n  }\n\n  const res = await integration.fetch(`/crm/v3/objects/companies/search`, {\n    method: 'POST',\n    body,\n  })\n  const data = await res.json()\n  const companies = Array.isArray(data?.results) ? data.results.map(summarize) : []\n  return {\n    total: typeof data?.total === 'number' ? data.total : companies.length,\n    count: companies.length,\n    paging: data?.paging ?? null,\n    note: 'Use id with get_company for full record details.',\n    companies,\n  }\n}",
        "scope": "read"
      },
      {
        "name": "get_company",
        "description": "Get a company by ID. Use properties to request specific fields, and associations to include linked object IDs (e.g. contacts, deals, tickets).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "title": "Company ID",
              "description": "HubSpot company object ID."
            },
            "properties": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Specific property names to return (e.g. name, domain, industry)."
            },
            "associations": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Associated object types to include (e.g. contacts, deals, tickets)."
            },
            "archived": {
              "type": "boolean",
              "description": "Whether to return archived records."
            }
          },
          "required": [
            "id"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n\n  if (Array.isArray(input.properties)) {\n    for (const p of input.properties) params.append('properties', p)\n  }\n\n  if (Array.isArray(input.associations)) {\n    for (const a of input.associations) params.append('associations', a)\n  }\n\n  if (typeof input.archived === 'boolean') params.set('archived', String(input.archived))\n\n  const suffix = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/crm/v3/objects/companies/${encodeURIComponent(input.id)}${suffix}`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "create_company",
        "description": "Create a company. Provide name/domain and/or a properties map for other HubSpot company properties.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string"
            },
            "domain": {
              "type": "string"
            },
            "properties": {
              "type": "object",
              "description": "Additional HubSpot company properties to set (propertyName -> value).",
              "additionalProperties": true
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const props = { ...(input.properties || {}) }\n  if (input.name !== undefined) props.name = input.name\n  if (input.domain !== undefined) props.domain = input.domain\n\n  const body = { properties: props }\n  const res = await integration.fetch(`/crm/v3/objects/companies`, {\n    method: 'POST',\n    body,\n  })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "update_company",
        "description": "Update a company by ID. Provide any fields to update as common fields and/or in the properties map. Fields not provided are unchanged.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "title": "Company ID",
              "description": "HubSpot company object ID."
            },
            "name": {
              "type": "string"
            },
            "domain": {
              "type": "string"
            },
            "properties": {
              "type": "object",
              "description": "HubSpot company properties to update (propertyName -> value).",
              "additionalProperties": true
            }
          },
          "required": [
            "id"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const props = { ...(input.properties || {}) }\n  if (input.name !== undefined) props.name = input.name\n  if (input.domain !== undefined) props.domain = input.domain\n\n  const body = { properties: props }\n  const res = await integration.fetch(`/crm/v3/objects/companies/${encodeURIComponent(input.id)}`, {\n    method: 'PATCH',\n    body,\n  })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "archive_company",
        "description": "Archive (delete) a company by ID. This moves the record to the recycle bin.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "title": "Company ID",
              "description": "HubSpot company object ID."
            }
          },
          "required": [
            "id"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/crm/v3/objects/companies/${encodeURIComponent(input.id)}`, {\n    method: 'DELETE',\n  })\n  const text = await res.text()\n  if (!text) return { ok: res.ok, status: res.status }\n  try {\n    return JSON.parse(text)\n  } catch {\n    return { ok: res.ok, status: res.status, body: text }\n  }\n}",
        "scope": "write"
      },
      {
        "name": "list_owners",
        "description": "List CRM owners (users) available in the HubSpot account. Useful for assigning owners to records via hubspot_owner_id.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "email": {
              "type": "string",
              "description": "Filter owners by email address."
            },
            "after": {
              "type": "string",
              "description": "Paging cursor token."
            },
            "limit": {
              "type": "integer",
              "minimum": 1,
              "maximum": 500,
              "description": "Max results per page."
            },
            "archived": {
              "type": "boolean",
              "description": "Whether to include archived owners."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input?.email) params.set('email', input.email)\n  if (input?.after) params.set('after', String(input.after))\n  if (input?.limit) params.set('limit', String(input.limit))\n  if (typeof input?.archived === 'boolean') params.set('archived', String(input.archived))\n\n  const suffix = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/crm/v3/owners/${suffix}`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "list_properties",
        "description": "List properties for an object type (e.g. contacts, companies, deals, tickets). Use this to discover valid property names for filtering and updates.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "objectType": {
              "type": "string",
              "title": "Object type",
              "description": "HubSpot object type to list properties for (e.g. contacts, companies, deals, tickets, notes, tasks)."
            },
            "archived": {
              "type": "boolean",
              "description": "Whether to include archived properties."
            }
          },
          "required": [
            "objectType"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (typeof input.archived === 'boolean') params.set('archived', String(input.archived))\n\n  const suffix = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(\n    `/crm/v3/properties/${encodeURIComponent(input.objectType)}${suffix}`\n  )\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "list_pipelines",
        "description": "List pipelines and stages for an object type (commonly deals or tickets). Use this to find valid pipeline and stage IDs before creating/updating records.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "objectType": {
              "type": "string",
              "title": "Object type",
              "description": "HubSpot object type to list pipelines for (commonly deals or tickets)."
            }
          },
          "required": [
            "objectType"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/crm/v3/pipelines/${encodeURIComponent(input.objectType)}`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_associations",
        "description": "Get associations from a CRM record to another object type. Returns the associated record IDs (paginated).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "fromObjectType": {
              "type": "string",
              "description": "Object type of the source record (e.g. contacts, companies, deals, tickets)."
            },
            "fromObjectId": {
              "type": "string",
              "description": "Object ID of the source record."
            },
            "toObjectType": {
              "type": "string",
              "description": "Object type of the associated records to list (e.g. companies, contacts, deals, tickets, notes, tasks)."
            },
            "after": {
              "type": "string",
              "description": "Paging cursor token."
            },
            "limit": {
              "type": "integer",
              "minimum": 1,
              "maximum": 500,
              "description": "Max results per page."
            }
          },
          "required": [
            "fromObjectType",
            "fromObjectId",
            "toObjectType"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input?.after) params.set('after', String(input.after))\n  if (input?.limit) params.set('limit', String(input.limit))\n\n  const suffix = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(\n    `/crm/v4/objects/${encodeURIComponent(input.fromObjectType)}/${encodeURIComponent(\n      input.fromObjectId\n    )}/associations/${encodeURIComponent(input.toObjectType)}${suffix}`\n  )\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "create_association",
        "description": "Create a default (unlabeled) association between two CRM records. Example: associate a contact with a company or a deal with a contact.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "fromObjectType": {
              "type": "string",
              "description": "Object type of the source record (e.g. contacts, companies, deals, tickets)."
            },
            "fromObjectId": {
              "type": "string",
              "description": "Object ID of the source record."
            },
            "toObjectType": {
              "type": "string",
              "description": "Object type of the target record."
            },
            "toObjectId": {
              "type": "string",
              "description": "Object ID of the target record."
            }
          },
          "required": [
            "fromObjectType",
            "fromObjectId",
            "toObjectType",
            "toObjectId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(\n    `/crm/v4/objects/${encodeURIComponent(input.fromObjectType)}/${encodeURIComponent(\n      input.fromObjectId\n    )}/associations/default/${encodeURIComponent(input.toObjectType)}/${encodeURIComponent(\n      input.toObjectId\n    )}`,\n    { method: 'PUT' }\n  )\n  const text = await res.text()\n  if (!text) return { ok: res.ok, status: res.status }\n  try {\n    return JSON.parse(text)\n  } catch {\n    return { ok: res.ok, status: res.status, body: text }\n  }\n}",
        "scope": "write"
      },
      {
        "name": "remove_association",
        "description": "Remove an association between two CRM records. This uses HubSpot's association batch archive endpoint under the hood.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "fromObjectType": {
              "type": "string",
              "description": "Object type of the source record (e.g. contacts, companies, deals, tickets)."
            },
            "fromObjectId": {
              "type": "string",
              "description": "Object ID of the source record."
            },
            "toObjectType": {
              "type": "string",
              "description": "Object type of the target record."
            },
            "toObjectId": {
              "type": "string",
              "description": "Object ID of the target record."
            }
          },
          "required": [
            "fromObjectType",
            "fromObjectId",
            "toObjectType",
            "toObjectId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {\n    inputs: [\n      {\n        from: { id: String(input.fromObjectId) },\n        to: { id: String(input.toObjectId) },\n      },\n    ],\n  }\n\n  const res = await integration.fetch(\n    `/crm/v4/associations/${encodeURIComponent(input.fromObjectType)}/${encodeURIComponent(\n      input.toObjectType\n    )}/batch/archive`,\n    {\n      method: 'POST',\n      body,\n    }\n  )\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "search_deals",
        "description": "Search for deals. Use query for free-text search and filters for property-based filtering (e.g. pipeline, dealstage, amount).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Free-text search query (optional)."
            },
            "filters": {
              "type": "array",
              "description": "Property-based filters converted into HubSpot filterGroups.",
              "items": {
                "type": "object",
                "properties": {
                  "propertyName": {
                    "type": "string"
                  },
                  "operator": {
                    "type": "string",
                    "enum": [
                      "EQ",
                      "NEQ",
                      "LT",
                      "LTE",
                      "GT",
                      "GTE",
                      "BETWEEN",
                      "HAS_PROPERTY",
                      "NOT_HAS_PROPERTY",
                      "CONTAINS_TOKEN"
                    ]
                  },
                  "value": {
                    "type": [
                      "string",
                      "number",
                      "boolean"
                    ]
                  }
                },
                "required": [
                  "propertyName",
                  "operator"
                ],
                "additionalProperties": false
              }
            },
            "properties": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Which deal properties to return."
            },
            "limit": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100
            },
            "after": {
              "type": "string",
              "description": "Paging cursor token."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const summarize = (row) => ({\n    id: row?.id ?? null,\n    archived: !!row?.archived,\n    createdAt: row?.createdAt ?? null,\n    updatedAt: row?.updatedAt ?? null,\n    dealname: row?.properties?.dealname ?? null,\n    dealstage: row?.properties?.dealstage ?? null,\n    pipeline: row?.properties?.pipeline ?? null,\n    amount: row?.properties?.amount ?? null,\n    closedate: row?.properties?.closedate ?? null,\n  })\n\n  const filterGroups = []\n  if (Array.isArray(input.filters) && input.filters.length > 0) {\n    const filters = input.filters.map((f) => {\n      const base = {\n        propertyName: f.propertyName,\n        operator: f.operator,\n      }\n\n      if (f.operator === 'BETWEEN' && typeof f.value === 'string' && f.value.includes(',')) {\n        const [low, high] = f.value.split(',', 2).map((s) => s.trim())\n        return { ...base, value: low, highValue: high }\n      }\n\n      if (f.operator === 'HAS_PROPERTY' || f.operator === 'NOT_HAS_PROPERTY') {\n        return base\n      }\n\n      if (f.value !== undefined) {\n        return { ...base, value: f.value }\n      }\n\n      return base\n    })\n\n    filterGroups.push({ filters })\n  }\n\n  const body = {\n    query: input.query,\n    filterGroups: filterGroups.length ? filterGroups : undefined,\n    properties: input.properties,\n    limit: input.limit,\n    after: input.after,\n  }\n\n  const res = await integration.fetch(`/crm/v3/objects/deals/search`, {\n    method: 'POST',\n    body,\n  })\n  const data = await res.json()\n  const deals = Array.isArray(data?.results) ? data.results.map(summarize) : []\n  return {\n    total: typeof data?.total === 'number' ? data.total : deals.length,\n    count: deals.length,\n    paging: data?.paging ?? null,\n    note: 'Use id with get_deal for full record details.',\n    deals,\n  }\n}",
        "scope": "read"
      },
      {
        "name": "get_deal",
        "description": "Get a deal by ID. Use properties to request specific fields, and associations to include linked object IDs.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "HubSpot deal object ID."
            },
            "properties": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Specific property names to return (e.g. dealname, amount, pipeline, dealstage, closedate)."
            },
            "associations": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Associated object types to include (e.g. contacts, companies, tickets)."
            },
            "archived": {
              "type": "boolean"
            }
          },
          "required": [
            "id"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n\n  if (Array.isArray(input.properties)) {\n    for (const p of input.properties) params.append('properties', p)\n  }\n\n  if (Array.isArray(input.associations)) {\n    for (const a of input.associations) params.append('associations', a)\n  }\n\n  if (typeof input.archived === 'boolean') params.set('archived', String(input.archived))\n\n  const suffix = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(`/crm/v3/objects/deals/${encodeURIComponent(input.id)}${suffix}`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "create_deal",
        "description": "Create a deal. Provide dealname/amount/pipeline/dealstage and/or a properties map for other HubSpot deal properties.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "dealname": {
              "type": "string",
              "description": "Deal name (maps to dealname property)."
            },
            "amount": {
              "type": [
                "string",
                "number"
              ],
              "description": "Deal amount (maps to amount property)."
            },
            "pipeline": {
              "type": "string",
              "description": "Pipeline ID (maps to pipeline property)."
            },
            "dealstage": {
              "type": "string",
              "description": "Deal stage ID (maps to dealstage property)."
            },
            "closedate": {
              "type": [
                "string",
                "number"
              ],
              "description": "Close date. Prefer Unix timestamp in milliseconds (maps to closedate property)."
            },
            "properties": {
              "type": "object",
              "description": "Additional HubSpot deal properties to set (propertyName -> value).",
              "additionalProperties": true
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const props = { ...(input.properties || {}) }\n  if (input.dealname !== undefined) props.dealname = input.dealname\n  if (input.amount !== undefined) props.amount = String(input.amount)\n  if (input.pipeline !== undefined) props.pipeline = input.pipeline\n  if (input.dealstage !== undefined) props.dealstage = input.dealstage\n  if (input.closedate !== undefined) props.closedate = String(input.closedate)\n\n  const body = { properties: props }\n  const res = await integration.fetch(`/crm/v3/objects/deals`, {\n    method: 'POST',\n    body,\n  })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "update_deal",
        "description": "Update a deal by ID. Common updates include moving stages via dealstage. Fields not provided are unchanged.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "HubSpot deal object ID."
            },
            "dealname": {
              "type": "string"
            },
            "amount": {
              "type": [
                "string",
                "number"
              ]
            },
            "pipeline": {
              "type": "string"
            },
            "dealstage": {
              "type": "string"
            },
            "closedate": {
              "type": [
                "string",
                "number"
              ]
            },
            "properties": {
              "type": "object",
              "description": "HubSpot deal properties to update (propertyName -> value).",
              "additionalProperties": true
            }
          },
          "required": [
            "id"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const props = { ...(input.properties || {}) }\n  if (input.dealname !== undefined) props.dealname = input.dealname\n  if (input.amount !== undefined) props.amount = String(input.amount)\n  if (input.pipeline !== undefined) props.pipeline = input.pipeline\n  if (input.dealstage !== undefined) props.dealstage = input.dealstage\n  if (input.closedate !== undefined) props.closedate = String(input.closedate)\n\n  const body = { properties: props }\n  const res = await integration.fetch(`/crm/v3/objects/deals/${encodeURIComponent(input.id)}`, {\n    method: 'PATCH',\n    body,\n  })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "archive_deal",
        "description": "Archive (delete) a deal by ID. This moves the record to the recycle bin.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "HubSpot deal object ID."
            }
          },
          "required": [
            "id"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/crm/v3/objects/deals/${encodeURIComponent(input.id)}`, {\n    method: 'DELETE',\n  })\n  const text = await res.text()\n  if (!text) return { ok: res.ok, status: res.status }\n  try {\n    return JSON.parse(text)\n  } catch {\n    return { ok: res.ok, status: res.status, body: text }\n  }\n}",
        "scope": "write"
      },
      {
        "name": "search_tickets",
        "description": "Search for tickets. Use query for free-text search and filters for property-based filtering (e.g. hs_pipeline, hs_pipeline_stage, priority).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Free-text search query (optional)."
            },
            "filters": {
              "type": "array",
              "description": "Property-based filters converted into HubSpot filterGroups.",
              "items": {
                "type": "object",
                "properties": {
                  "propertyName": {
                    "type": "string"
                  },
                  "operator": {
                    "type": "string",
                    "enum": [
                      "EQ",
                      "NEQ",
                      "LT",
                      "LTE",
                      "GT",
                      "GTE",
                      "BETWEEN",
                      "HAS_PROPERTY",
                      "NOT_HAS_PROPERTY",
                      "CONTAINS_TOKEN"
                    ]
                  },
                  "value": {
                    "type": [
                      "string",
                      "number",
                      "boolean"
                    ]
                  }
                },
                "required": [
                  "propertyName",
                  "operator"
                ],
                "additionalProperties": false
              }
            },
            "properties": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Which ticket properties to return."
            },
            "limit": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100
            },
            "after": {
              "type": "string",
              "description": "Paging cursor token."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const summarize = (row) => ({\n    id: row?.id ?? null,\n    archived: !!row?.archived,\n    createdAt: row?.createdAt ?? null,\n    updatedAt: row?.updatedAt ?? null,\n    subject: row?.properties?.subject ?? null,\n    content: row?.properties?.content ?? null,\n    hsPipeline: row?.properties?.hs_pipeline ?? null,\n    hsPipelineStage: row?.properties?.hs_pipeline_stage ?? null,\n    hsTicketPriority: row?.properties?.hs_ticket_priority ?? null,\n    hsTicketCategory: row?.properties?.hs_ticket_category ?? null,\n  })\n\n  const filterGroups = []\n  if (Array.isArray(input.filters) && input.filters.length > 0) {\n    const filters = input.filters.map((f) => {\n      const base = {\n        propertyName: f.propertyName,\n        operator: f.operator,\n      }\n\n      if (f.operator === 'BETWEEN' && typeof f.value === 'string' && f.value.includes(',')) {\n        const [low, high] = f.value.split(',', 2).map((s) => s.trim())\n        return { ...base, value: low, highValue: high }\n      }\n\n      if (f.operator === 'HAS_PROPERTY' || f.operator === 'NOT_HAS_PROPERTY') {\n        return base\n      }\n\n      if (f.value !== undefined) {\n        return { ...base, value: f.value }\n      }\n\n      return base\n    })\n\n    filterGroups.push({ filters })\n  }\n\n  const body = {\n    query: input.query,\n    filterGroups: filterGroups.length ? filterGroups : undefined,\n    properties: input.properties,\n    limit: input.limit,\n    after: input.after,\n  }\n\n  const res = await integration.fetch(`/crm/v3/objects/tickets/search`, {\n    method: 'POST',\n    body,\n  })\n  const data = await res.json()\n  const tickets = Array.isArray(data?.results) ? data.results.map(summarize) : []\n  return {\n    total: typeof data?.total === 'number' ? data.total : tickets.length,\n    count: tickets.length,\n    paging: data?.paging ?? null,\n    note: 'Use id with get_ticket for full record details.',\n    tickets,\n  }\n}",
        "scope": "read"
      },
      {
        "name": "get_ticket",
        "description": "Get a ticket by ID. Use properties to request specific fields, and associations to include linked object IDs.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "HubSpot ticket object ID."
            },
            "properties": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Specific property names to return (e.g. subject, content, hs_pipeline, hs_pipeline_stage, hs_ticket_priority)."
            },
            "associations": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Associated object types to include (e.g. contacts, companies, deals)."
            },
            "archived": {
              "type": "boolean"
            }
          },
          "required": [
            "id"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n\n  if (Array.isArray(input.properties)) {\n    for (const p of input.properties) params.append('properties', p)\n  }\n\n  if (Array.isArray(input.associations)) {\n    for (const a of input.associations) params.append('associations', a)\n  }\n\n  if (typeof input.archived === 'boolean') params.set('archived', String(input.archived))\n\n  const suffix = params.toString() ? `?${params.toString()}` : ''\n  const res = await integration.fetch(\n    `/crm/v3/objects/tickets/${encodeURIComponent(input.id)}${suffix}`\n  )\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "create_ticket",
        "description": "Create a ticket. Provide subject/content/pipeline/stage and/or a properties map for other HubSpot ticket properties.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "subject": {
              "type": "string",
              "description": "Ticket subject (maps to subject property)."
            },
            "content": {
              "type": "string",
              "description": "Ticket content/body (maps to content property)."
            },
            "hs_pipeline": {
              "type": "string",
              "description": "Pipeline ID (maps to hs_pipeline property)."
            },
            "hs_pipeline_stage": {
              "type": "string",
              "description": "Pipeline stage ID (maps to hs_pipeline_stage property)."
            },
            "properties": {
              "type": "object",
              "description": "Additional HubSpot ticket properties to set (propertyName -> value).",
              "additionalProperties": true
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const props = { ...(input.properties || {}) }\n  if (input.subject !== undefined) props.subject = input.subject\n  if (input.content !== undefined) props.content = input.content\n  if (input.hs_pipeline !== undefined) props.hs_pipeline = input.hs_pipeline\n  if (input.hs_pipeline_stage !== undefined) props.hs_pipeline_stage = input.hs_pipeline_stage\n\n  const body = { properties: props }\n  const res = await integration.fetch(`/crm/v3/objects/tickets`, {\n    method: 'POST',\n    body,\n  })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "update_ticket",
        "description": "Update a ticket by ID. Common updates include changing hs_pipeline_stage. Fields not provided are unchanged.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "HubSpot ticket object ID."
            },
            "subject": {
              "type": "string"
            },
            "content": {
              "type": "string"
            },
            "hs_pipeline": {
              "type": "string"
            },
            "hs_pipeline_stage": {
              "type": "string"
            },
            "properties": {
              "type": "object",
              "description": "HubSpot ticket properties to update (propertyName -> value).",
              "additionalProperties": true
            }
          },
          "required": [
            "id"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const props = { ...(input.properties || {}) }\n  if (input.subject !== undefined) props.subject = input.subject\n  if (input.content !== undefined) props.content = input.content\n  if (input.hs_pipeline !== undefined) props.hs_pipeline = input.hs_pipeline\n  if (input.hs_pipeline_stage !== undefined) props.hs_pipeline_stage = input.hs_pipeline_stage\n\n  const body = { properties: props }\n  const res = await integration.fetch(`/crm/v3/objects/tickets/${encodeURIComponent(input.id)}`, {\n    method: 'PATCH',\n    body,\n  })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "archive_ticket",
        "description": "Archive (delete) a ticket by ID. This moves the record to the recycle bin.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "HubSpot ticket object ID."
            }
          },
          "required": [
            "id"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/crm/v3/objects/tickets/${encodeURIComponent(input.id)}`, {\n    method: 'DELETE',\n  })\n  const text = await res.text()\n  if (!text) return { ok: res.ok, status: res.status }\n  try {\n    return JSON.parse(text)\n  } catch {\n    return { ok: res.ok, status: res.status, body: text }\n  }\n}",
        "scope": "write"
      },
      {
        "name": "search_notes",
        "description": "Search notes. Use query for free-text search and filters for precise property-based filtering.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Free-text search query (optional)."
            },
            "filters": {
              "type": "array",
              "description": "Property-based filters converted into HubSpot filterGroups.",
              "items": {
                "type": "object",
                "properties": {
                  "propertyName": {
                    "type": "string"
                  },
                  "operator": {
                    "type": "string",
                    "enum": [
                      "EQ",
                      "NEQ",
                      "LT",
                      "LTE",
                      "GT",
                      "GTE",
                      "BETWEEN",
                      "HAS_PROPERTY",
                      "NOT_HAS_PROPERTY",
                      "CONTAINS_TOKEN"
                    ]
                  },
                  "value": {
                    "type": [
                      "string",
                      "number",
                      "boolean"
                    ]
                  }
                },
                "required": [
                  "propertyName",
                  "operator"
                ],
                "additionalProperties": false
              }
            },
            "properties": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Which note properties to return (e.g. hs_note_body, hs_timestamp)."
            },
            "limit": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100
            },
            "after": {
              "type": "string",
              "description": "Paging cursor token."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const filterGroups = []\n  if (Array.isArray(input.filters) && input.filters.length > 0) {\n    const filters = input.filters.map((f) => {\n      const base = {\n        propertyName: f.propertyName,\n        operator: f.operator,\n      }\n\n      if (f.operator === 'BETWEEN' && typeof f.value === 'string' && f.value.includes(',')) {\n        const [low, high] = f.value.split(',', 2).map((s) => s.trim())\n        return { ...base, value: low, highValue: high }\n      }\n\n      if (f.operator === 'HAS_PROPERTY' || f.operator === 'NOT_HAS_PROPERTY') {\n        return base\n      }\n\n      if (f.value !== undefined) {\n        return { ...base, value: f.value }\n      }\n\n      return base\n    })\n\n    filterGroups.push({ filters })\n  }\n\n  const body = {\n    query: input.query,\n    filterGroups: filterGroups.length ? filterGroups : undefined,\n    properties: input.properties,\n    limit: input.limit,\n    after: input.after,\n  }\n\n  const res = await integration.fetch(`/crm/v3/objects/notes/search`, {\n    method: 'POST',\n    body,\n  })\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "create_note",
        "description": "Create a note and (optionally) associate it to one or more CRM records (contacts, companies, deals, tickets). Provide body text; the handler sets hs_note_body and hs_timestamp automatically unless overridden.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "body": {
              "type": "string",
              "description": "Note text content. The handler maps this to hs_note_body."
            },
            "timestamp": {
              "type": [
                "string",
                "number"
              ],
              "description": "Timestamp for hs_timestamp. Prefer Unix timestamp in milliseconds. If omitted, current time is used."
            },
            "hubspot_owner_id": {
              "type": [
                "string",
                "number"
              ],
              "description": "Optional owner ID to attribute the note to."
            },
            "associateWith": {
              "type": "array",
              "description": "CRM records to associate this note with.",
              "items": {
                "type": "object",
                "properties": {
                  "objectType": {
                    "type": "string",
                    "description": "e.g. contacts, companies, deals, tickets"
                  },
                  "objectId": {
                    "type": "string",
                    "description": "HubSpot object ID"
                  }
                },
                "required": [
                  "objectType",
                  "objectId"
                ],
                "additionalProperties": false
              }
            },
            "properties": {
              "type": "object",
              "description": "Advanced: raw HubSpot note properties to set/override (propertyName -> value).",
              "additionalProperties": true
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const nowMs = Date.now()\n\n  const props = {\n    hs_note_body: input.body,\n    hs_timestamp: input.timestamp !== undefined ? String(input.timestamp) : String(nowMs),\n    ...(input.properties || {}),\n  }\n\n  if (input.hubspot_owner_id !== undefined) {\n    props.hubspot_owner_id = String(input.hubspot_owner_id)\n  }\n\n  const createRes = await integration.fetch(`/crm/v3/objects/notes`, {\n    method: 'POST',\n    body: { properties: props },\n  })\n  const note = await createRes.json()\n\n  const associationResults = []\n  if (Array.isArray(input.associateWith) && input.associateWith.length > 0 && note?.id) {\n    for (const a of input.associateWith) {\n      const res = await integration.fetch(\n        `/crm/v4/objects/notes/${encodeURIComponent(String(note.id))}/associations/default/${encodeURIComponent(\n          a.objectType\n        )}/${encodeURIComponent(a.objectId)}`,\n        { method: 'PUT' }\n      )\n      const text = await res.text()\n      if (!text) {\n        associationResults.push({ ok: res.ok, status: res.status })\n      } else {\n        try {\n          associationResults.push(JSON.parse(text))\n        } catch {\n          associationResults.push({ ok: res.ok, status: res.status, body: text })\n        }\n      }\n    }\n  }\n\n  return { note, associationResults }\n}",
        "scope": "write"
      },
      {
        "name": "search_tasks",
        "description": "Search tasks. Use query for free-text search and filters for precise property-based filtering.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Free-text search query (optional)."
            },
            "filters": {
              "type": "array",
              "description": "Property-based filters converted into HubSpot filterGroups.",
              "items": {
                "type": "object",
                "properties": {
                  "propertyName": {
                    "type": "string"
                  },
                  "operator": {
                    "type": "string",
                    "enum": [
                      "EQ",
                      "NEQ",
                      "LT",
                      "LTE",
                      "GT",
                      "GTE",
                      "BETWEEN",
                      "HAS_PROPERTY",
                      "NOT_HAS_PROPERTY",
                      "CONTAINS_TOKEN"
                    ]
                  },
                  "value": {
                    "type": [
                      "string",
                      "number",
                      "boolean"
                    ]
                  }
                },
                "required": [
                  "propertyName",
                  "operator"
                ],
                "additionalProperties": false
              }
            },
            "properties": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Which task properties to return (e.g. hs_task_subject, hs_task_status, hs_timestamp)."
            },
            "limit": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100
            },
            "after": {
              "type": "string",
              "description": "Paging cursor token."
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const filterGroups = []\n  if (Array.isArray(input.filters) && input.filters.length > 0) {\n    const filters = input.filters.map((f) => {\n      const base = {\n        propertyName: f.propertyName,\n        operator: f.operator,\n      }\n\n      if (f.operator === 'BETWEEN' && typeof f.value === 'string' && f.value.includes(',')) {\n        const [low, high] = f.value.split(',', 2).map((s) => s.trim())\n        return { ...base, value: low, highValue: high }\n      }\n\n      if (f.operator === 'HAS_PROPERTY' || f.operator === 'NOT_HAS_PROPERTY') {\n        return base\n      }\n\n      if (f.value !== undefined) {\n        return { ...base, value: f.value }\n      }\n\n      return base\n    })\n\n    filterGroups.push({ filters })\n  }\n\n  const body = {\n    query: input.query,\n    filterGroups: filterGroups.length ? filterGroups : undefined,\n    properties: input.properties,\n    limit: input.limit,\n    after: input.after,\n  }\n\n  const res = await integration.fetch(`/crm/v3/objects/tasks/search`, {\n    method: 'POST',\n    body,\n  })\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "create_task",
        "description": "Create a task and (optionally) associate it to one or more CRM records. Provide subject/body/status/priority and a due timestamp; the handler maps these to HubSpot task properties.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "subject": {
              "type": "string",
              "description": "Task subject/title (maps to hs_task_subject)."
            },
            "body": {
              "type": "string",
              "description": "Task body/notes (maps to hs_task_body)."
            },
            "status": {
              "type": "string",
              "enum": [
                "NOT_STARTED",
                "COMPLETED"
              ],
              "description": "Task status (maps to hs_task_status)."
            },
            "priority": {
              "type": "string",
              "enum": [
                "LOW",
                "MEDIUM",
                "HIGH"
              ],
              "description": "Task priority (maps to hs_task_priority)."
            },
            "dueTimestamp": {
              "type": [
                "string",
                "number"
              ],
              "description": "Due date/time timestamp for the task. HubSpot tasks use hs_timestamp for due date. Prefer Unix timestamp in milliseconds."
            },
            "hubspot_owner_id": {
              "type": [
                "string",
                "number"
              ],
              "description": "Optional owner ID to assign the task to."
            },
            "associateWith": {
              "type": "array",
              "description": "CRM records to associate this task with.",
              "items": {
                "type": "object",
                "properties": {
                  "objectType": {
                    "type": "string",
                    "description": "e.g. contacts, companies, deals, tickets"
                  },
                  "objectId": {
                    "type": "string",
                    "description": "HubSpot object ID"
                  }
                },
                "required": [
                  "objectType",
                  "objectId"
                ],
                "additionalProperties": false
              }
            },
            "properties": {
              "type": "object",
              "description": "Advanced: raw HubSpot task properties to set/override (propertyName -> value).",
              "additionalProperties": true
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const nowMs = Date.now()\n\n  const props = {\n    hs_task_subject: input.subject,\n    hs_task_body: input.body,\n    hs_task_status: input.status,\n    hs_task_priority: input.priority,\n    hs_timestamp:\n      input.dueTimestamp !== undefined ? String(input.dueTimestamp) : String(nowMs),\n    ...(input.properties || {}),\n  }\n\n  if (input.hubspot_owner_id !== undefined) {\n    props.hubspot_owner_id = String(input.hubspot_owner_id)\n  }\n\n  const createRes = await integration.fetch(`/crm/v3/objects/tasks`, {\n    method: 'POST',\n    body: { properties: props },\n  })\n  const task = await createRes.json()\n\n  const associationResults = []\n  if (Array.isArray(input.associateWith) && input.associateWith.length > 0 && task?.id) {\n    for (const a of input.associateWith) {\n      const res = await integration.fetch(\n        `/crm/v4/objects/tasks/${encodeURIComponent(String(task.id))}/associations/default/${encodeURIComponent(\n          a.objectType\n        )}/${encodeURIComponent(a.objectId)}`,\n        { method: 'PUT' }\n      )\n      const text = await res.text()\n      if (!text) {\n        associationResults.push({ ok: res.ok, status: res.status })\n      } else {\n        try {\n          associationResults.push(JSON.parse(text))\n        } catch {\n          associationResults.push({ ok: res.ok, status: res.status, body: text })\n        }\n      }\n    }\n  }\n\n  return { task, associationResults }\n}",
        "scope": "write"
      },
      {
        "name": "update_task",
        "description": "Update a task by ID. Common updates include setting hs_task_status to COMPLETED.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "description": "HubSpot task object ID."
            },
            "subject": {
              "type": "string",
              "description": "Maps to hs_task_subject."
            },
            "body": {
              "type": "string",
              "description": "Maps to hs_task_body."
            },
            "status": {
              "type": "string",
              "enum": [
                "NOT_STARTED",
                "COMPLETED"
              ],
              "description": "Maps to hs_task_status."
            },
            "priority": {
              "type": "string",
              "enum": [
                "LOW",
                "MEDIUM",
                "HIGH"
              ],
              "description": "Maps to hs_task_priority."
            },
            "dueTimestamp": {
              "type": [
                "string",
                "number"
              ],
              "description": "Maps to hs_timestamp (task due date/time). Prefer Unix timestamp in milliseconds."
            },
            "hubspot_owner_id": {
              "type": [
                "string",
                "number"
              ]
            },
            "properties": {
              "type": "object",
              "description": "Advanced: raw HubSpot task properties to update (propertyName -> value).",
              "additionalProperties": true
            }
          },
          "required": [
            "id"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const props = { ...(input.properties || {}) }\n\n  if (input.subject !== undefined) props.hs_task_subject = input.subject\n  if (input.body !== undefined) props.hs_task_body = input.body\n  if (input.status !== undefined) props.hs_task_status = input.status\n  if (input.priority !== undefined) props.hs_task_priority = input.priority\n  if (input.dueTimestamp !== undefined) props.hs_timestamp = String(input.dueTimestamp)\n  if (input.hubspot_owner_id !== undefined) props.hubspot_owner_id = String(input.hubspot_owner_id)\n\n  const res = await integration.fetch(`/crm/v3/objects/tasks/${encodeURIComponent(input.id)}`, {\n    method: 'PATCH',\n    body: { properties: props },\n  })\n  return await res.json()\n}",
        "scope": "write"
      }
    ]
  },
  "jira": {
    "manifest": {
      "name": "jira",
      "version": "0.1.0",
      "utils": [
        "adf"
      ],
      "toolsets": {
        "issues": {
          "label": "Issues",
          "description": "Search, read, create, and manage Jira issues"
        },
        "boards": {
          "label": "Boards & Sprints",
          "description": "Work with Jira Software boards, sprints, and backlogs"
        }
      },
      "tools": [
        {
          "name": "search_issues",
          "description": "Search for issues using JQL. Returns a compact list of issues with key fields. Uses the modern /search/jql endpoint with nextPageToken pagination.",
          "inputSchema": "schemas/search_issues.json",
          "handler": "handlers/search_issues.js",
          "scope": "read",
          "toolset": "issues"
        },
        {
          "name": "get_issue",
          "description": "Get details for a Jira issue by key (e.g. PROJ-123). Converts the issue description from Jira ADF into Markdown for easier reading.",
          "inputSchema": "schemas/get_issue.json",
          "handler": "handlers/get_issue.js",
          "scope": "read",
          "toolset": "issues"
        },
        {
          "name": "get_issue_comments",
          "description": "List comments on an issue. Converts each comment body from Jira ADF into Markdown.",
          "inputSchema": "schemas/get_issue_comments.json",
          "handler": "handlers/get_issue_comments.js",
          "scope": "read",
          "toolset": "issues"
        },
        {
          "name": "list_projects",
          "description": "List accessible Jira projects (key, name, type). Use this before creating issues to discover valid project keys.",
          "inputSchema": "schemas/list_projects.json",
          "handler": "handlers/list_projects.js",
          "scope": "read",
          "toolset": "issues"
        },
        {
          "name": "get_project",
          "description": "Get a project by key or ID. Includes issue types when expandIssueTypes=true, which is useful to choose a valid issue type name before create_issue.",
          "inputSchema": "schemas/get_project.json",
          "handler": "handlers/get_project.js",
          "scope": "read",
          "toolset": "issues"
        },
        {
          "name": "get_transitions",
          "description": "List available workflow transitions for an issue. Use this to discover valid transition names/IDs before calling transition_issue.",
          "inputSchema": "schemas/get_transitions.json",
          "handler": "handlers/get_transitions.js",
          "scope": "read",
          "toolset": "issues"
        },
        {
          "name": "get_myself",
          "description": "Get the authenticated Jira user profile for the current credentials.",
          "inputSchema": "schemas/empty.json",
          "handler": "handlers/get_myself.js",
          "scope": "read",
          "toolset": "issues"
        },
        {
          "name": "search_users",
          "description": "Search for users and return accountIds for assignment. Use this to find assigneeAccountId values for create_issue/update_issue/assign_issue.",
          "inputSchema": "schemas/search_users.json",
          "handler": "handlers/search_users.js",
          "scope": "read",
          "toolset": "issues"
        },
        {
          "name": "create_issue",
          "description": "Create a new Jira issue. Provide descriptionText as Markdown; the handler converts it to Jira ADF automatically. Use get_project to discover valid issue types.",
          "inputSchema": "schemas/create_issue.json",
          "handler": "handlers/create_issue.js",
          "scope": "write",
          "toolset": "issues"
        },
        {
          "name": "update_issue",
          "description": "Update a Jira issue. You can use simple fields like summary/descriptionText/labels/priorityName/assigneeAccountId, or pass advanced Jira 'fields'/'update' objects for complex updates. descriptionText is treated as Markdown and converted to ADF automatically.",
          "inputSchema": "schemas/update_issue.json",
          "handler": "handlers/update_issue.js",
          "scope": "write",
          "toolset": "issues"
        },
        {
          "name": "transition_issue",
          "description": "Transition an issue to a new workflow status. Provide transitionId or transitionName. If transitionName is provided, the handler resolves it by fetching transitions first. Optionally add a comment during the transition (commentText is treated as Markdown and converted to ADF).",
          "inputSchema": "schemas/transition_issue.json",
          "handler": "handlers/transition_issue.js",
          "scope": "write",
          "toolset": "issues"
        },
        {
          "name": "add_comment",
          "description": "Add a comment to an issue. Provide bodyText as Markdown; the handler converts it to Jira ADF automatically.",
          "inputSchema": "schemas/add_comment.json",
          "handler": "handlers/add_comment.js",
          "scope": "write",
          "toolset": "issues"
        },
        {
          "name": "assign_issue",
          "description": "Assign an issue to a user (by accountId) or unassign it (accountId=null). Use search_users to find accountIds.",
          "inputSchema": "schemas/assign_issue.json",
          "handler": "handlers/assign_issue.js",
          "scope": "write",
          "toolset": "issues"
        },
        {
          "name": "delete_issue",
          "description": "Delete an issue. This is irreversible. Use with care.",
          "inputSchema": "schemas/delete_issue.json",
          "handler": "handlers/delete_issue.js",
          "scope": "write",
          "toolset": "issues"
        },
        {
          "name": "list_boards",
          "description": "List Jira Software boards. Filter by projectKeyOrId and board type (scrum/kanban).",
          "inputSchema": "schemas/list_boards.json",
          "handler": "handlers/list_boards.js",
          "scope": "read",
          "toolset": "boards"
        },
        {
          "name": "get_board",
          "description": "Get details for a Jira Software board by boardId.",
          "inputSchema": "schemas/get_board.json",
          "handler": "handlers/get_board.js",
          "scope": "read",
          "toolset": "boards"
        },
        {
          "name": "list_sprints",
          "description": "List sprints for a board. Optionally filter by sprint state (future/active/closed).",
          "inputSchema": "schemas/list_sprints.json",
          "handler": "handlers/list_sprints.js",
          "scope": "read",
          "toolset": "boards"
        },
        {
          "name": "get_sprint",
          "description": "Get sprint details by sprintId (name, state, start/end dates, goal).",
          "inputSchema": "schemas/get_sprint.json",
          "handler": "handlers/get_sprint.js",
          "scope": "read",
          "toolset": "boards"
        },
        {
          "name": "get_sprint_issues",
          "description": "List issues in a sprint. Useful for sprint status reports and review preparation.",
          "inputSchema": "schemas/get_sprint_issues.json",
          "handler": "handlers/get_sprint_issues.js",
          "scope": "read",
          "toolset": "boards"
        },
        {
          "name": "get_backlog_issues",
          "description": "List issues in the backlog for a board.",
          "inputSchema": "schemas/get_backlog_issues.json",
          "handler": "handlers/get_backlog_issues.js",
          "scope": "read",
          "toolset": "boards"
        },
        {
          "name": "move_issues_to_sprint",
          "description": "Move one or more issues into a sprint (agile API).",
          "inputSchema": "schemas/move_issues_to_sprint.json",
          "handler": "handlers/move_issues_to_sprint.js",
          "scope": "write",
          "toolset": "boards"
        },
        {
          "name": "create_sprint",
          "description": "Create a sprint in a board (agile API). Use this for sprint-planning workflows and for integration test setup.",
          "inputSchema": "schemas/create_sprint.json",
          "handler": "handlers/create_sprint.js",
          "scope": "write",
          "toolset": "boards"
        },
        {
          "name": "update_sprint",
          "description": "Update a sprint (agile API). Use to rename, set/change goal, start a sprint (state: active, requires startDate + endDate), or close it (state: closed). Partial update — only provided fields are changed.",
          "inputSchema": "schemas/update_sprint.json",
          "handler": "handlers/update_sprint.js",
          "scope": "write",
          "toolset": "boards"
        }
      ]
    },
    "prompt": "# Jira usage guide\n\n## Core workflow patterns\n\n### Discover projects and issue types (before creating issues)\n\n1. Call `list_projects` to find the project key (e.g. `PROJ`).\n2. Call `get_project` with `projectIdOrKey=PROJ` to see available `issueTypes`.\n3. Use the returned issue type name with `create_issue.issueTypeName`.\n\n### Search issues (JQL)\n\nUse `search_issues` with JQL. Common examples:\n\n- My open issues:\n  - `assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC`\n- Recently updated issues in a project:\n  - `project = PROJ ORDER BY updated DESC`\n- Unassigned bugs:\n  - `project = PROJ AND issuetype = Bug AND assignee is EMPTY ORDER BY created DESC`\n- Blocked issues (label-based):\n  - `project = PROJ AND labels = blocked ORDER BY priority DESC, updated DESC`\n\nPagination:\n- `search_issues` uses `nextPageToken`. If `nextPageToken` is returned and `isLast=false`, pass it back to get the next page.\n\n### Read issue content\n\n- Use `get_issue` to read a compact issue summary.\n- `get_issue` converts Jira's ADF description into `descriptionMarkdown` when possible (fallback: `descriptionText`).\n- Use `get_issue_comments` to read the comment thread (comment bodies are converted to Markdown).\n\n### Transition an issue (change status)\n\nJira workflows are project-specific, so you must discover valid transitions:\n\n1. Call `get_transitions` to see available transition names/IDs for the issue.\n2. Call `transition_issue` using either `transitionId` (preferred) or `transitionName`.\n\n### Assigning issues\n\n1. Call `search_users` to find the user's `accountId`.\n2. Assign:\n   - `assign_issue { issueIdOrKey, accountId }`\n3. Unassign:\n   - `assign_issue { issueIdOrKey, accountId: null }`\n\n## Notes on Jira rich text (ADF)\n\nJira Cloud REST API v3 uses **Atlassian Document Format (ADF)** for fields like `description` and comment bodies.\n\n- Read tools convert ADF to Markdown so you can read it directly.\n- Write tools accept **Markdown** in their `*Text` fields and convert it to ADF (`descriptionText`, `bodyText`, `commentText`).\n\n### Round-trip Markdown workflow (recommended)\n\nYou can safely do a Markdown round-trip:\n\n1. `get_issue` -> edit `descriptionMarkdown`\n2. `update_issue { descriptionText: <your edited Markdown> }`\n\nSupported Markdown features when writing:\n\n- Headings (`#`, `##`, ...)\n- Bold/italic/strikethrough (`**bold**`, `*italic*`, `~~strike~~`)\n- Inline code and fenced code blocks (```), including optional language fences\n- Lists (ordered/unordered), nested lists\n- Blockquotes (`>`)\n- Horizontal rules (`---`)\n- Tables\n- Links (`[text](url)`)\n\n## Boards & sprints\n\nIf you’re using Jira Software:\n\n1. Call `list_boards` (optionally filter by `projectKeyOrId`).\n2. Call `list_sprints` for a board to find active/future sprints.\n3. Use `move_issues_to_sprint` to pull work into a sprint (sprint planning).\n\n",
    "variants": {
      "variants": {
        "api_token": {
          "label": "API Token (Email + Token)",
          "schema": {
            "type": "object",
            "properties": {
              "domain": {
                "type": "string",
                "title": "Jira site domain",
                "description": "The subdomain of your Jira Cloud site. Example: for https://mycompany.atlassian.net, enter 'mycompany'."
              },
              "email": {
                "type": "string",
                "title": "Atlassian account email",
                "description": "Email address of the Atlassian account that owns the API token."
              },
              "apiToken": {
                "type": "string",
                "title": "Atlassian API token",
                "description": "Atlassian API token for Jira Cloud. Combined with your email to form the Basic auth header."
              }
            },
            "required": [
              "domain",
              "email",
              "apiToken"
            ],
            "additionalProperties": false
          },
          "baseUrlTemplate": "https://{{domain}}.atlassian.net",
          "injection": {
            "headers": {
              "Authorization": "Basic {{base64(email + \":\" + apiToken)}}",
              "Accept": "application/json"
            }
          },
          "healthCheck": {
            "path": "/rest/api/3/myself"
          }
        }
      },
      "default": "api_token"
    },
    "hint": "Recommended: use **API Token (Email + Token)** unless you specifically need OAuth.\n\nIf you have multiple credential variants available, select one and follow its setup instructions.",
    "hintsByVariant": {
      "api_token": "1. Open your Jira Cloud site in the browser (it looks like `https://YOUR_DOMAIN.atlassian.net`).\n2. Copy `YOUR_DOMAIN` (the subdomain) and use it as `domain`.\n3. Create an Atlassian API token at `https://id.atlassian.com/manage-profile/security/api-tokens`.\n4. Use the same Atlassian account email as `email` and paste the token as `apiToken`.\n5. Ensure the Atlassian account has access to the Jira projects you want to work with.",
      "oauth_token": "1. Create an OAuth 2.0 (3LO) app in the Atlassian developer console.\n2. Add Jira scopes (typical minimum): `read:jira-work`, `write:jira-work`, `read:jira-user` (and `offline_access` if you want refresh tokens).\n3. Complete the OAuth flow to obtain an access token.\n4. Discover your `cloudId` by calling `GET https://api.atlassian.com/oauth/token/accessible-resources` with `Authorization: Bearer <access_token>` and using the returned `id`.\n5. Paste `cloudId` and the current OAuth `token` here."
    },
    "tools": [
      {
        "name": "search_issues",
        "description": "Search for issues using JQL. Returns a compact list of issues with key fields. Uses the modern /search/jql endpoint with nextPageToken pagination.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "jql": {
              "type": "string",
              "title": "JQL",
              "description": "Jira Query Language string, e.g. \"project = PROJ AND status != Done ORDER BY updated DESC\"."
            },
            "fields": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Optional list of fields to include (e.g. [\"summary\",\"status\",\"assignee\"]). If omitted, Jira uses its default set."
            },
            "maxResults": {
              "type": "integer",
              "minimum": 1,
              "maximum": 200,
              "default": 50
            },
            "nextPageToken": {
              "type": [
                "string",
                "null"
              ],
              "description": "Token from a previous response to fetch the next page."
            }
          },
          "required": [
            "jql"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {\n    jql: input.jql,\n    maxResults: input.maxResults ?? 50,\n  }\n\n  if (Array.isArray(input.fields) && input.fields.length)\n    body.fields = input.fields\n  if (input.nextPageToken)\n    body.nextPageToken = input.nextPageToken\n\n  const res = await integration.fetch('/rest/api/3/search/jql', {\n    method: 'POST',\n    body,\n  })\n\n  const data = await res.json()\n  const issues = Array.isArray(data.issues) ? data.issues : []\n\n  return {\n    isLast: Boolean(data.isLast),\n    nextPageToken: data.nextPageToken ?? null,\n    issues: issues.map((i) => ({\n      id: i.id,\n      key: i.key,\n      summary: i.fields?.summary ?? null,\n      status: i.fields?.status?.name ?? null,\n      assignee: i.fields?.assignee\n        ? {\n            accountId: i.fields.assignee.accountId ?? null,\n            displayName: i.fields.assignee.displayName ?? null,\n          }\n        : null,\n      priority: i.fields?.priority?.name ?? null,\n      issueType: i.fields?.issuetype?.name ?? null,\n      project: i.fields?.project\n        ? { key: i.fields.project.key ?? null, name: i.fields.project.name ?? null }\n        : null,\n      updated: i.fields?.updated ?? null,\n    })),\n  }\n}",
        "utils": [
          "adf"
        ],
        "scope": "read",
        "toolset": "issues"
      },
      {
        "name": "get_issue",
        "description": "Get details for a Jira issue by key (e.g. PROJ-123). Converts the issue description from Jira ADF into Markdown for easier reading.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "issueIdOrKey": {
              "type": "string",
              "title": "Issue key or ID",
              "description": "Issue key like \"PROJ-123\" or numeric issue ID."
            },
            "fields": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Optional list of fields to request. If omitted, a reasonable default set is used."
            },
            "expand": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Optional expand values supported by Jira (e.g. [\"renderedFields\"])."
            }
          },
          "required": [
            "issueIdOrKey"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const defaultFields = [\n    'summary',\n    'status',\n    'assignee',\n    'priority',\n    'issuetype',\n    'project',\n    'description',\n    'created',\n    'updated',\n    'labels',\n  ]\n\n  const fields = Array.isArray(input.fields) && input.fields.length ? input.fields : defaultFields\n  const params = new URLSearchParams()\n  if (fields?.length)\n    params.set('fields', fields.join(','))\n  if (Array.isArray(input.expand) && input.expand.length)\n    params.set('expand', input.expand.join(','))\n\n  const path = `/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}${params.toString() ? `?${params.toString()}` : ''}`\n  const res = await integration.fetch(path)\n  const data = await res.json()\n\n  const descAdf = data?.fields?.description\n  const descMarkdown = utils.adf?.toMarkdown(descAdf) || ''\n  const descText = descMarkdown ? '' : (utils.adf?.toPlainText(descAdf) || '')\n\n  return {\n    id: data.id ?? null,\n    key: data.key ?? null,\n    self: data.self ?? null,\n    summary: data.fields?.summary ?? null,\n    status: data.fields?.status\n      ? {\n          id: data.fields.status.id ?? null,\n          name: data.fields.status.name ?? null,\n          category: data.fields.status.statusCategory\n            ? {\n                key: data.fields.status.statusCategory.key ?? null,\n                name: data.fields.status.statusCategory.name ?? null,\n              }\n            : null,\n        }\n      : null,\n    assignee: data.fields?.assignee\n      ? {\n          accountId: data.fields.assignee.accountId ?? null,\n          displayName: data.fields.assignee.displayName ?? null,\n        }\n      : null,\n    priority: data.fields?.priority ? { id: data.fields.priority.id ?? null, name: data.fields.priority.name ?? null } : null,\n    issueType: data.fields?.issuetype ? { id: data.fields.issuetype.id ?? null, name: data.fields.issuetype.name ?? null } : null,\n    project: data.fields?.project ? { id: data.fields.project.id ?? null, key: data.fields.project.key ?? null, name: data.fields.project.name ?? null } : null,\n    labels: Array.isArray(data.fields?.labels) ? data.fields.labels : [],\n    descriptionMarkdown: descMarkdown || null,\n    descriptionText: descMarkdown ? null : (descText || null),\n    created: data.fields?.created ?? null,\n    updated: data.fields?.updated ?? null,\n  }\n}",
        "utils": [
          "adf"
        ],
        "scope": "read",
        "toolset": "issues"
      },
      {
        "name": "get_issue_comments",
        "description": "List comments on an issue. Converts each comment body from Jira ADF into Markdown.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "issueIdOrKey": {
              "type": "string",
              "description": "Issue key like \"PROJ-123\" or numeric issue ID."
            },
            "startAt": {
              "type": "integer",
              "minimum": 0,
              "default": 0
            },
            "maxResults": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 50
            }
          },
          "required": [
            "issueIdOrKey"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  params.set('startAt', String(input.startAt ?? 0))\n  params.set('maxResults', String(input.maxResults ?? 50))\n\n  const path = `/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}/comment?${params.toString()}`\n  const res = await integration.fetch(path)\n  const data = await res.json()\n  const comments = Array.isArray(data.comments) ? data.comments : []\n\n  return {\n    startAt: data.startAt ?? (input.startAt ?? 0),\n    maxResults: data.maxResults ?? (input.maxResults ?? 50),\n    total: data.total ?? comments.length,\n    comments: comments.map((c) => {\n      const md = utils.adf?.toMarkdown(c.body) || ''\n      const text = md ? '' : (utils.adf?.toPlainText(c.body) || '')\n      return {\n        id: c.id ?? null,\n        created: c.created ?? null,\n        updated: c.updated ?? null,\n        author: c.author\n          ? { accountId: c.author.accountId ?? null, displayName: c.author.displayName ?? null }\n          : null,\n        bodyMarkdown: md || null,\n        bodyText: md ? null : (text || null),\n      }\n    }),\n  }\n}",
        "utils": [
          "adf"
        ],
        "scope": "read",
        "toolset": "issues"
      },
      {
        "name": "list_projects",
        "description": "List accessible Jira projects (key, name, type). Use this before creating issues to discover valid project keys.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Optional search text to filter projects by name or key."
            },
            "startAt": {
              "type": "integer",
              "minimum": 0,
              "default": 0
            },
            "maxResults": {
              "type": "integer",
              "minimum": 1,
              "maximum": 50,
              "default": 50
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input?.query)\n    params.set('query', input.query)\n  params.set('startAt', String(input?.startAt ?? 0))\n  params.set('maxResults', String(input?.maxResults ?? 50))\n\n  const path = `/rest/api/3/project/search?${params.toString()}`\n  const res = await integration.fetch(path)\n  const data = await res.json()\n  const values = Array.isArray(data.values) ? data.values : []\n\n  return {\n    startAt: data.startAt ?? (input?.startAt ?? 0),\n    maxResults: data.maxResults ?? (input?.maxResults ?? 50),\n    total: data.total ?? values.length,\n    isLast: Boolean(data.isLast),\n    projects: values.map(p => ({\n      id: p.id ?? null,\n      key: p.key ?? null,\n      name: p.name ?? null,\n      projectTypeKey: p.projectTypeKey ?? null,\n      simplified: p.simplified ?? null,\n      style: p.style ?? null,\n      isPrivate: p.isPrivate ?? null,\n    })),\n  }\n}",
        "utils": [
          "adf"
        ],
        "scope": "read",
        "toolset": "issues"
      },
      {
        "name": "get_project",
        "description": "Get a project by key or ID. Includes issue types when expandIssueTypes=true, which is useful to choose a valid issue type name before create_issue.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "projectIdOrKey": {
              "type": "string",
              "description": "Project key like \"PROJ\" or numeric project ID."
            },
            "expandIssueTypes": {
              "type": "boolean",
              "default": true,
              "description": "If true, expands the project response to include issue types."
            }
          },
          "required": [
            "projectIdOrKey"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.expandIssueTypes !== false)\n    params.set('expand', 'issueTypes')\n\n  const path = `/rest/api/3/project/${encodeURIComponent(input.projectIdOrKey)}${params.toString() ? `?${params.toString()}` : ''}`\n  const res = await integration.fetch(path)\n  const data = await res.json()\n\n  const issueTypes = Array.isArray(data.issueTypes) ? data.issueTypes : []\n\n  return {\n    id: data.id ?? null,\n    key: data.key ?? null,\n    name: data.name ?? null,\n    projectTypeKey: data.projectTypeKey ?? null,\n    simplified: data.simplified ?? null,\n    style: data.style ?? null,\n    isPrivate: data.isPrivate ?? null,\n    issueTypes: issueTypes.map(t => ({\n      id: t.id ?? null,\n      name: t.name ?? null,\n      description: t.description ?? null,\n      subtask: t.subtask ?? null,\n    })),\n  }\n}",
        "utils": [
          "adf"
        ],
        "scope": "read",
        "toolset": "issues"
      },
      {
        "name": "get_transitions",
        "description": "List available workflow transitions for an issue. Use this to discover valid transition names/IDs before calling transition_issue.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "issueIdOrKey": {
              "type": "string",
              "description": "Issue key like \"PROJ-123\" or numeric issue ID."
            }
          },
          "required": [
            "issueIdOrKey"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const path = `/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}/transitions`\n  const res = await integration.fetch(path)\n  const data = await res.json()\n  const transitions = Array.isArray(data.transitions) ? data.transitions : []\n\n  return {\n    transitions: transitions.map(t => ({\n      id: t.id ?? null,\n      name: t.name ?? null,\n      to: t.to\n        ? {\n            id: t.to.id ?? null,\n            name: t.to.name ?? null,\n            statusCategory: t.to.statusCategory\n              ? { key: t.to.statusCategory.key ?? null, name: t.to.statusCategory.name ?? null }\n              : null,\n          }\n        : null,\n    })),\n  }\n}",
        "utils": [
          "adf"
        ],
        "scope": "read",
        "toolset": "issues"
      },
      {
        "name": "get_myself",
        "description": "Get the authenticated Jira user profile for the current credentials.",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "handlerCode": "async (_input) => {\n  const res = await integration.fetch('/rest/api/3/myself')\n  const data = await res.json()\n\n  return {\n    accountId: data.accountId ?? null,\n    displayName: data.displayName ?? null,\n    active: data.active ?? null,\n    timeZone: data.timeZone ?? null,\n    locale: data.locale ?? null,\n    emailAddress: data.emailAddress ?? null,\n  }\n}",
        "utils": [
          "adf"
        ],
        "scope": "read",
        "toolset": "issues"
      },
      {
        "name": "search_users",
        "description": "Search for users and return accountIds for assignment. Use this to find assigneeAccountId values for create_issue/update_issue/assign_issue.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Free-text query (name or email) to search users."
            },
            "maxResults": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 50
            }
          },
          "required": [
            "query"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  params.set('query', input.query)\n  params.set('maxResults', String(input.maxResults ?? 50))\n\n  const res = await integration.fetch(`/rest/api/3/user/search?${params.toString()}`)\n  const data = await res.json()\n  const users = Array.isArray(data) ? data : []\n\n  return {\n    users: users.map(u => ({\n      accountId: u.accountId ?? null,\n      displayName: u.displayName ?? null,\n      active: u.active ?? null,\n      accountType: u.accountType ?? null,\n      emailAddress: u.emailAddress ?? null,\n      timeZone: u.timeZone ?? null,\n    })),\n  }\n}",
        "utils": [
          "adf"
        ],
        "scope": "read",
        "toolset": "issues"
      },
      {
        "name": "create_issue",
        "description": "Create a new Jira issue. Provide descriptionText as Markdown; the handler converts it to Jira ADF automatically. Use get_project to discover valid issue types.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "projectKey": {
              "type": "string",
              "description": "Project key, e.g. \"PROJ\"."
            },
            "summary": {
              "type": "string",
              "description": "Issue summary/title."
            },
            "descriptionText": {
              "type": "string",
              "description": "Markdown issue description. The handler converts this to Jira ADF."
            },
            "issueTypeName": {
              "type": "string",
              "description": "Issue type name, e.g. \"Task\", \"Bug\", \"Story\"."
            },
            "issueTypeId": {
              "type": "string",
              "description": "Issue type ID (alternative to issueTypeName)."
            },
            "priorityName": {
              "type": "string",
              "description": "Priority name, e.g. \"High\"."
            },
            "priorityId": {
              "type": "string",
              "description": "Priority ID (alternative to priorityName)."
            },
            "labels": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Optional labels to apply."
            },
            "assigneeAccountId": {
              "type": "string",
              "description": "Optional assignee accountId. Use search_users to find accountIds."
            }
          },
          "required": [
            "projectKey",
            "summary"
          ],
          "anyOf": [
            {
              "required": [
                "issueTypeName"
              ]
            },
            {
              "required": [
                "issueTypeId"
              ]
            }
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const fields = {\n    project: { key: input.projectKey },\n    summary: input.summary,\n  }\n\n  if (input.descriptionText)\n    fields.description = utils.adf?.fromMarkdown(input.descriptionText)\n\n  if (input.issueTypeId) {\n    fields.issuetype = { id: String(input.issueTypeId) }\n  }\n  else if (input.issueTypeName) {\n    fields.issuetype = { name: String(input.issueTypeName) }\n  }\n  else {\n    throw new Error(`Missing issue type. Provide issueTypeId or issueTypeName (call get_project to discover available issue types).`)\n  }\n\n  if (input.priorityId)\n    fields.priority = { id: input.priorityId }\n  else if (input.priorityName)\n    fields.priority = { name: input.priorityName }\n\n  if (Array.isArray(input.labels))\n    fields.labels = input.labels\n\n  if (input.assigneeAccountId)\n    fields.assignee = { accountId: input.assigneeAccountId }\n\n  const res = await integration.fetch('/rest/api/3/issue', {\n    method: 'POST',\n    body: { fields },\n  })\n\n  return await res.json()\n}",
        "utils": [
          "adf"
        ],
        "scope": "write",
        "toolset": "issues"
      },
      {
        "name": "update_issue",
        "description": "Update a Jira issue. You can use simple fields like summary/descriptionText/labels/priorityName/assigneeAccountId, or pass advanced Jira 'fields'/'update' objects for complex updates. descriptionText is treated as Markdown and converted to ADF automatically.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "issueIdOrKey": {
              "type": "string",
              "description": "Issue key like \"PROJ-123\" or numeric issue ID."
            },
            "summary": {
              "type": "string",
              "description": "Set the issue summary/title."
            },
            "descriptionText": {
              "type": "string",
              "description": "Set the issue description as plain text (converted to ADF)."
            },
            "labels": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Set the full labels array (replaces existing labels)."
            },
            "priorityName": {
              "type": "string",
              "description": "Set priority by name."
            },
            "priorityId": {
              "type": "string",
              "description": "Set priority by ID."
            },
            "assigneeAccountId": {
              "type": [
                "string",
                "null"
              ],
              "description": "Assign to this accountId, or null to unassign."
            },
            "fields": {
              "type": "object",
              "description": "Advanced: direct Jira fields object. This is passed through to the Jira API. Use only if you know Jira field formats.",
              "additionalProperties": true
            },
            "update": {
              "type": "object",
              "description": "Advanced: Jira update operations object. Use for add/remove operations on fields like labels.",
              "additionalProperties": true
            }
          },
          "required": [
            "issueIdOrKey"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const fields = { ...(input.fields || {}) }\n  const update = input.update ? { ...(input.update || {}) } : undefined\n\n  if (typeof input.summary === 'string')\n    fields.summary = input.summary\n\n  if (typeof input.descriptionText === 'string')\n    fields.description = utils.adf?.fromMarkdown(input.descriptionText)\n\n  if (Array.isArray(input.labels))\n    fields.labels = input.labels\n\n  if (input.priorityId)\n    fields.priority = { id: input.priorityId }\n  else if (input.priorityName)\n    fields.priority = { name: input.priorityName }\n\n  if (input.assigneeAccountId !== undefined) {\n    fields.assignee = input.assigneeAccountId === null\n      ? null\n      : { accountId: input.assigneeAccountId }\n  }\n\n  const body = {}\n  if (Object.keys(fields).length)\n    body.fields = fields\n  if (update && Object.keys(update).length)\n    body.update = update\n\n  const res = await integration.fetch(`/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}`, {\n    method: 'PUT',\n    body,\n  })\n\n  if (res.status === 204)\n    return { success: true }\n  return await res.json()\n}",
        "utils": [
          "adf"
        ],
        "scope": "write",
        "toolset": "issues"
      },
      {
        "name": "transition_issue",
        "description": "Transition an issue to a new workflow status. Provide transitionId or transitionName. If transitionName is provided, the handler resolves it by fetching transitions first. Optionally add a comment during the transition (commentText is treated as Markdown and converted to ADF).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "issueIdOrKey": {
              "type": "string",
              "description": "Issue key like \"PROJ-123\" or numeric issue ID."
            },
            "transitionId": {
              "type": "string",
              "description": "Transition ID to apply. If omitted, provide transitionName."
            },
            "transitionName": {
              "type": "string",
              "description": "Human-readable transition name (case-insensitive). If provided, the handler will resolve it to an ID via get_transitions."
            },
            "commentText": {
              "type": "string",
              "description": "Optional comment to add during the transition (plain text, converted to ADF)."
            },
            "fields": {
              "type": "object",
              "description": "Optional Jira fields to set during the transition.",
              "additionalProperties": true
            },
            "update": {
              "type": "object",
              "description": "Optional Jira update operations to apply during the transition.",
              "additionalProperties": true
            }
          },
          "required": [
            "issueIdOrKey"
          ],
          "anyOf": [
            {
              "required": [
                "transitionId"
              ]
            },
            {
              "required": [
                "transitionName"
              ]
            }
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const resolveTransitionId = async (issueIdOrKey, transitionId, transitionName) => {\n    if (transitionId)\n      return String(transitionId)\n    const name = String(transitionName || '').trim().toLowerCase()\n    if (!name)\n      return null\n\n    const res = await integration.fetch(`/rest/api/3/issue/${encodeURIComponent(issueIdOrKey)}/transitions`)\n    const data = await res.json()\n    const transitions = Array.isArray(data.transitions) ? data.transitions : []\n    const match = transitions.find(t => String(t?.name || '').trim().toLowerCase() === name)\n    return match?.id ? String(match.id) : null\n  }\n\n  const id = await resolveTransitionId(input.issueIdOrKey, input.transitionId, input.transitionName)\n  if (!id)\n    throw new Error(`Could not resolve transition. Provide a valid transitionId or transitionName (call get_transitions to see available transitions).`)\n\n  const body = {\n    transition: { id },\n  }\n\n  if (input.fields && typeof input.fields === 'object')\n    body.fields = input.fields\n  if (input.update && typeof input.update === 'object')\n    body.update = input.update\n\n  if (input.commentText) {\n    body.update = body.update || {}\n    body.update.comment = body.update.comment || []\n    body.update.comment.push({ add: { body: utils.adf?.fromMarkdown(input.commentText) } })\n  }\n\n  const res = await integration.fetch(`/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}/transitions`, {\n    method: 'POST',\n    body,\n  })\n\n  if (res.status === 204)\n    return { success: true }\n  return await res.json()\n}",
        "utils": [
          "adf"
        ],
        "scope": "write",
        "toolset": "issues"
      },
      {
        "name": "add_comment",
        "description": "Add a comment to an issue. Provide bodyText as Markdown; the handler converts it to Jira ADF automatically.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "issueIdOrKey": {
              "type": "string",
              "description": "Issue key like \"PROJ-123\" or numeric issue ID."
            },
            "bodyText": {
              "type": "string",
              "description": "Plain-text comment body. Converted to ADF by the handler."
            }
          },
          "required": [
            "issueIdOrKey",
            "bodyText"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}/comment`, {\n    method: 'POST',\n    body: { body: utils.adf?.fromMarkdown(input.bodyText) },\n  })\n\n  return await res.json()\n}",
        "utils": [
          "adf"
        ],
        "scope": "write",
        "toolset": "issues"
      },
      {
        "name": "assign_issue",
        "description": "Assign an issue to a user (by accountId) or unassign it (accountId=null). Use search_users to find accountIds.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "issueIdOrKey": {
              "type": "string",
              "description": "Issue key like \"PROJ-123\" or numeric issue ID."
            },
            "accountId": {
              "type": [
                "string",
                "null"
              ],
              "description": "Account ID to assign the issue to, or null to unassign."
            }
          },
          "required": [
            "issueIdOrKey",
            "accountId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}/assignee`, {\n    method: 'PUT',\n    body: { accountId: input.accountId },\n  })\n\n  if (res.status === 204)\n    return { success: true }\n  return await res.json()\n}",
        "utils": [
          "adf"
        ],
        "scope": "write",
        "toolset": "issues"
      },
      {
        "name": "delete_issue",
        "description": "Delete an issue. This is irreversible. Use with care.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "issueIdOrKey": {
              "type": "string",
              "description": "Issue key like \"PROJ-123\" or numeric issue ID."
            }
          },
          "required": [
            "issueIdOrKey"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/rest/api/3/issue/${encodeURIComponent(input.issueIdOrKey)}`, {\n    method: 'DELETE',\n  })\n\n  if (res.status === 204)\n    return { success: true }\n  return await res.json()\n}",
        "utils": [
          "adf"
        ],
        "scope": "write",
        "toolset": "issues"
      },
      {
        "name": "list_boards",
        "description": "List Jira Software boards. Filter by projectKeyOrId and board type (scrum/kanban).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "projectKeyOrId": {
              "type": "string",
              "description": "Optional project key (e.g. \"PROJ\") or project ID to filter boards."
            },
            "type": {
              "type": "string",
              "enum": [
                "scrum",
                "kanban"
              ],
              "description": "Optional board type filter."
            },
            "startAt": {
              "type": "integer",
              "minimum": 0,
              "default": 0
            },
            "maxResults": {
              "type": "integer",
              "minimum": 1,
              "maximum": 50,
              "default": 50
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input?.projectKeyOrId)\n    params.set('projectKeyOrId', input.projectKeyOrId)\n  if (input?.type)\n    params.set('type', input.type)\n  params.set('startAt', String(input?.startAt ?? 0))\n  params.set('maxResults', String(input?.maxResults ?? 50))\n\n  const res = await integration.fetch(`/rest/agile/1.0/board?${params.toString()}`)\n  const data = await res.json()\n  const values = Array.isArray(data.values) ? data.values : []\n\n  return {\n    startAt: data.startAt ?? (input?.startAt ?? 0),\n    maxResults: data.maxResults ?? (input?.maxResults ?? 50),\n    total: data.total ?? values.length,\n    isLast: Boolean(data.isLast),\n    boards: values.map(b => ({\n      id: b.id ?? null,\n      name: b.name ?? null,\n      type: b.type ?? null,\n      location: b.location\n        ? {\n            projectId: b.location.projectId ?? null,\n            projectKey: b.location.projectKey ?? null,\n            projectName: b.location.projectName ?? null,\n          }\n        : null,\n      self: b.self ?? null,\n    })),\n  }\n}",
        "utils": [
          "adf"
        ],
        "scope": "read",
        "toolset": "boards"
      },
      {
        "name": "get_board",
        "description": "Get details for a Jira Software board by boardId.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "boardId": {
              "type": "integer",
              "minimum": 1,
              "description": "Board ID."
            }
          },
          "required": [
            "boardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/rest/agile/1.0/board/${encodeURIComponent(String(input.boardId))}`)\n  const data = await res.json()\n  return data\n}",
        "utils": [
          "adf"
        ],
        "scope": "read",
        "toolset": "boards"
      },
      {
        "name": "list_sprints",
        "description": "List sprints for a board. Optionally filter by sprint state (future/active/closed).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "boardId": {
              "type": "integer",
              "minimum": 1,
              "description": "Board ID."
            },
            "state": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": [
                  "future",
                  "active",
                  "closed"
                ]
              },
              "description": "Optional sprint states to include. If omitted, Jira returns all."
            },
            "startAt": {
              "type": "integer",
              "minimum": 0,
              "default": 0
            },
            "maxResults": {
              "type": "integer",
              "minimum": 1,
              "maximum": 50,
              "default": 50
            }
          },
          "required": [
            "boardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (Array.isArray(input.state) && input.state.length)\n    params.set('state', input.state.join(','))\n  params.set('startAt', String(input.startAt ?? 0))\n  params.set('maxResults', String(input.maxResults ?? 50))\n\n  const res = await integration.fetch(`/rest/agile/1.0/board/${encodeURIComponent(String(input.boardId))}/sprint?${params.toString()}`)\n  const data = await res.json()\n  const values = Array.isArray(data.values) ? data.values : []\n\n  return {\n    startAt: data.startAt ?? (input.startAt ?? 0),\n    maxResults: data.maxResults ?? (input.maxResults ?? 50),\n    total: data.total ?? values.length,\n    isLast: Boolean(data.isLast),\n    sprints: values.map(s => ({\n      id: s.id ?? null,\n      name: s.name ?? null,\n      state: s.state ?? null,\n      goal: s.goal ?? null,\n      startDate: s.startDate ?? null,\n      endDate: s.endDate ?? null,\n      completeDate: s.completeDate ?? null,\n      self: s.self ?? null,\n    })),\n  }\n}",
        "utils": [
          "adf"
        ],
        "scope": "read",
        "toolset": "boards"
      },
      {
        "name": "get_sprint",
        "description": "Get sprint details by sprintId (name, state, start/end dates, goal).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "sprintId": {
              "type": "integer",
              "minimum": 1,
              "description": "Sprint ID."
            }
          },
          "required": [
            "sprintId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/rest/agile/1.0/sprint/${encodeURIComponent(String(input.sprintId))}`)\n  return await res.json()\n}",
        "utils": [
          "adf"
        ],
        "scope": "read",
        "toolset": "boards"
      },
      {
        "name": "get_sprint_issues",
        "description": "List issues in a sprint. Useful for sprint status reports and review preparation.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "sprintId": {
              "type": "integer",
              "minimum": 1,
              "description": "Sprint ID."
            },
            "jql": {
              "type": "string",
              "description": "Optional additional JQL to filter sprint issues."
            },
            "fields": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Optional issue fields to include."
            },
            "startAt": {
              "type": "integer",
              "minimum": 0,
              "default": 0
            },
            "maxResults": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 50
            }
          },
          "required": [
            "sprintId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.jql)\n    params.set('jql', input.jql)\n  if (Array.isArray(input.fields) && input.fields.length)\n    params.set('fields', input.fields.join(','))\n  params.set('startAt', String(input.startAt ?? 0))\n  params.set('maxResults', String(input.maxResults ?? 50))\n\n  const res = await integration.fetch(`/rest/agile/1.0/sprint/${encodeURIComponent(String(input.sprintId))}/issue?${params.toString()}`)\n  const data = await res.json()\n  const issues = Array.isArray(data?.issues)\n    ? data.issues.map(i => ({\n      id: i.id ?? null,\n      key: i.key ?? null,\n      summary: i.fields?.summary ?? null,\n      status: i.fields?.status?.name ?? null,\n      assignee: i.fields?.assignee\n        ? {\n            accountId: i.fields.assignee.accountId ?? null,\n            displayName: i.fields.assignee.displayName ?? null,\n          }\n        : null,\n      priority: i.fields?.priority?.name ?? null,\n      issueType: i.fields?.issuetype?.name ?? null,\n      updated: i.fields?.updated ?? null,\n    }))\n    : []\n  return {\n    startAt: data?.startAt ?? 0,\n    maxResults: data?.maxResults ?? issues.length,\n    total: data?.total ?? issues.length,\n    count: issues.length,\n    note: 'Use issue key or id with get_issue for full issue details.',\n    issues,\n  }\n}",
        "utils": [
          "adf"
        ],
        "scope": "read",
        "toolset": "boards"
      },
      {
        "name": "get_backlog_issues",
        "description": "List issues in the backlog for a board.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "boardId": {
              "type": "integer",
              "minimum": 1,
              "description": "Board ID."
            },
            "jql": {
              "type": "string",
              "description": "Optional additional JQL to filter backlog issues."
            },
            "fields": {
              "type": "array",
              "items": {
                "type": "string"
              },
              "description": "Optional issue fields to include."
            },
            "startAt": {
              "type": "integer",
              "minimum": 0,
              "default": 0
            },
            "maxResults": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 50
            }
          },
          "required": [
            "boardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.jql)\n    params.set('jql', input.jql)\n  if (Array.isArray(input.fields) && input.fields.length)\n    params.set('fields', input.fields.join(','))\n  params.set('startAt', String(input.startAt ?? 0))\n  params.set('maxResults', String(input.maxResults ?? 50))\n\n  const res = await integration.fetch(`/rest/agile/1.0/board/${encodeURIComponent(String(input.boardId))}/backlog?${params.toString()}`)\n  const data = await res.json()\n  const issues = Array.isArray(data?.issues)\n    ? data.issues.map(i => ({\n      id: i.id ?? null,\n      key: i.key ?? null,\n      summary: i.fields?.summary ?? null,\n      status: i.fields?.status?.name ?? null,\n      assignee: i.fields?.assignee\n        ? {\n            accountId: i.fields.assignee.accountId ?? null,\n            displayName: i.fields.assignee.displayName ?? null,\n          }\n        : null,\n      priority: i.fields?.priority?.name ?? null,\n      issueType: i.fields?.issuetype?.name ?? null,\n      updated: i.fields?.updated ?? null,\n    }))\n    : []\n  return {\n    startAt: data?.startAt ?? 0,\n    maxResults: data?.maxResults ?? issues.length,\n    total: data?.total ?? issues.length,\n    count: issues.length,\n    note: 'Use issue key or id with get_issue for full issue details.',\n    issues,\n  }\n}",
        "utils": [
          "adf"
        ],
        "scope": "read",
        "toolset": "boards"
      },
      {
        "name": "move_issues_to_sprint",
        "description": "Move one or more issues into a sprint (agile API).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "sprintId": {
              "type": "integer",
              "minimum": 1,
              "description": "Sprint ID."
            },
            "issueKeys": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "string"
              },
              "description": "Issue keys to move into the sprint, e.g. [\"PROJ-1\",\"PROJ-2\"]."
            }
          },
          "required": [
            "sprintId",
            "issueKeys"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/rest/agile/1.0/sprint/${encodeURIComponent(String(input.sprintId))}/issue`, {\n    method: 'POST',\n    body: { issues: input.issueKeys },\n  })\n\n  if (res.status === 204)\n    return { success: true }\n  return await res.json()\n}",
        "utils": [
          "adf"
        ],
        "scope": "write",
        "toolset": "boards"
      },
      {
        "name": "create_sprint",
        "description": "Create a sprint in a board (agile API). Use this for sprint-planning workflows and for integration test setup.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "boardId": {
              "type": "integer",
              "minimum": 1,
              "description": "Origin board ID to create the sprint in (sent to Jira as originBoardId)."
            },
            "name": {
              "type": "string",
              "description": "Sprint name."
            },
            "startDate": {
              "type": "string",
              "description": "Optional start date (ISO 8601)."
            },
            "endDate": {
              "type": "string",
              "description": "Optional end date (ISO 8601)."
            },
            "goal": {
              "type": "string",
              "description": "Optional sprint goal."
            }
          },
          "required": [
            "boardId",
            "name"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {\n    originBoardId: input.boardId,\n    name: input.name,\n  }\n  if (input.startDate)\n    body.startDate = input.startDate\n  if (input.endDate)\n    body.endDate = input.endDate\n  if (input.goal)\n    body.goal = input.goal\n\n  const res = await integration.fetch('/rest/agile/1.0/sprint', {\n    method: 'POST',\n    body,\n  })\n  return await res.json()\n}",
        "utils": [
          "adf"
        ],
        "scope": "write",
        "toolset": "boards"
      },
      {
        "name": "update_sprint",
        "description": "Update a sprint (agile API). Use to rename, set/change goal, start a sprint (state: active, requires startDate + endDate), or close it (state: closed). Partial update — only provided fields are changed.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "sprintId": {
              "type": "integer",
              "minimum": 1,
              "description": "Sprint ID to update."
            },
            "name": {
              "type": "string",
              "description": "New sprint name."
            },
            "goal": {
              "type": "string",
              "description": "Sprint goal."
            },
            "state": {
              "type": "string",
              "enum": [
                "future",
                "active",
                "closed"
              ],
              "description": "Sprint state. Use 'active' to start a sprint, 'closed' to end it. Transitioning to 'active' requires startDate."
            },
            "startDate": {
              "type": "string",
              "description": "Sprint start date (ISO 8601, e.g. 2024-01-15). Required when starting a sprint (state: active)."
            },
            "endDate": {
              "type": "string",
              "description": "Sprint end date (ISO 8601, e.g. 2024-01-29). Required when starting a sprint (state: active)."
            }
          },
          "required": [
            "sprintId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const body = {}\n  if (input.name !== undefined)\n    body.name = input.name\n  if (input.goal !== undefined)\n    body.goal = input.goal\n  if (input.state !== undefined)\n    body.state = input.state\n  if (input.startDate !== undefined)\n    body.startDate = input.startDate\n  if (input.endDate !== undefined)\n    body.endDate = input.endDate\n\n  const res = await integration.fetch(`/rest/agile/1.0/sprint/${encodeURIComponent(String(input.sprintId))}`, {\n    method: 'POST',\n    body,\n  })\n\n  return await res.json()\n}",
        "utils": [
          "adf"
        ],
        "scope": "write",
        "toolset": "boards"
      }
    ]
  },
  "notion": {
    "manifest": {
      "name": "notion",
      "version": "0.1.0",
      "baseUrl": "https://api.notion.com/v1",
      "toolsets": {
        "pages": {
          "label": "Pages",
          "description": "Find, read, and edit Notion pages, blocks, comments, and users"
        },
        "databases": {
          "label": "Databases",
          "description": "Query and manage Notion databases"
        }
      },
      "tools": [
        {
          "name": "search",
          "description": "Search across all accessible Notion content (pages, databases).",
          "inputSchema": "schemas/search.json",
          "handler": "handlers/search.js",
          "scope": "read",
          "toolset": "pages"
        },
        {
          "name": "retrieve_page",
          "description": "Retrieve a page by ID.",
          "inputSchema": "schemas/id_page.json",
          "handler": "handlers/retrieve_page.js",
          "scope": "read",
          "toolset": "pages"
        },
        {
          "name": "retrieve_page_property_item",
          "description": "Retrieve a specific page property item (handles rollups and pagination).",
          "inputSchema": "schemas/retrieve_page_property_item.json",
          "handler": "handlers/retrieve_page_property_item.js",
          "scope": "read",
          "toolset": "pages"
        },
        {
          "name": "list_block_children",
          "description": "List child blocks for a block (including page blocks).",
          "inputSchema": "schemas/list_block_children.json",
          "handler": "handlers/list_block_children.js",
          "scope": "read",
          "toolset": "pages"
        },
        {
          "name": "retrieve_block",
          "description": "Retrieve a block by ID.",
          "inputSchema": "schemas/id_block.json",
          "handler": "handlers/retrieve_block.js",
          "scope": "read",
          "toolset": "pages"
        },
        {
          "name": "list_users",
          "description": "List users in the workspace.",
          "inputSchema": "schemas/list_users.json",
          "handler": "handlers/list_users.js",
          "scope": "read",
          "toolset": "pages"
        },
        {
          "name": "retrieve_user",
          "description": "Retrieve a user by ID.",
          "inputSchema": "schemas/id_user.json",
          "handler": "handlers/retrieve_user.js",
          "scope": "read",
          "toolset": "pages"
        },
        {
          "name": "list_comments",
          "description": "List comments for a given discussion or page block.",
          "inputSchema": "schemas/list_comments.json",
          "handler": "handlers/list_comments.js",
          "scope": "read",
          "toolset": "pages"
        },
        {
          "name": "get_me",
          "description": "Retrieve the authenticated user (bot) profile.",
          "inputSchema": "schemas/empty.json",
          "handler": "handlers/get_me.js",
          "scope": "read",
          "toolset": "pages"
        },
        {
          "name": "create_page",
          "description": "Create a new page in a database or as a child of a page.",
          "inputSchema": "schemas/create_page.json",
          "handler": "handlers/create_page.js",
          "scope": "write",
          "toolset": "pages"
        },
        {
          "name": "update_page_properties",
          "description": "Update page properties, archive/unarchive, icon and cover.",
          "inputSchema": "schemas/update_page_properties.json",
          "handler": "handlers/update_page_properties.js",
          "scope": "write",
          "toolset": "pages"
        },
        {
          "name": "append_block_children",
          "description": "Append child blocks to a block (including page blocks).",
          "inputSchema": "schemas/append_block_children.json",
          "handler": "handlers/append_block_children.js",
          "scope": "write",
          "toolset": "pages"
        },
        {
          "name": "update_block",
          "description": "Update a block (content, archived state, etc).",
          "inputSchema": "schemas/update_block.json",
          "handler": "handlers/update_block.js",
          "scope": "write",
          "toolset": "pages"
        },
        {
          "name": "delete_block",
          "description": "Archive a block (soft delete).",
          "inputSchema": "schemas/delete_block.json",
          "handler": "handlers/delete_block.js",
          "scope": "write",
          "toolset": "pages"
        },
        {
          "name": "create_comment",
          "description": "Create a comment on a discussion or block.",
          "inputSchema": "schemas/create_comment.json",
          "handler": "handlers/create_comment.js",
          "scope": "write",
          "toolset": "pages"
        },
        {
          "name": "retrieve_database",
          "description": "Retrieve a database by ID.",
          "inputSchema": "schemas/id_database.json",
          "handler": "handlers/retrieve_database.js",
          "scope": "read",
          "toolset": "databases"
        },
        {
          "name": "query_database",
          "description": "Query a database with optional filter, sorts, and pagination.",
          "inputSchema": "schemas/query_database.json",
          "handler": "handlers/query_database.js",
          "scope": "read",
          "toolset": "databases"
        },
        {
          "name": "create_database",
          "description": "Create a new database under a page.",
          "inputSchema": "schemas/create_database.json",
          "handler": "handlers/create_database.js",
          "scope": "write",
          "toolset": "databases"
        },
        {
          "name": "update_database",
          "description": "Update database title, description, properties, or archived state.",
          "inputSchema": "schemas/update_database.json",
          "handler": "handlers/update_database.js",
          "scope": "write",
          "toolset": "databases"
        }
      ]
    },
    "prompt": "## Appending paragraph blocks\n\nWhen appending a paragraph block to a Notion page, ensure the `rich_text` field is correctly defined within the `paragraph` type. Example format:\n\n```json\n{\n  \"block_id\": \"<page_id>\",\n  \"children\": [\n    {\n      \"object\": \"block\",\n      \"type\": \"paragraph\",\n      \"paragraph\": {\n        \"rich_text\": [\n          {\n            \"type\": \"text\",\n            \"text\": {\n              \"content\": \"Your text here\"\n            }\n          }\n        ]\n      }\n    }\n  ]\n}\n```\n\n",
    "variants": {
      "variants": {
        "internal_integration": {
          "label": "Internal Integration Token",
          "schema": {
            "type": "object",
            "properties": {
              "token": {
                "type": "string",
                "title": "Internal Integration Token",
                "description": "Notion internal integration token (starts with \"secret_\")."
              }
            },
            "required": [
              "token"
            ],
            "additionalProperties": false
          },
          "injection": {
            "headers": {
              "Authorization": "Bearer {{token}}",
              "Notion-Version": "2022-06-28"
            }
          },
          "healthCheck": {
            "path": "/users/me"
          }
        }
      },
      "default": "internal_integration"
    },
    "hint": "1. Go to `https://www.notion.so/profile/integrations/internal`\n2. Create a Notion integration in Notion’s developer settings\n3. Share your target pages/databases with that integration so it has access\n4. Copy the **Internal Integration Token** (usually starts with `secret_`)",
    "hintsByVariant": {},
    "tools": [
      {
        "name": "search",
        "description": "Search across all accessible Notion content (pages, databases).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "query"
          ],
          "properties": {
            "query": {
              "type": "string"
            },
            "filter": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string",
                  "enum": [
                    "page",
                    "database"
                  ]
                },
                "property": {
                  "type": "string",
                  "enum": [
                    "object"
                  ]
                }
              },
              "additionalProperties": false
            },
            "sort": {
              "type": "object",
              "properties": {
                "direction": {
                  "type": "string",
                  "enum": [
                    "ascending",
                    "descending"
                  ]
                },
                "timestamp": {
                  "type": "string",
                  "enum": [
                    "last_edited_time"
                  ]
                }
              },
              "additionalProperties": false
            },
            "start_cursor": {
              "type": "string"
            },
            "page_size": {
              "type": "number",
              "minimum": 1,
              "maximum": 100
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const titleFromResult = (result) => {\n    const titleProp = result?.properties?.title\n    if (titleProp?.type === 'title' && Array.isArray(titleProp.title))\n      return titleProp.title.map(x => x?.plain_text || '').join('').trim() || null\n    if (Array.isArray(result?.title))\n      return result.title.map(x => x?.plain_text || '').join('').trim() || null\n    return null\n  }\n\n  const body = {\n    query: input.query || '',\n    filter: input.filter || undefined,\n    sort: input.sort || undefined,\n    start_cursor: input.start_cursor || undefined,\n    page_size: input.page_size || undefined,\n  }\n  const res = await integration.fetch(`/search`, { method: 'POST', body })\n  const data = await res.json()\n  const results = Array.isArray(data?.results)\n    ? data.results.map((r) => {\n      const objectType = r?.object || null\n      const id = r?.id || null\n      return {\n        object: objectType,\n        id,\n        title: titleFromResult(r),\n        url: r?.url ?? null,\n        createdTime: r?.created_time ?? null,\n        lastEditedTime: r?.last_edited_time ?? null,\n        followUpTool: objectType === 'database' ? 'retrieve_database' : objectType === 'page' ? 'retrieve_page' : null,\n      }\n    })\n    : []\n  return {\n    count: results.length,\n    has_more: !!data?.has_more,\n    next_cursor: data?.next_cursor ?? null,\n    note: 'Use id with retrieve_page or retrieve_database for full details.',\n    results,\n  }\n}",
        "scope": "read",
        "toolset": "pages"
      },
      {
        "name": "retrieve_page",
        "description": "Retrieve a page by ID.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "page_id"
          ],
          "properties": {
            "page_id": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/pages/${encodeURIComponent(input.page_id)}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "pages"
      },
      {
        "name": "retrieve_page_property_item",
        "description": "Retrieve a specific page property item (handles rollups and pagination).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "page_id",
            "property_id"
          ],
          "properties": {
            "page_id": {
              "type": "string"
            },
            "property_id": {
              "type": "string"
            },
            "start_cursor": {
              "type": "string"
            },
            "page_size": {
              "type": "number",
              "minimum": 1,
              "maximum": 100
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.start_cursor)\n    params.set('start_cursor', input.start_cursor)\n  if (input.page_size)\n    params.set('page_size', String(input.page_size))\n  const qs = params.toString()\n  const res = await integration.fetch(`/pages/${encodeURIComponent(input.page_id)}/properties/${encodeURIComponent(input.property_id)}${qs ? `?${qs}` : ''}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "pages"
      },
      {
        "name": "list_block_children",
        "description": "List child blocks for a block (including page blocks).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "block_id"
          ],
          "properties": {
            "block_id": {
              "type": "string"
            },
            "start_cursor": {
              "type": "string"
            },
            "page_size": {
              "type": "number",
              "minimum": 1,
              "maximum": 100
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.start_cursor)\n    params.set('start_cursor', input.start_cursor)\n  if (input.page_size)\n    params.set('page_size', String(input.page_size))\n  const qs = params.toString()\n  const res = await integration.fetch(`/blocks/${encodeURIComponent(input.block_id)}/children${qs ? `?${qs}` : ''}`)\n  const data = await res.json()\n  const blocks = Array.isArray(data?.results)\n    ? data.results.map(block => ({\n      id: block?.id ?? null,\n      type: block?.type ?? null,\n      hasChildren: !!block?.has_children,\n      archived: !!block?.archived,\n      createdTime: block?.created_time ?? null,\n      lastEditedTime: block?.last_edited_time ?? null,\n    }))\n    : []\n  return {\n    block_id: input.block_id,\n    count: blocks.length,\n    has_more: !!data?.has_more,\n    next_cursor: data?.next_cursor ?? null,\n    note: 'Use id with retrieve_block for full block details.',\n    blocks,\n  }\n}",
        "scope": "read",
        "toolset": "pages"
      },
      {
        "name": "retrieve_block",
        "description": "Retrieve a block by ID.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "block_id"
          ],
          "properties": {
            "block_id": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/blocks/${encodeURIComponent(input.block_id)}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "pages"
      },
      {
        "name": "list_users",
        "description": "List users in the workspace.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "start_cursor": {
              "type": "string"
            },
            "page_size": {
              "type": "number",
              "minimum": 1,
              "maximum": 100
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.start_cursor)\n    params.set('start_cursor', input.start_cursor)\n  if (input.page_size)\n    params.set('page_size', String(input.page_size))\n  const qs = params.toString()\n  const res = await integration.fetch(`/users${qs ? `?${qs}` : ''}`)\n  const data = await res.json()\n  const users = Array.isArray(data?.results)\n    ? data.results.map(user => ({\n      id: user?.id ?? null,\n      type: user?.type ?? null,\n      name: user?.name ?? null,\n      avatar_url: user?.avatar_url ?? null,\n      person_email: user?.person?.email ?? null,\n    }))\n    : []\n  return {\n    count: users.length,\n    has_more: !!data?.has_more,\n    next_cursor: data?.next_cursor ?? null,\n    note: 'Use id with retrieve_user for full user details.',\n    users,\n  }\n}",
        "scope": "read",
        "toolset": "pages"
      },
      {
        "name": "retrieve_user",
        "description": "Retrieve a user by ID.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "user_id"
          ],
          "properties": {
            "user_id": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/users/${encodeURIComponent(input.user_id)}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "pages"
      },
      {
        "name": "list_comments",
        "description": "List comments for a given discussion or page block.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {
            "block_id": {
              "type": "string"
            },
            "discussion_id": {
              "type": "string"
            },
            "start_cursor": {
              "type": "string"
            },
            "page_size": {
              "type": "number",
              "minimum": 1,
              "maximum": 100
            }
          },
          "anyOf": [
            {
              "required": [
                "block_id"
              ]
            },
            {
              "required": [
                "discussion_id"
              ]
            }
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.block_id)\n    params.set('block_id', input.block_id)\n  if (input.discussion_id)\n    params.set('discussion_id', input.discussion_id)\n  if (input.start_cursor)\n    params.set('start_cursor', input.start_cursor)\n  if (input.page_size)\n    params.set('page_size', String(input.page_size))\n  const qs = params.toString()\n  const res = await integration.fetch(`/comments${qs ? `?${qs}` : ''}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "pages"
      },
      {
        "name": "get_me",
        "description": "Retrieve the authenticated user (bot) profile.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/users/me`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "pages"
      },
      {
        "name": "create_page",
        "description": "Create a new page in a database or as a child of a page.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "parent",
            "properties"
          ],
          "additionalProperties": false,
          "properties": {
            "parent": {
              "type": "object",
              "description": "Parent object specifying database_id or page_id.",
              "additionalProperties": false,
              "properties": {
                "database_id": {
                  "type": "string"
                },
                "page_id": {
                  "type": "string"
                },
                "type": {
                  "type": "string"
                }
              }
            },
            "properties": {
              "type": "object",
              "description": "Page properties map per Notion API."
            },
            "children": {
              "type": "array",
              "items": {
                "type": "object"
              }
            },
            "icon": {
              "type": [
                "object",
                "null"
              ]
            },
            "cover": {
              "type": [
                "object",
                "null"
              ]
            }
          }
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/pages`, {\n    method: 'POST',\n    body: {\n      parent: input.parent,\n      properties: input.properties,\n      children: input.children || undefined,\n      icon: input.icon || undefined,\n      cover: input.cover || undefined,\n    },\n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "pages"
      },
      {
        "name": "update_page_properties",
        "description": "Update page properties, archive/unarchive, icon and cover.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "page_id",
            "properties"
          ],
          "additionalProperties": false,
          "properties": {
            "page_id": {
              "type": "string"
            },
            "properties": {
              "type": "object"
            },
            "archived": {
              "type": [
                "boolean",
                "null"
              ]
            },
            "icon": {
              "type": [
                "object",
                "null"
              ]
            },
            "cover": {
              "type": [
                "object",
                "null"
              ]
            }
          }
        },
        "handlerCode": "async (input) => {\n  const body = {\n    properties: input.properties,\n    archived: input.archived === undefined ? undefined : input.archived,\n    icon: input.icon || undefined,\n    cover: input.cover || undefined,\n  }\n  const res = await integration.fetch(`/pages/${encodeURIComponent(input.page_id)}`, { method: 'PATCH', body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "pages"
      },
      {
        "name": "append_block_children",
        "description": "Append child blocks to a block (including page blocks).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "block_id",
            "children"
          ],
          "additionalProperties": false,
          "properties": {
            "block_id": {
              "type": "string"
            },
            "children": {
              "type": "array",
              "items": {
                "type": "object"
              }
            }
          }
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/blocks/${encodeURIComponent(input.block_id)}/children`, {\n    method: 'PATCH',\n    body: { children: input.children },\n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "pages"
      },
      {
        "name": "update_block",
        "description": "Update a block (content, archived state, etc).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "block_id",
            "body"
          ],
          "additionalProperties": false,
          "properties": {
            "block_id": {
              "type": "string"
            },
            "body": {
              "type": "object"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/blocks/${encodeURIComponent(input.block_id)}`, {\n    method: 'PATCH',\n    body: input.body || {},\n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "pages"
      },
      {
        "name": "delete_block",
        "description": "Archive a block (soft delete).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "block_id"
          ],
          "additionalProperties": false,
          "properties": {
            "block_id": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  // Notion 'delete' is archive block\n  const res = await integration.fetch(`/blocks/${encodeURIComponent(input.block_id)}`, {\n    method: 'PATCH',\n    body: { archived: true },\n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "pages"
      },
      {
        "name": "create_comment",
        "description": "Create a comment on a discussion or block.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "parent",
            "rich_text"
          ],
          "additionalProperties": false,
          "properties": {
            "parent": {
              "type": "object",
              "description": "Parent discussion_id or block_id.",
              "additionalProperties": false,
              "properties": {
                "discussion_id": {
                  "type": "string"
                },
                "block_id": {
                  "type": "string"
                }
              }
            },
            "rich_text": {
              "type": "array",
              "items": {
                "type": "object"
              }
            }
          }
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/comments`, {\n    method: 'POST',\n    body: {\n      parent: input.parent,\n      rich_text: input.rich_text,\n    },\n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "pages"
      },
      {
        "name": "retrieve_database",
        "description": "Retrieve a database by ID.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "database_id"
          ],
          "properties": {
            "database_id": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/databases/${encodeURIComponent(input.database_id)}`)\n  return await res.json()\n}",
        "scope": "read",
        "toolset": "databases"
      },
      {
        "name": "query_database",
        "description": "Query a database with optional filter, sorts, and pagination.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "database_id"
          ],
          "properties": {
            "database_id": {
              "type": "string"
            },
            "filter": {
              "type": [
                "object",
                "null"
              ]
            },
            "sorts": {
              "type": [
                "array",
                "null"
              ],
              "items": {
                "type": "object"
              }
            },
            "start_cursor": {
              "type": "string"
            },
            "page_size": {
              "type": "number",
              "minimum": 1,
              "maximum": 100
            }
          },
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const titleFromProperties = (properties) => {\n    if (!properties || typeof properties !== 'object')\n      return null\n    for (const value of Object.values(properties)) {\n      if (value?.type === 'title' && Array.isArray(value.title))\n        return value.title.map(x => x?.plain_text || '').join('').trim() || null\n    }\n    return null\n  }\n\n  const body = {\n    filter: input.filter || undefined,\n    sorts: input.sorts || undefined,\n    start_cursor: input.start_cursor || undefined,\n    page_size: input.page_size || undefined,\n  }\n  const res = await integration.fetch(`/databases/${encodeURIComponent(input.database_id)}/query`, { method: 'POST', body })\n  const data = await res.json()\n  const pages = Array.isArray(data?.results)\n    ? data.results.map(page => ({\n      id: page?.id ?? null,\n      url: page?.url ?? null,\n      createdTime: page?.created_time ?? null,\n      lastEditedTime: page?.last_edited_time ?? null,\n      title: titleFromProperties(page?.properties),\n    }))\n    : []\n  return {\n    database_id: input.database_id,\n    count: pages.length,\n    has_more: !!data?.has_more,\n    next_cursor: data?.next_cursor ?? null,\n    note: 'Use id with retrieve_page for full page details.',\n    pages,\n  }\n}",
        "scope": "read",
        "toolset": "databases"
      },
      {
        "name": "create_database",
        "description": "Create a new database under a page.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "parent",
            "title",
            "properties"
          ],
          "additionalProperties": false,
          "properties": {
            "parent": {
              "type": "object",
              "description": "Parent page where the database will be created.",
              "additionalProperties": false,
              "properties": {
                "page_id": {
                  "type": "string"
                }
              }
            },
            "title": {
              "type": "array",
              "items": {
                "type": "object"
              }
            },
            "properties": {
              "type": "object"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/databases`, {\n    method: 'POST',\n    body: {\n      parent: input.parent,\n      title: input.title,\n      properties: input.properties,\n    },\n  })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "databases"
      },
      {
        "name": "update_database",
        "description": "Update database title, description, properties, or archived state.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "database_id"
          ],
          "additionalProperties": false,
          "properties": {
            "database_id": {
              "type": "string"
            },
            "title": {
              "type": [
                "array",
                "null"
              ],
              "items": {
                "type": "object"
              }
            },
            "description": {
              "type": [
                "array",
                "null"
              ],
              "items": {
                "type": "object"
              }
            },
            "properties": {
              "type": [
                "object",
                "null"
              ]
            },
            "archived": {
              "type": [
                "boolean",
                "null"
              ]
            }
          }
        },
        "handlerCode": "async (input) => {\n  const body = {\n    title: input.title || undefined,\n    description: input.description || undefined,\n    properties: input.properties || undefined,\n    archived: input.archived === undefined ? undefined : input.archived,\n  }\n  const res = await integration.fetch(`/databases/${encodeURIComponent(input.database_id)}`, { method: 'PATCH', body })\n  return await res.json()\n}",
        "scope": "write",
        "toolset": "databases"
      }
    ]
  },
  "trello": {
    "manifest": {
      "name": "trello",
      "version": "0.1.0",
      "baseUrl": "https://api.trello.com/1",
      "tools": [
        {
          "name": "get_member",
          "description": "Fetch the current member profile.",
          "inputSchema": "schemas/get_member.json",
          "handler": "handlers/get_member.js",
          "scope": "read"
        },
        {
          "name": "get_member_boards",
          "description": "List boards for the current member.",
          "inputSchema": "schemas/empty.json",
          "handler": "handlers/get_member_boards.js",
          "scope": "read"
        },
        {
          "name": "get_member_organizations",
          "description": "List organizations (workspaces) for the current member.",
          "inputSchema": "schemas/empty.json",
          "handler": "handlers/get_member_organizations.js",
          "scope": "read"
        },
        {
          "name": "get_board",
          "description": "Fetch a board by id.",
          "inputSchema": "schemas/id_board.json",
          "handler": "handlers/get_board.js",
          "scope": "read"
        },
        {
          "name": "get_board_lists",
          "description": "List lists on a board.",
          "inputSchema": "schemas/id_board.json",
          "handler": "handlers/get_board_lists.js",
          "scope": "read"
        },
        {
          "name": "get_board_cards",
          "description": "List cards on a board.",
          "inputSchema": "schemas/id_board.json",
          "handler": "handlers/get_board_cards.js",
          "scope": "read"
        },
        {
          "name": "get_board_members",
          "description": "List members on a board.",
          "inputSchema": "schemas/id_board.json",
          "handler": "handlers/get_board_members.js",
          "scope": "read"
        },
        {
          "name": "get_board_labels",
          "description": "List labels on a board.",
          "inputSchema": "schemas/id_board.json",
          "handler": "handlers/get_board_labels.js",
          "scope": "read"
        },
        {
          "name": "get_board_custom_fields",
          "description": "List custom fields on a board.",
          "inputSchema": "schemas/id_board.json",
          "handler": "handlers/get_board_custom_fields.js",
          "scope": "read"
        },
        {
          "name": "get_board_memberships",
          "description": "List memberships for a board.",
          "inputSchema": "schemas/id_board.json",
          "handler": "handlers/get_board_memberships.js",
          "scope": "read"
        },
        {
          "name": "get_list",
          "description": "Fetch a list by id.",
          "inputSchema": "schemas/id_list.json",
          "handler": "handlers/get_list.js",
          "scope": "read"
        },
        {
          "name": "get_list_cards",
          "description": "List cards in a list.",
          "inputSchema": "schemas/id_list.json",
          "handler": "handlers/get_list_cards.js",
          "scope": "read"
        },
        {
          "name": "get_card",
          "description": "Fetch a card by id.",
          "inputSchema": "schemas/id_card.json",
          "handler": "handlers/get_card.js",
          "scope": "read"
        },
        {
          "name": "get_card_members",
          "description": "List members assigned to a card.",
          "inputSchema": "schemas/id_card.json",
          "handler": "handlers/get_card_members.js",
          "scope": "read"
        },
        {
          "name": "get_card_attachments",
          "description": "List attachments on a card.",
          "inputSchema": "schemas/id_card.json",
          "handler": "handlers/get_card_attachments.js",
          "scope": "read"
        },
        {
          "name": "get_card_actions",
          "description": "List actions (activity) on a card.",
          "inputSchema": "schemas/id_card.json",
          "handler": "handlers/get_card_actions.js",
          "scope": "read"
        },
        {
          "name": "get_card_checklists",
          "description": "List checklists on a card.",
          "inputSchema": "schemas/id_card.json",
          "handler": "handlers/get_card_checklists.js",
          "scope": "read"
        },
        {
          "name": "get_card_custom_field_items",
          "description": "Get custom field items on a card.",
          "inputSchema": "schemas/id_card.json",
          "handler": "handlers/get_card_custom_field_items.js",
          "scope": "read"
        },
        {
          "name": "get_organization",
          "description": "Fetch an organization (workspace) by id.",
          "inputSchema": "schemas/id_org.json",
          "handler": "handlers/get_organization.js",
          "scope": "read"
        },
        {
          "name": "get_organization_boards",
          "description": "List boards in an organization (workspace).",
          "inputSchema": "schemas/id_org.json",
          "handler": "handlers/get_organization_boards.js",
          "scope": "read"
        },
        {
          "name": "search",
          "description": "Search across boards, cards, and members.",
          "inputSchema": "schemas/search.json",
          "handler": "handlers/search.js",
          "scope": "read"
        },
        {
          "name": "create_board",
          "description": "Create a new board.",
          "inputSchema": "schemas/create_board.json",
          "handler": "handlers/create_board.js",
          "scope": "write"
        },
        {
          "name": "close_board",
          "description": "Close a board (set closed=true).",
          "inputSchema": "schemas/close_board.json",
          "handler": "handlers/close_board.js",
          "scope": "write"
        },
        {
          "name": "delete_board",
          "description": "Permanently delete a closed board.",
          "inputSchema": "schemas/delete_board.json",
          "handler": "handlers/delete_board.js",
          "scope": "write"
        },
        {
          "name": "create_card",
          "description": "Create a new card in a list.",
          "inputSchema": "schemas/create_card.json",
          "handler": "handlers/create_card.js",
          "scope": "write"
        },
        {
          "name": "update_card",
          "description": "Update a card's fields (name, desc, due, list, etc).",
          "inputSchema": "schemas/update_card.json",
          "handler": "handlers/update_card.js",
          "scope": "write"
        },
        {
          "name": "delete_card",
          "description": "Delete a card.",
          "inputSchema": "schemas/delete_card.json",
          "handler": "handlers/delete_card.js",
          "scope": "write"
        },
        {
          "name": "move_card_to_list",
          "description": "Move a card to another list.",
          "inputSchema": "schemas/move_card_to_list.json",
          "handler": "handlers/move_card_to_list.js",
          "scope": "write"
        },
        {
          "name": "add_member_to_card",
          "description": "Add a member to a card.",
          "inputSchema": "schemas/add_member_to_card.json",
          "handler": "handlers/add_member_to_card.js",
          "scope": "write"
        },
        {
          "name": "remove_member_from_card",
          "description": "Remove a member from a card.",
          "inputSchema": "schemas/remove_member_from_card.json",
          "handler": "handlers/remove_member_from_card.js",
          "scope": "write"
        },
        {
          "name": "add_checklist_to_card",
          "description": "Create a checklist on a card.",
          "inputSchema": "schemas/add_checklist_to_card.json",
          "handler": "handlers/add_checklist_to_card.js",
          "scope": "write"
        },
        {
          "name": "create_list",
          "description": "Create a new list on a board.",
          "inputSchema": "schemas/create_list.json",
          "handler": "handlers/create_list.js",
          "scope": "write"
        },
        {
          "name": "update_list",
          "description": "Update a list (name, pos, closed).",
          "inputSchema": "schemas/update_list.json",
          "handler": "handlers/update_list.js",
          "scope": "write"
        },
        {
          "name": "archive_list",
          "description": "Archive a list (set closed=true).",
          "inputSchema": "schemas/archive_list.json",
          "handler": "handlers/archive_list.js",
          "scope": "write"
        }
      ]
    },
    "prompt": null,
    "variants": {
      "variants": {
        "api_key_token": {
          "label": "API Key + Token",
          "schema": {
            "type": "object",
            "properties": {
              "apiKey": {
                "type": "string",
                "title": "API Key",
                "description": "Your Trello API key from https://trello.com/power-ups/admin"
              },
              "apiToken": {
                "type": "string",
                "title": "API Token",
                "description": "Your Trello API token (\"token\" param). Generate one via Trello's authorize flow."
              }
            },
            "required": [
              "apiKey",
              "apiToken"
            ],
            "additionalProperties": false
          },
          "injection": {
            "query": {
              "key": "{{apiKey}}",
              "token": "{{apiToken}}"
            }
          },
          "healthCheck": {
            "path": "/members/me"
          }
        }
      },
      "default": "api_key_token"
    },
    "hint": "1. Go to `https://trello.com/power-ups/admin`\n2. Create a new app\n3. Navigate to **API Key** and copy your API key\n4. Click **Generate a Token** and copy the token value",
    "hintsByVariant": {},
    "tools": [
      {
        "name": "get_member",
        "description": "Fetch the current member profile.",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/members/me`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_member_boards",
        "description": "List boards for the current member.",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const truncateDesc = (desc) => {\n    if (typeof desc !== 'string' || !desc.trim())\n      return null\n    const oneLine = desc.replace(/\\s+/g, ' ').trim()\n    const max = 200\n    return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max - 1)}…`\n  }\n\n  const fields = [\n    'id',\n    'name',\n    'desc',\n    'url',\n    'shortUrl',\n    'shortLink',\n    'dateLastActivity',\n    'idOrganization',\n    'closed',\n    'starred',\n  ].join(',')\n  const res = await integration.fetch(`/members/me/boards?fields=${encodeURIComponent(fields)}`)\n  const raw = await res.json()\n  if (!Array.isArray(raw))\n    return { count: 0, boards: [], note: 'Unexpected response from Trello; expected a list of boards.' }\n\n  const boards = raw.map((b) => ({\n    id: b.id,\n    name: b.name,\n    url: b.url || b.shortUrl || (b.shortLink ? `https://trello.com/b/${b.shortLink}` : undefined),\n    shortLink: b.shortLink,\n    closed: !!b.closed,\n    starred: !!b.starred,\n    workspaceId: b.idOrganization || null,\n    lastActivity: b.dateLastActivity || null,\n    descriptionPreview: truncateDesc(b.desc),\n  }))\n\n  boards.sort((a, b) => {\n    if (a.closed !== b.closed)\n      return a.closed ? 1 : -1\n    if (a.starred !== b.starred)\n      return a.starred ? -1 : 1\n    return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })\n  })\n\n  const open = boards.filter((x) => !x.closed).length\n  return {\n    count: boards.length,\n    openCount: open,\n    closedCount: boards.length - open,\n    note:\n      'Use `id` as `boardId` in other Trello tools (lists, cards, labels). `url` is the human-facing board link. Closed boards are archived.',\n    boards,\n  }\n}",
        "scope": "read"
      },
      {
        "name": "get_member_organizations",
        "description": "List organizations (workspaces) for the current member.",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const fields = ['id', 'name', 'displayName', 'desc', 'url'].join(',')\n  const res = await integration.fetch(`/members/me/organizations?fields=${encodeURIComponent(fields)}`)\n  const raw = await res.json()\n  const organizations = Array.isArray(raw)\n    ? raw.map(org => ({\n      id: org.id,\n      name: org.name || null,\n      displayName: org.displayName || null,\n      url: org.url || null,\n      descriptionPreview: typeof org.desc === 'string' && org.desc.trim()\n        ? (org.desc.trim().length <= 200 ? org.desc.trim() : `${org.desc.trim().slice(0, 199)}...`)\n        : null,\n    }))\n    : []\n  return {\n    count: organizations.length,\n    note: 'Use org id with get_organization for full organization details.',\n    organizations,\n  }\n}",
        "scope": "read"
      },
      {
        "name": "get_board",
        "description": "Fetch a board by id.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "boardId": {
              "type": "string"
            }
          },
          "required": [
            "boardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/boards/${input.boardId}`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_board_lists",
        "description": "List lists on a board.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "boardId": {
              "type": "string"
            }
          },
          "required": [
            "boardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const fields = ['id', 'name', 'idBoard', 'closed', 'pos', 'softLimit'].join(',')\n  const res = await integration.fetch(`/boards/${input.boardId}/lists?fields=${encodeURIComponent(fields)}`)\n  const raw = await res.json()\n  const lists = Array.isArray(raw)\n    ? raw.map(list => ({\n      id: list.id,\n      name: list.name,\n      idBoard: list.idBoard || null,\n      closed: !!list.closed,\n      position: list.pos ?? null,\n      softLimit: typeof list.softLimit === 'number' ? list.softLimit : null,\n    }))\n    : []\n  return {\n    boardId: input.boardId,\n    count: lists.length,\n    note: 'Use list id with get_list for full list details.',\n    lists,\n  }\n}",
        "scope": "read"
      },
      {
        "name": "get_board_cards",
        "description": "List cards on a board.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "boardId": {
              "type": "string"
            }
          },
          "required": [
            "boardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const fields = [\n    'id',\n    'name',\n    'desc',\n    'idBoard',\n    'idList',\n    'shortLink',\n    'shortUrl',\n    'url',\n    'closed',\n    'due',\n    'dateLastActivity',\n    'labels',\n    'pos',\n  ].join(',')\n  const res = await integration.fetch(`/boards/${input.boardId}/cards?fields=${encodeURIComponent(fields)}`)\n  const raw = await res.json()\n  const cards = Array.isArray(raw)\n    ? raw.map(card => ({\n      id: card.id,\n      name: card.name,\n      idBoard: card.idBoard || null,\n      idList: card.idList || null,\n      url: card.url || card.shortUrl || (card.shortLink ? `https://trello.com/c/${card.shortLink}` : null),\n      shortLink: card.shortLink || null,\n      closed: !!card.closed,\n      due: card.due || null,\n      lastActivity: card.dateLastActivity || null,\n      position: card.pos ?? null,\n      labels: Array.isArray(card.labels)\n        ? card.labels.map(label => ({ id: label.id, name: label.name || null, color: label.color || null }))\n        : [],\n      descriptionPreview: typeof card.desc === 'string' && card.desc.trim()\n        ? (card.desc.trim().length <= 200 ? card.desc.trim() : `${card.desc.trim().slice(0, 199)}...`)\n        : null,\n    }))\n    : []\n  return {\n    boardId: input.boardId,\n    count: cards.length,\n    note: 'Use card id with get_card for full card details.',\n    cards,\n  }\n}",
        "scope": "read"
      },
      {
        "name": "get_board_members",
        "description": "List members on a board.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "boardId": {
              "type": "string"
            }
          },
          "required": [
            "boardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/boards/${input.boardId}/members`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_board_labels",
        "description": "List labels on a board.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "boardId": {
              "type": "string"
            }
          },
          "required": [
            "boardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/boards/${input.boardId}/labels`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_board_custom_fields",
        "description": "List custom fields on a board.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "boardId": {
              "type": "string"
            }
          },
          "required": [
            "boardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/boards/${input.boardId}/customFields`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_board_memberships",
        "description": "List memberships for a board.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "boardId": {
              "type": "string"
            }
          },
          "required": [
            "boardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/boards/${input.boardId}/memberships`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_list",
        "description": "Fetch a list by id.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "listId": {
              "type": "string"
            }
          },
          "required": [
            "listId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/lists/${input.listId}`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_list_cards",
        "description": "List cards in a list.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "listId": {
              "type": "string"
            }
          },
          "required": [
            "listId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const fields = [\n    'id',\n    'name',\n    'desc',\n    'idBoard',\n    'idList',\n    'shortLink',\n    'shortUrl',\n    'url',\n    'closed',\n    'due',\n    'dateLastActivity',\n    'labels',\n    'pos',\n  ].join(',')\n  const res = await integration.fetch(`/lists/${input.listId}/cards?fields=${encodeURIComponent(fields)}`)\n  const raw = await res.json()\n  const cards = Array.isArray(raw)\n    ? raw.map(card => ({\n      id: card.id,\n      name: card.name,\n      idBoard: card.idBoard || null,\n      idList: card.idList || null,\n      url: card.url || card.shortUrl || (card.shortLink ? `https://trello.com/c/${card.shortLink}` : null),\n      shortLink: card.shortLink || null,\n      closed: !!card.closed,\n      due: card.due || null,\n      lastActivity: card.dateLastActivity || null,\n      position: card.pos ?? null,\n      labels: Array.isArray(card.labels)\n        ? card.labels.map(label => ({ id: label.id, name: label.name || null, color: label.color || null }))\n        : [],\n      descriptionPreview: typeof card.desc === 'string' && card.desc.trim()\n        ? (card.desc.trim().length <= 200 ? card.desc.trim() : `${card.desc.trim().slice(0, 199)}...`)\n        : null,\n    }))\n    : []\n  return {\n    listId: input.listId,\n    count: cards.length,\n    note: 'Use card id with get_card for full card details.',\n    cards,\n  }\n}",
        "scope": "read"
      },
      {
        "name": "get_card",
        "description": "Fetch a card by id.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "cardId": {
              "type": "string"
            }
          },
          "required": [
            "cardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${input.cardId}`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_card_members",
        "description": "List members assigned to a card.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "cardId": {
              "type": "string"
            }
          },
          "required": [
            "cardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${input.cardId}/members`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_card_attachments",
        "description": "List attachments on a card.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "cardId": {
              "type": "string"
            }
          },
          "required": [
            "cardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${input.cardId}/attachments`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_card_actions",
        "description": "List actions (activity) on a card.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "cardId": {
              "type": "string"
            }
          },
          "required": [
            "cardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${input.cardId}/actions`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_card_checklists",
        "description": "List checklists on a card.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "cardId": {
              "type": "string"
            }
          },
          "required": [
            "cardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${input.cardId}/checklists`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_card_custom_field_items",
        "description": "Get custom field items on a card.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "cardId": {
              "type": "string"
            }
          },
          "required": [
            "cardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${input.cardId}/customFieldItems`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_organization",
        "description": "Fetch an organization (workspace) by id.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "orgId": {
              "type": "string"
            }
          },
          "required": [
            "orgId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/organizations/${input.orgId}`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_organization_boards",
        "description": "List boards in an organization (workspace).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "orgId": {
              "type": "string"
            }
          },
          "required": [
            "orgId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const fields = [\n    'id',\n    'name',\n    'desc',\n    'url',\n    'shortUrl',\n    'shortLink',\n    'dateLastActivity',\n    'idOrganization',\n    'closed',\n    'starred',\n  ].join(',')\n  const res = await integration.fetch(`/organizations/${input.orgId}/boards?fields=${encodeURIComponent(fields)}`)\n  const raw = await res.json()\n  const boards = Array.isArray(raw)\n    ? raw.map(b => ({\n      id: b.id,\n      name: b.name,\n      url: b.url || b.shortUrl || (b.shortLink ? `https://trello.com/b/${b.shortLink}` : null),\n      shortLink: b.shortLink || null,\n      closed: !!b.closed,\n      starred: !!b.starred,\n      workspaceId: b.idOrganization || null,\n      lastActivity: b.dateLastActivity || null,\n      descriptionPreview: typeof b.desc === 'string' && b.desc.trim()\n        ? (b.desc.trim().length <= 200 ? b.desc.trim() : `${b.desc.trim().slice(0, 199)}...`)\n        : null,\n    }))\n    : []\n  return {\n    orgId: input.orgId,\n    count: boards.length,\n    note: 'Use board id with get_board for full board details.',\n    boards,\n  }\n}",
        "scope": "read"
      },
      {
        "name": "search",
        "description": "Search across boards, cards, and members.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string"
            }
          },
          "required": [
            "query"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams({ query: input.query })\n  const res = await integration.fetch(`/search?${params.toString()}`)\n  const data = await res.json()\n\n  const boards = Array.isArray(data?.boards)\n    ? data.boards.map(board => ({\n      id: board.id,\n      name: board.name,\n      shortLink: board.shortLink || null,\n      url: board.url || (board.shortLink ? `https://trello.com/b/${board.shortLink}` : null),\n      closed: !!board.closed,\n    }))\n    : []\n\n  const cards = Array.isArray(data?.cards)\n    ? data.cards.map(card => ({\n      id: card.id,\n      name: card.name,\n      idBoard: card.idBoard || null,\n      idList: card.idList || null,\n      shortLink: card.shortLink || null,\n      url: card.url || card.shortUrl || (card.shortLink ? `https://trello.com/c/${card.shortLink}` : null),\n      closed: !!card.closed,\n    }))\n    : []\n\n  return {\n    query: input.query,\n    count: boards.length + cards.length,\n    boardCount: boards.length,\n    cardCount: cards.length,\n    note: 'Use get_board with board id or get_card with card id for full details.',\n    boards,\n    cards,\n  }\n}",
        "scope": "read"
      },
      {
        "name": "create_board",
        "description": "Create a new board.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "name"
          ],
          "additionalProperties": false,
          "properties": {
            "name": {
              "type": "string"
            },
            "defaultLists": {
              "type": "boolean",
              "description": "Create the default lists on the board (default: true)"
            },
            "desc": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  params.set('name', input.name)\n  if (input.defaultLists !== undefined && input.defaultLists !== null)\n    params.set('defaultLists', String(Boolean(input.defaultLists)))\n  if (input.desc !== undefined && input.desc !== null)\n    params.set('desc', String(input.desc))\n  const res = await integration.fetch(`/boards?${params.toString()}`, { method: 'POST' })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "close_board",
        "description": "Close a board (set closed=true).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "boardId"
          ],
          "additionalProperties": false,
          "properties": {
            "boardId": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams({ closed: 'true' })\n  const res = await integration.fetch(`/boards/${encodeURIComponent(input.boardId)}?${params.toString()}`, { method: 'PUT' })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "delete_board",
        "description": "Permanently delete a closed board.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "boardId"
          ],
          "additionalProperties": false,
          "properties": {
            "boardId": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/boards/${encodeURIComponent(input.boardId)}`, { method: 'DELETE' })\n  if (res.status === 204)\n    return { success: true, status: 204 }\n  // Trello sometimes returns JSON on delete failures.\n  try {\n    return await res.json()\n  }\n  catch {\n    return { success: res.ok, status: res.status }\n  }\n}",
        "scope": "write"
      },
      {
        "name": "create_card",
        "description": "Create a new card in a list.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "idList",
            "name"
          ],
          "additionalProperties": false,
          "properties": {
            "idList": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "desc": {
              "type": "string"
            },
            "due": {
              "type": [
                "string",
                "null"
              ],
              "description": "ISO 8601 due date"
            },
            "pos": {
              "type": [
                "string",
                "number"
              ],
              "description": "Position (top,bottom or float)"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  params.set('idList', input.idList)\n  params.set('name', input.name)\n  if (input.desc !== undefined)\n    params.set('desc', input.desc)\n  if (input.due !== undefined && input.due !== null)\n    params.set('due', input.due)\n  if (input.pos !== undefined && input.pos !== null)\n    params.set('pos', String(input.pos))\n  const res = await integration.fetch(`/cards?${params.toString()}`, { method: 'POST' })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "update_card",
        "description": "Update a card's fields (name, desc, due, list, etc).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "cardId"
          ],
          "additionalProperties": false,
          "properties": {
            "cardId": {
              "type": "string"
            },
            "name": {
              "type": [
                "string",
                "null"
              ]
            },
            "desc": {
              "type": [
                "string",
                "null"
              ]
            },
            "due": {
              "type": [
                "string",
                "null"
              ]
            },
            "dueComplete": {
              "type": [
                "boolean",
                "null"
              ]
            },
            "closed": {
              "type": [
                "boolean",
                "null"
              ]
            },
            "idList": {
              "type": [
                "string",
                "null"
              ]
            },
            "pos": {
              "type": [
                "string",
                "number",
                "null"
              ]
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.name !== undefined && input.name !== null)\n    params.set('name', input.name)\n  if (input.desc !== undefined && input.desc !== null)\n    params.set('desc', input.desc)\n  if (input.due !== undefined)\n    params.set('due', input.due === null ? '' : input.due)\n  if (input.dueComplete !== undefined && input.dueComplete !== null)\n    params.set('dueComplete', String(input.dueComplete))\n  if (input.closed !== undefined && input.closed !== null)\n    params.set('closed', String(input.closed))\n  if (input.idList !== undefined && input.idList !== null)\n    params.set('idList', input.idList)\n  if (input.pos !== undefined && input.pos !== null)\n    params.set('pos', String(input.pos))\n  const res = await integration.fetch(`/cards/${encodeURIComponent(input.cardId)}?${params.toString()}`, { method: 'PUT' })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "delete_card",
        "description": "Delete a card.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "cardId"
          ],
          "additionalProperties": false,
          "properties": {
            "cardId": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${encodeURIComponent(input.cardId)}`, { method: 'DELETE' })\n  try {\n    return await res.json()\n  }\n  catch {\n    return ''\n  }\n}",
        "scope": "write"
      },
      {
        "name": "move_card_to_list",
        "description": "Move a card to another list.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "cardId",
            "listId"
          ],
          "additionalProperties": false,
          "properties": {
            "cardId": {
              "type": "string"
            },
            "listId": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams({ value: input.listId })\n  const res = await integration.fetch(`/cards/${encodeURIComponent(input.cardId)}/idList?${params.toString()}`, { method: 'PUT' })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "add_member_to_card",
        "description": "Add a member to a card.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "cardId",
            "memberId"
          ],
          "additionalProperties": false,
          "properties": {
            "cardId": {
              "type": "string"
            },
            "memberId": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams({ value: input.memberId })\n  const res = await integration.fetch(`/cards/${encodeURIComponent(input.cardId)}/idMembers?${params.toString()}`, { method: 'POST' })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "remove_member_from_card",
        "description": "Remove a member from a card.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "cardId",
            "memberId"
          ],
          "additionalProperties": false,
          "properties": {
            "cardId": {
              "type": "string"
            },
            "memberId": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${encodeURIComponent(input.cardId)}/idMembers/${encodeURIComponent(input.memberId)}`, { method: 'DELETE' })\n  try {\n    return await res.json()\n  }\n  catch {\n    return ''\n  }\n}",
        "scope": "write"
      },
      {
        "name": "add_checklist_to_card",
        "description": "Create a checklist on a card.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "cardId",
            "name"
          ],
          "additionalProperties": false,
          "properties": {
            "cardId": {
              "type": "string"
            },
            "name": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams({ idCard: input.cardId, name: input.name })\n  const res = await integration.fetch(`/checklists?${params.toString()}`, { method: 'POST' })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "create_list",
        "description": "Create a new list on a board.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "idBoard",
            "name"
          ],
          "additionalProperties": false,
          "properties": {
            "idBoard": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "pos": {
              "type": [
                "string",
                "number"
              ],
              "description": "Position (top,bottom or float)"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams({ idBoard: input.idBoard, name: input.name })\n  if (input.pos !== undefined && input.pos !== null)\n    params.set('pos', String(input.pos))\n  const res = await integration.fetch(`/lists?${params.toString()}`, { method: 'POST' })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "update_list",
        "description": "Update a list (name, pos, closed).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "listId"
          ],
          "additionalProperties": false,
          "properties": {
            "listId": {
              "type": "string"
            },
            "name": {
              "type": [
                "string",
                "null"
              ]
            },
            "closed": {
              "type": [
                "boolean",
                "null"
              ]
            },
            "pos": {
              "type": [
                "string",
                "number",
                "null"
              ]
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.name !== undefined && input.name !== null)\n    params.set('name', input.name)\n  if (input.closed !== undefined && input.closed !== null)\n    params.set('closed', String(input.closed))\n  if (input.pos !== undefined && input.pos !== null)\n    params.set('pos', String(input.pos))\n  const res = await integration.fetch(`/lists/${encodeURIComponent(input.listId)}?${params.toString()}`, { method: 'PUT' })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "archive_list",
        "description": "Archive a list (set closed=true).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "listId"
          ],
          "additionalProperties": false,
          "properties": {
            "listId": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams({ value: 'true' })\n  const res = await integration.fetch(`/lists/${encodeURIComponent(input.listId)}/closed?${params.toString()}`, { method: 'PUT' })\n  return await res.json()\n}",
        "scope": "write"
      }
    ]
  },
  "trello-board": {
    "manifest": {
      "name": "Trello",
      "parent": "trello",
      "variantLabel": "Single board",
      "version": "0.1.0",
      "baseUrl": "https://api.trello.com/1",
      "connectionConfig": {
        "schema": {
          "type": "object",
          "properties": {
            "boardId": {
              "type": "string"
            },
            "boardName": {
              "type": "string"
            }
          },
          "required": [
            "boardId"
          ],
          "additionalProperties": false
        }
      },
      "tools": [
        {
          "name": "get_board",
          "description": "Fetch the connected board.",
          "inputSchema": "../../schemas/empty.json",
          "handler": "../../handlers/get_board.js",
          "injectFromConfig": {
            "boardId": "boardId"
          },
          "scope": "read"
        },
        {
          "name": "get_lists",
          "description": "List lists on the connected board.",
          "inputSchema": "../../schemas/empty.json",
          "handler": "../../handlers/get_board_lists.js",
          "injectFromConfig": {
            "boardId": "boardId"
          },
          "scope": "read"
        },
        {
          "name": "get_cards",
          "description": "List cards on the connected board.",
          "inputSchema": "../../schemas/empty.json",
          "handler": "../../handlers/get_board_cards.js",
          "injectFromConfig": {
            "boardId": "boardId"
          },
          "scope": "read"
        },
        {
          "name": "get_members",
          "description": "List members on the connected board.",
          "inputSchema": "../../schemas/empty.json",
          "handler": "../../handlers/get_board_members.js",
          "injectFromConfig": {
            "boardId": "boardId"
          },
          "scope": "read"
        },
        {
          "name": "get_labels",
          "description": "List labels on the connected board.",
          "inputSchema": "../../schemas/empty.json",
          "handler": "../../handlers/get_board_labels.js",
          "injectFromConfig": {
            "boardId": "boardId"
          },
          "scope": "read"
        },
        {
          "name": "get_custom_fields",
          "description": "List custom fields on the connected board.",
          "inputSchema": "../../schemas/empty.json",
          "handler": "../../handlers/get_board_custom_fields.js",
          "injectFromConfig": {
            "boardId": "boardId"
          },
          "scope": "read"
        },
        {
          "name": "get_memberships",
          "description": "List memberships for the connected board.",
          "inputSchema": "../../schemas/empty.json",
          "handler": "../../handlers/get_board_memberships.js",
          "injectFromConfig": {
            "boardId": "boardId"
          },
          "scope": "read"
        },
        {
          "name": "get_list",
          "description": "Fetch a list by id.",
          "inputSchema": "../../schemas/id_list.json",
          "handler": "../../handlers/get_list.js",
          "scope": "read"
        },
        {
          "name": "get_list_cards",
          "description": "List cards in a list.",
          "inputSchema": "../../schemas/id_list.json",
          "handler": "../../handlers/get_list_cards.js",
          "scope": "read"
        },
        {
          "name": "get_card",
          "description": "Fetch a card by id.",
          "inputSchema": "../../schemas/id_card.json",
          "handler": "../../handlers/get_card.js",
          "scope": "read"
        },
        {
          "name": "get_card_members",
          "description": "List members assigned to a card.",
          "inputSchema": "../../schemas/id_card.json",
          "handler": "../../handlers/get_card_members.js",
          "scope": "read"
        },
        {
          "name": "get_card_attachments",
          "description": "List attachments on a card.",
          "inputSchema": "../../schemas/id_card.json",
          "handler": "../../handlers/get_card_attachments.js",
          "scope": "read"
        },
        {
          "name": "get_card_actions",
          "description": "List actions (activity) on a card.",
          "inputSchema": "../../schemas/id_card.json",
          "handler": "../../handlers/get_card_actions.js",
          "scope": "read"
        },
        {
          "name": "get_card_checklists",
          "description": "List checklists on a card.",
          "inputSchema": "../../schemas/id_card.json",
          "handler": "../../handlers/get_card_checklists.js",
          "scope": "read"
        },
        {
          "name": "get_card_custom_field_items",
          "description": "Get custom field items on a card.",
          "inputSchema": "../../schemas/id_card.json",
          "handler": "../../handlers/get_card_custom_field_items.js",
          "scope": "read"
        },
        {
          "name": "create_card",
          "description": "Create a new card in a list.",
          "inputSchema": "../../schemas/create_card.json",
          "handler": "../../handlers/create_card.js",
          "scope": "write"
        },
        {
          "name": "update_card",
          "description": "Update a card's fields (name, desc, due, list, etc).",
          "inputSchema": "../../schemas/update_card.json",
          "handler": "../../handlers/update_card.js",
          "scope": "write"
        },
        {
          "name": "delete_card",
          "description": "Delete a card.",
          "inputSchema": "../../schemas/delete_card.json",
          "handler": "../../handlers/delete_card.js",
          "scope": "write"
        },
        {
          "name": "move_card_to_list",
          "description": "Move a card to another list.",
          "inputSchema": "../../schemas/move_card_to_list.json",
          "handler": "../../handlers/move_card_to_list.js",
          "scope": "write"
        },
        {
          "name": "add_member_to_card",
          "description": "Add a member to a card.",
          "inputSchema": "../../schemas/add_member_to_card.json",
          "handler": "../../handlers/add_member_to_card.js",
          "scope": "write"
        },
        {
          "name": "remove_member_from_card",
          "description": "Remove a member from a card.",
          "inputSchema": "../../schemas/remove_member_from_card.json",
          "handler": "../../handlers/remove_member_from_card.js",
          "scope": "write"
        },
        {
          "name": "add_checklist_to_card",
          "description": "Create a checklist on a card.",
          "inputSchema": "../../schemas/add_checklist_to_card.json",
          "handler": "../../handlers/add_checklist_to_card.js",
          "scope": "write"
        },
        {
          "name": "create_list",
          "description": "Create a new list on the connected board.",
          "inputSchema": "schemas/create_list.json",
          "handler": "../../handlers/create_list.js",
          "injectFromConfig": {
            "idBoard": "boardId"
          },
          "scope": "write"
        },
        {
          "name": "update_list",
          "description": "Update a list (name, pos, closed).",
          "inputSchema": "../../schemas/update_list.json",
          "handler": "../../handlers/update_list.js",
          "scope": "write"
        },
        {
          "name": "archive_list",
          "description": "Archive a list (set closed=true).",
          "inputSchema": "../../schemas/archive_list.json",
          "handler": "../../handlers/archive_list.js",
          "scope": "write"
        }
      ]
    },
    "prompt": null,
    "variants": {
      "variants": {
        "api_key_token": {
          "label": "API Key + Token",
          "schema": {
            "type": "object",
            "properties": {
              "apiKey": {
                "type": "string",
                "title": "API Key",
                "description": "Your Trello API key from https://trello.com/power-ups/admin"
              },
              "apiToken": {
                "type": "string",
                "title": "API Token",
                "description": "Your Trello API token (\"token\" param). Generate one via Trello's authorize flow."
              }
            },
            "required": [
              "apiKey",
              "apiToken"
            ],
            "additionalProperties": false
          },
          "injection": {
            "query": {
              "key": "{{apiKey}}",
              "token": "{{apiToken}}"
            }
          },
          "healthCheck": {
            "path": "/members/me"
          }
        }
      },
      "default": "api_key_token"
    },
    "hint": "1. Go to `https://trello.com/power-ups/admin`\n2. Create a new app\n3. Navigate to **API Key** and copy your API key\n4. Click **Generate a Token** and copy the token value",
    "hintsByVariant": {},
    "tools": [
      {
        "name": "get_board",
        "description": "Fetch the connected board.",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/boards/${input.boardId}`)\n  return await res.json()\n}",
        "scope": "read",
        "injectFromConfig": {
          "boardId": "boardId"
        }
      },
      {
        "name": "get_lists",
        "description": "List lists on the connected board.",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const fields = ['id', 'name', 'idBoard', 'closed', 'pos', 'softLimit'].join(',')\n  const res = await integration.fetch(`/boards/${input.boardId}/lists?fields=${encodeURIComponent(fields)}`)\n  const raw = await res.json()\n  const lists = Array.isArray(raw)\n    ? raw.map(list => ({\n      id: list.id,\n      name: list.name,\n      idBoard: list.idBoard || null,\n      closed: !!list.closed,\n      position: list.pos ?? null,\n      softLimit: typeof list.softLimit === 'number' ? list.softLimit : null,\n    }))\n    : []\n  return {\n    boardId: input.boardId,\n    count: lists.length,\n    note: 'Use list id with get_list for full list details.',\n    lists,\n  }\n}",
        "scope": "read",
        "injectFromConfig": {
          "boardId": "boardId"
        }
      },
      {
        "name": "get_cards",
        "description": "List cards on the connected board.",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const fields = [\n    'id',\n    'name',\n    'desc',\n    'idBoard',\n    'idList',\n    'shortLink',\n    'shortUrl',\n    'url',\n    'closed',\n    'due',\n    'dateLastActivity',\n    'labels',\n    'pos',\n  ].join(',')\n  const res = await integration.fetch(`/boards/${input.boardId}/cards?fields=${encodeURIComponent(fields)}`)\n  const raw = await res.json()\n  const cards = Array.isArray(raw)\n    ? raw.map(card => ({\n      id: card.id,\n      name: card.name,\n      idBoard: card.idBoard || null,\n      idList: card.idList || null,\n      url: card.url || card.shortUrl || (card.shortLink ? `https://trello.com/c/${card.shortLink}` : null),\n      shortLink: card.shortLink || null,\n      closed: !!card.closed,\n      due: card.due || null,\n      lastActivity: card.dateLastActivity || null,\n      position: card.pos ?? null,\n      labels: Array.isArray(card.labels)\n        ? card.labels.map(label => ({ id: label.id, name: label.name || null, color: label.color || null }))\n        : [],\n      descriptionPreview: typeof card.desc === 'string' && card.desc.trim()\n        ? (card.desc.trim().length <= 200 ? card.desc.trim() : `${card.desc.trim().slice(0, 199)}...`)\n        : null,\n    }))\n    : []\n  return {\n    boardId: input.boardId,\n    count: cards.length,\n    note: 'Use card id with get_card for full card details.',\n    cards,\n  }\n}",
        "scope": "read",
        "injectFromConfig": {
          "boardId": "boardId"
        }
      },
      {
        "name": "get_members",
        "description": "List members on the connected board.",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/boards/${input.boardId}/members`)\n  return await res.json()\n}",
        "scope": "read",
        "injectFromConfig": {
          "boardId": "boardId"
        }
      },
      {
        "name": "get_labels",
        "description": "List labels on the connected board.",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/boards/${input.boardId}/labels`)\n  return await res.json()\n}",
        "scope": "read",
        "injectFromConfig": {
          "boardId": "boardId"
        }
      },
      {
        "name": "get_custom_fields",
        "description": "List custom fields on the connected board.",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/boards/${input.boardId}/customFields`)\n  return await res.json()\n}",
        "scope": "read",
        "injectFromConfig": {
          "boardId": "boardId"
        }
      },
      {
        "name": "get_memberships",
        "description": "List memberships for the connected board.",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/boards/${input.boardId}/memberships`)\n  return await res.json()\n}",
        "scope": "read",
        "injectFromConfig": {
          "boardId": "boardId"
        }
      },
      {
        "name": "get_list",
        "description": "Fetch a list by id.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "listId": {
              "type": "string"
            }
          },
          "required": [
            "listId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/lists/${input.listId}`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_list_cards",
        "description": "List cards in a list.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "listId": {
              "type": "string"
            }
          },
          "required": [
            "listId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const fields = [\n    'id',\n    'name',\n    'desc',\n    'idBoard',\n    'idList',\n    'shortLink',\n    'shortUrl',\n    'url',\n    'closed',\n    'due',\n    'dateLastActivity',\n    'labels',\n    'pos',\n  ].join(',')\n  const res = await integration.fetch(`/lists/${input.listId}/cards?fields=${encodeURIComponent(fields)}`)\n  const raw = await res.json()\n  const cards = Array.isArray(raw)\n    ? raw.map(card => ({\n      id: card.id,\n      name: card.name,\n      idBoard: card.idBoard || null,\n      idList: card.idList || null,\n      url: card.url || card.shortUrl || (card.shortLink ? `https://trello.com/c/${card.shortLink}` : null),\n      shortLink: card.shortLink || null,\n      closed: !!card.closed,\n      due: card.due || null,\n      lastActivity: card.dateLastActivity || null,\n      position: card.pos ?? null,\n      labels: Array.isArray(card.labels)\n        ? card.labels.map(label => ({ id: label.id, name: label.name || null, color: label.color || null }))\n        : [],\n      descriptionPreview: typeof card.desc === 'string' && card.desc.trim()\n        ? (card.desc.trim().length <= 200 ? card.desc.trim() : `${card.desc.trim().slice(0, 199)}...`)\n        : null,\n    }))\n    : []\n  return {\n    listId: input.listId,\n    count: cards.length,\n    note: 'Use card id with get_card for full card details.',\n    cards,\n  }\n}",
        "scope": "read"
      },
      {
        "name": "get_card",
        "description": "Fetch a card by id.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "cardId": {
              "type": "string"
            }
          },
          "required": [
            "cardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${input.cardId}`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_card_members",
        "description": "List members assigned to a card.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "cardId": {
              "type": "string"
            }
          },
          "required": [
            "cardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${input.cardId}/members`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_card_attachments",
        "description": "List attachments on a card.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "cardId": {
              "type": "string"
            }
          },
          "required": [
            "cardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${input.cardId}/attachments`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_card_actions",
        "description": "List actions (activity) on a card.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "cardId": {
              "type": "string"
            }
          },
          "required": [
            "cardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${input.cardId}/actions`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_card_checklists",
        "description": "List checklists on a card.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "cardId": {
              "type": "string"
            }
          },
          "required": [
            "cardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${input.cardId}/checklists`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "get_card_custom_field_items",
        "description": "Get custom field items on a card.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "cardId": {
              "type": "string"
            }
          },
          "required": [
            "cardId"
          ],
          "additionalProperties": false
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${input.cardId}/customFieldItems`)\n  return await res.json()\n}",
        "scope": "read"
      },
      {
        "name": "create_card",
        "description": "Create a new card in a list.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "idList",
            "name"
          ],
          "additionalProperties": false,
          "properties": {
            "idList": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "desc": {
              "type": "string"
            },
            "due": {
              "type": [
                "string",
                "null"
              ],
              "description": "ISO 8601 due date"
            },
            "pos": {
              "type": [
                "string",
                "number"
              ],
              "description": "Position (top,bottom or float)"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  params.set('idList', input.idList)\n  params.set('name', input.name)\n  if (input.desc !== undefined)\n    params.set('desc', input.desc)\n  if (input.due !== undefined && input.due !== null)\n    params.set('due', input.due)\n  if (input.pos !== undefined && input.pos !== null)\n    params.set('pos', String(input.pos))\n  const res = await integration.fetch(`/cards?${params.toString()}`, { method: 'POST' })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "update_card",
        "description": "Update a card's fields (name, desc, due, list, etc).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "cardId"
          ],
          "additionalProperties": false,
          "properties": {
            "cardId": {
              "type": "string"
            },
            "name": {
              "type": [
                "string",
                "null"
              ]
            },
            "desc": {
              "type": [
                "string",
                "null"
              ]
            },
            "due": {
              "type": [
                "string",
                "null"
              ]
            },
            "dueComplete": {
              "type": [
                "boolean",
                "null"
              ]
            },
            "closed": {
              "type": [
                "boolean",
                "null"
              ]
            },
            "idList": {
              "type": [
                "string",
                "null"
              ]
            },
            "pos": {
              "type": [
                "string",
                "number",
                "null"
              ]
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.name !== undefined && input.name !== null)\n    params.set('name', input.name)\n  if (input.desc !== undefined && input.desc !== null)\n    params.set('desc', input.desc)\n  if (input.due !== undefined)\n    params.set('due', input.due === null ? '' : input.due)\n  if (input.dueComplete !== undefined && input.dueComplete !== null)\n    params.set('dueComplete', String(input.dueComplete))\n  if (input.closed !== undefined && input.closed !== null)\n    params.set('closed', String(input.closed))\n  if (input.idList !== undefined && input.idList !== null)\n    params.set('idList', input.idList)\n  if (input.pos !== undefined && input.pos !== null)\n    params.set('pos', String(input.pos))\n  const res = await integration.fetch(`/cards/${encodeURIComponent(input.cardId)}?${params.toString()}`, { method: 'PUT' })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "delete_card",
        "description": "Delete a card.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "cardId"
          ],
          "additionalProperties": false,
          "properties": {
            "cardId": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${encodeURIComponent(input.cardId)}`, { method: 'DELETE' })\n  try {\n    return await res.json()\n  }\n  catch {\n    return ''\n  }\n}",
        "scope": "write"
      },
      {
        "name": "move_card_to_list",
        "description": "Move a card to another list.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "cardId",
            "listId"
          ],
          "additionalProperties": false,
          "properties": {
            "cardId": {
              "type": "string"
            },
            "listId": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams({ value: input.listId })\n  const res = await integration.fetch(`/cards/${encodeURIComponent(input.cardId)}/idList?${params.toString()}`, { method: 'PUT' })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "add_member_to_card",
        "description": "Add a member to a card.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "cardId",
            "memberId"
          ],
          "additionalProperties": false,
          "properties": {
            "cardId": {
              "type": "string"
            },
            "memberId": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams({ value: input.memberId })\n  const res = await integration.fetch(`/cards/${encodeURIComponent(input.cardId)}/idMembers?${params.toString()}`, { method: 'POST' })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "remove_member_from_card",
        "description": "Remove a member from a card.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "cardId",
            "memberId"
          ],
          "additionalProperties": false,
          "properties": {
            "cardId": {
              "type": "string"
            },
            "memberId": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const res = await integration.fetch(`/cards/${encodeURIComponent(input.cardId)}/idMembers/${encodeURIComponent(input.memberId)}`, { method: 'DELETE' })\n  try {\n    return await res.json()\n  }\n  catch {\n    return ''\n  }\n}",
        "scope": "write"
      },
      {
        "name": "add_checklist_to_card",
        "description": "Create a checklist on a card.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "cardId",
            "name"
          ],
          "additionalProperties": false,
          "properties": {
            "cardId": {
              "type": "string"
            },
            "name": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams({ idCard: input.cardId, name: input.name })\n  const res = await integration.fetch(`/checklists?${params.toString()}`, { method: 'POST' })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "create_list",
        "description": "Create a new list on the connected board.",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "name"
          ],
          "additionalProperties": false,
          "properties": {
            "name": {
              "type": "string"
            },
            "pos": {
              "type": [
                "string",
                "number"
              ],
              "description": "Position (top,bottom or float)"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams({ idBoard: input.idBoard, name: input.name })\n  if (input.pos !== undefined && input.pos !== null)\n    params.set('pos', String(input.pos))\n  const res = await integration.fetch(`/lists?${params.toString()}`, { method: 'POST' })\n  return await res.json()\n}",
        "scope": "write",
        "injectFromConfig": {
          "idBoard": "boardId"
        }
      },
      {
        "name": "update_list",
        "description": "Update a list (name, pos, closed).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "listId"
          ],
          "additionalProperties": false,
          "properties": {
            "listId": {
              "type": "string"
            },
            "name": {
              "type": [
                "string",
                "null"
              ]
            },
            "closed": {
              "type": [
                "boolean",
                "null"
              ]
            },
            "pos": {
              "type": [
                "string",
                "number",
                "null"
              ]
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams()\n  if (input.name !== undefined && input.name !== null)\n    params.set('name', input.name)\n  if (input.closed !== undefined && input.closed !== null)\n    params.set('closed', String(input.closed))\n  if (input.pos !== undefined && input.pos !== null)\n    params.set('pos', String(input.pos))\n  const res = await integration.fetch(`/lists/${encodeURIComponent(input.listId)}?${params.toString()}`, { method: 'PUT' })\n  return await res.json()\n}",
        "scope": "write"
      },
      {
        "name": "archive_list",
        "description": "Archive a list (set closed=true).",
        "inputSchema": {
          "$schema": "http://json-schema.org/draft-07/schema#",
          "type": "object",
          "required": [
            "listId"
          ],
          "additionalProperties": false,
          "properties": {
            "listId": {
              "type": "string"
            }
          }
        },
        "handlerCode": "async (input) => {\n  const params = new URLSearchParams({ value: 'true' })\n  const res = await integration.fetch(`/lists/${encodeURIComponent(input.listId)}/closed?${params.toString()}`, { method: 'PUT' })\n  return await res.json()\n}",
        "scope": "write"
      }
    ]
  }
}
