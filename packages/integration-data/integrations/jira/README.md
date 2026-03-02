# Jira

**23 tools** across 2 toolsets

![Jira tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-jira.json)

## Credential variants

| Variant | Label |
|---|---|
| `api_token` | API Token (Email + Token) _(default)_ |

## Toolsets

| Toolset | Description |
|---|---|
| `issues` | Search, read, create, and manage Jira issues |
| `boards` | Work with Jira Software boards, sprints, and backlogs |

## Tools

| Tool | Scope | Toolset | Description |
|---|---|---|---|
| `search_issues` | read | `issues` | Search for issues using JQL. Returns a compact list of issues with key fields. Uses the m… |
| `get_issue` | read | `issues` | Get details for a Jira issue by key (e.g. PROJ-123). Converts the issue description from … |
| `get_issue_comments` | read | `issues` | List comments on an issue. Converts each comment body from Jira ADF into Markdown. |
| `list_projects` | read | `issues` | List accessible Jira projects (key, name, type). Use this before creating issues to disco… |
| `get_project` | read | `issues` | Get a project by key or ID. Includes issue types when expandIssueTypes=true, which is use… |
| `get_transitions` | read | `issues` | List available workflow transitions for an issue. Use this to discover valid transition n… |
| `get_myself` | read | `issues` | Get the authenticated Jira user profile for the current credentials. |
| `search_users` | read | `issues` | Search for users and return accountIds for assignment. Use this to find assigneeAccountId… |
| `create_issue` | write | `issues` | Create a new Jira issue. Provide descriptionText as Markdown; the handler converts it to … |
| `update_issue` | write | `issues` | Update a Jira issue. You can use simple fields like summary/descriptionText/labels/priori… |
| `transition_issue` | write | `issues` | Transition an issue to a new workflow status. Provide transitionId or transitionName. If … |
| `add_comment` | write | `issues` | Add a comment to an issue. Provide bodyText as Markdown; the handler converts it to Jira … |
| `assign_issue` | write | `issues` | Assign an issue to a user (by accountId) or unassign it (accountId=null). Use search_user… |
| `delete_issue` | write | `issues` | Delete an issue. This is irreversible. Use with care. |
| `list_boards` | read | `boards` | List Jira Software boards. Filter by projectKeyOrId and board type (scrum/kanban). |
| `get_board` | read | `boards` | Get details for a Jira Software board by boardId. |
| `list_sprints` | read | `boards` | List sprints for a board. Optionally filter by sprint state (future/active/closed). |
| `get_sprint` | read | `boards` | Get sprint details by sprintId (name, state, start/end dates, goal). |
| `get_sprint_issues` | read | `boards` | List issues in a sprint. Useful for sprint status reports and review preparation. |
| `get_backlog_issues` | read | `boards` | List issues in the backlog for a board. |
| `move_issues_to_sprint` | write | `boards` | Move one or more issues into a sprint (agile API). |
| `create_sprint` | write | `boards` | Create a sprint in a board (agile API). Use this for sprint-planning workflows and for in… |
| `update_sprint` | write | `boards` | Update a sprint (agile API). Use to rename, set/change goal, start a sprint (state: activ… |
