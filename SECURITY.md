# Security Policy

## Supported Versions

Only the latest published version of `@commandable/mcp` receives security fixes.

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |
| Older   | No        |

## Reporting a Vulnerability

**Please do not report security vulnerabilities via GitHub issues.** Issues are public and doing so would expose the vulnerability before it can be fixed.

Instead, email **theo@commandable.ai** with:

- A description of the vulnerability
- Steps to reproduce (or a proof of concept)
- The potential impact
- Any suggested mitigations (optional)

You can expect:

- **Acknowledgement** within 2 business days
- **Status update** within 5 business days (confirmed, investigating, or not a vulnerability)
- **Fix + disclosure** coordinated with you once resolved

We ask that you give us reasonable time to address the issue before any public disclosure.

## Scope

The following are in scope:

- Credential exposure or exfiltration via the MCP server or its handlers
- Sandbox escape in integration handler execution
- Authentication/authorization bypasses in the HTTP server
- Injection vulnerabilities in integration handlers or config parsing

The following are out of scope:

- Vulnerabilities in third-party services that integrations connect to
- Issues requiring physical access to the machine
- Denial of service against a self-hosted instance

## Preferred Languages

English.
