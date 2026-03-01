# Jira usage guide

## Core workflow patterns

### Discover projects and issue types (before creating issues)

1. Call `list_projects` to find the project key (e.g. `PROJ`).
2. Call `get_project` with `projectIdOrKey=PROJ` to see available `issueTypes`.
3. Use the returned issue type name with `create_issue.issueTypeName`.

### Search issues (JQL)

Use `search_issues` with JQL. Common examples:

- My open issues:
  - `assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC`
- Recently updated issues in a project:
  - `project = PROJ ORDER BY updated DESC`
- Unassigned bugs:
  - `project = PROJ AND issuetype = Bug AND assignee is EMPTY ORDER BY created DESC`
- Blocked issues (label-based):
  - `project = PROJ AND labels = blocked ORDER BY priority DESC, updated DESC`

Pagination:
- `search_issues` uses `nextPageToken`. If `nextPageToken` is returned and `isLast=false`, pass it back to get the next page.

### Read issue content

- Use `get_issue` to read a compact issue summary.
- `get_issue` converts Jira's ADF description into `descriptionMarkdown` when possible (fallback: `descriptionText`).
- Use `get_issue_comments` to read the comment thread (comment bodies are converted to Markdown).

### Transition an issue (change status)

Jira workflows are project-specific, so you must discover valid transitions:

1. Call `get_transitions` to see available transition names/IDs for the issue.
2. Call `transition_issue` using either `transitionId` (preferred) or `transitionName`.

### Assigning issues

1. Call `search_users` to find the user's `accountId`.
2. Assign:
   - `assign_issue { issueIdOrKey, accountId }`
3. Unassign:
   - `assign_issue { issueIdOrKey, accountId: null }`

## Notes on Jira rich text (ADF)

Jira Cloud REST API v3 uses **Atlassian Document Format (ADF)** for fields like `description` and comment bodies.

- Read tools convert ADF to Markdown so you can read it directly.
- Write tools accept plain text and convert it to minimal ADF automatically (`descriptionText`, `bodyText`, `commentText`).

## Boards & sprints

If you’re using Jira Software:

1. Call `list_boards` (optionally filter by `projectKeyOrId`).
2. Call `list_sprints` for a board to find active/future sprints.
3. Use `move_issues_to_sprint` to pull work into a sprint (sprint planning).

