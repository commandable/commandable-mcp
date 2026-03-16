# @commandable/mcp-connect

Machine-facing stdio connector package for Commandable.

Humans normally use `@commandable/mcp`, which prints commands that reference this package.

Available modes:

- `dynamic-mode` - session-scoped tool loading without builder powers
- `static-mode` - eager-load all configured tools
- `create-mode` - dynamic mode plus integration/tool creation
- `read-mode` - compatibility alias for `static-mode`
