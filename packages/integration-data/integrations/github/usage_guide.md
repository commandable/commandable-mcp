# GitHub coding workflow

## Branch-based workflow

Always work on a feature branch, never commit directly to main:

1. `create_branch` from the default branch
2. Make changes with `edit_file`, `edit_files`, `create_file`, or `delete_file` -- each call auto-commits to the branch
3. `create_pull_request` when done
4. `merge_pull_request` with `merge_method: "squash"` to collapse all commits into one clean commit on main

Multiple small commits on a feature branch are fine -- they get squash-merged into a single commit.

## Choosing the right write tool

- **`edit_file`** -- Surgical edits to a single existing file. Use for most code changes. Each call is a commit.
- **`edit_files`** -- Atomic multi-file changes (create + edit + delete in one commit). Use when files must change together to stay consistent (e.g. renaming across files, adding a module + updating imports).
- **`create_file`** -- Create a new file or completely replace an existing file's content. Use for new files or full rewrites.
- **`delete_file`** -- Remove a file.

## Search/replace rules for edit_file and edit_files

The `old_text` field must be an **exact match** of the text currently in the file:

- Whitespace matters: spaces, tabs, and indentation must match exactly
- Line breaks matter: include the exact newline characters
- Include enough surrounding context to uniquely identify the location
- Each edit replaces the **first occurrence** only. To replace multiple occurrences, use separate edits.

**Before editing**, call `get_file_contents` to see the file's current content. This avoids failed edits from stale or incorrect assumptions about file content.

## Reading before writing

- Use `get_repo_tree` to discover the project structure and file paths
- Use `get_file_contents` to read a file before editing it
- Use `search_code` to find where something is defined or used across the repo
