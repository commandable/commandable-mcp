# GitHub

**47 tools** across 6 toolsets

![GitHub tests](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/theomccabe/771bd329f303087690c522afa1baa6f3/raw/test-github.json)

## Credential variants

| Variant | Label |
|---|---|
| `classic_pat` | Classic Personal Access Token _(default)_ |
| `fine_grained_pat` | Fine-Grained Personal Access Token |

## Toolsets

| Toolset | Description |
|---|---|
| `code` | Read, search, and manage repository code and branches |
| `issues` | Create, search, and manage GitHub issues |
| `pull_requests` | Create, review, and merge pull requests |
| `ci` | Monitor GitHub Actions workflows and debug failures |
| `releases` | Manage releases and view tags |
| `repo_admin` | Create, delete, fork, and discover repositories |

## Tools

| Tool | Scope | Toolset | Description |
|---|---|---|---|
| `get_me` | read | `repo_admin` | Get the authenticated user's profile. Use this to find out who you are authenticated as b… |
| `list_repos` | read | `repo_admin` | List repositories for the authenticated user. |
| `get_repo` | read | `code` | Get details for a repository (description, default branch, visibility, topics, stats). |
| `search_repos` | read | `repo_admin` | Search GitHub repositories. Supports stars, forks, language, topic, and user filters (e.g… |
| `get_file_contents` | read | `code` | Get the content of a file from a repository. Returns decoded UTF-8 text. Use ref to read … |
| `get_repo_tree` | read | `code` | Get the full file/directory tree of a repository. Returns all paths and types. Use path_f… |
| `search_code` | read | `code` | Search for code across GitHub repositories using GitHub's code search syntax. Examples: '… |
| `list_branches` | read | `code` | List branches in a repository. Supports pagination and filtering by protection status. |
| `list_commits` | read | `code` | List commits for a repository. Filter by branch/tag (sha), file path, or author. Paginate… |
| `get_commit` | read | `code` | Get the full details of a specific commit including its message, author, file changes, an… |
| `list_tags` | read | `code` | List tags for a repository. Use this to see available versions before creating a release. |
| `list_issues` | read | `issues` | List issues for a repository. Filter by state (open/closed/all), labels (comma-separated)… |
| `get_issue` | read | `issues` | Get full details of a specific issue including its body, labels, assignees, and milestone. |
| `list_issue_comments` | read | `issues` | List all comments on an issue. Use this to read the full discussion thread before replyin… |
| `search_issues` | read | `issues` | Search issues using GitHub search syntax (e.g. 'is:open is:issue label:bug repo:owner/rep… |
| `list_labels` | read | `issues` | List all labels available in a repository. Call this before add_labels_to_issue to see wh… |
| `list_pull_requests` | read | `pull_requests` | List pull requests for a repository. Filter by state, head branch, base branch. Sort and … |
| `get_pull_request` | read | `pull_requests` | Get full details of a specific pull request including title, body, state, merge status, h… |
| `get_pull_request_diff` | read | `pull_requests` | Get the raw unified diff for a pull request. Returns the complete diff of all changes. Fo… |
| `list_pull_request_files` | read | `pull_requests` | List the files changed in a pull request with their status (added/modified/deleted) and p… |
| `list_pull_request_comments` | read | `pull_requests` | List inline review comments on a pull request (comments attached to specific lines of cod… |
| `search_pull_requests` | read | `pull_requests` | Search pull requests using GitHub search syntax. Use 'is:pr' to scope to PRs (e.g. 'is:pr… |
| `list_releases` | read | `releases` | List all releases for a repository, newest first. |
| `get_latest_release` | read | `releases` | Get the latest published release for a repository. Use this to quickly check the current … |
| `list_workflow_runs` | read | `ci` | List GitHub Actions workflow runs for a repository. Filter by branch, status (e.g. 'failu… |
| `get_workflow_run` | read | `ci` | Get details of a specific GitHub Actions workflow run including its status, conclusion, t… |
| `get_job_logs` | read | `ci` | Get the log output for a specific GitHub Actions workflow job. Use this to diagnose CI fa… |
| `create_repo` | write | `repo_admin` | Create a new GitHub repository under the authenticated user's account. |
| `delete_repo` | write | `repo_admin` | Permanently delete a repository. This is irreversible. Requires the delete_repo scope on … |
| `fork_repo` | write | `repo_admin` | Fork a repository into your account or an organization. The fork is created asynchronousl… |
| `create_branch` | write | `code` | Create a new branch in a repository, branching from the repo's default branch by default. |
| `delete_branch` | write | `code` | Delete a branch. Typically used after a pull request is merged. Use list_branches to find… |
| `edit_file` | write | `code` | Edit a file using search/replace. Fetches the file, applies edits, and commits the result… |
| `edit_files` | write | `code` | Create, edit, and delete multiple files in a single atomic commit. Use action 'create' wi… |
| `create_file` | write | `code` | Create a new file or overwrite an existing file's content in a single commit. Handles SHA… |
| `delete_file` | write | `code` | Delete a file from a repository. The file's SHA is fetched automatically. Creates a commi… |
| `create_pull_request` | write | `pull_requests` | Open a new pull request from a head branch into a base branch. |
| `update_pull_request` | write | `pull_requests` | Edit a pull request's title, body, state (open/closed), base branch, or draft status. |
| `merge_pull_request` | write | `pull_requests` | Merge a pull request. Supports merge, squash, and rebase merge methods. |
| `request_pull_request_reviewers` | write | `pull_requests` | Request specific users or teams to review a pull request. |
| `create_pull_request_review` | write | `pull_requests` | Submit a pull request review. Use event=APPROVE to approve, REQUEST_CHANGES to request ch… |
| `create_issue` | write | `issues` | Create a new issue in a repository. Optionally assign users and add labels. |
| `update_issue` | write | `issues` | Update fields on an existing issue (title, body, state, assignees, labels, milestone). |
| `close_issue` | write | `issues` | Close an issue. |
| `comment_on_issue` | write | `issues` | Add a comment to an issue or pull request (GitHub PRs share the issue comment thread). Us… |
| `add_labels_to_issue` | write | `issues` | Add labels to an issue or pull request. Use list_labels to discover available labels befo… |
| `create_release` | write | `releases` | Create a new release from a tag. Can auto-generate release notes from commits. Set draft=… |
