---
name: obsidian-cli
description: Use the obsidian CLI to read, create, search, and manage notes, tasks, properties, and more in a running Obsidian instance. Use when the user wants to interact with Obsidian from the command line, reload plugins, or run developer workflows.
---

# Obsidian CLI Skill

The `obsidian` CLI interacts with a running Obsidian instance. Run `obsidian help` for the complete, current command reference.

## Syntax

```
obsidian <command> [parameters] [flags]
```

Parameters use `=` assignment syntax. Quote values containing spaces.

```bash
obsidian note:read file="My Note"
obsidian note:create file="New Note" content="Hello world"
```

Use `\n` for newlines and `\t` for tabs in content values.

## File & Vault Targeting

| Parameter | Description |
|-----------|-------------|
| `file=<name>` | Wikilink-style resolution (fuzzy search) |
| `path=<path>` | Exact path from vault root |
| `vault=<name>` | Target a specific vault (defaults to most recently focused) |

## Common Flags

| Flag | Description |
|------|-------------|
| `--copy` | Copy output to clipboard |
| `silent` | Prevent files from opening |
| `total` | Return count on list commands |

## Vault Operations

- Read notes: `obsidian note:read file=<name>`
- Create notes: `obsidian note:create file=<name> content=<text>`
- Append to notes: `obsidian note:append file=<name> content=<text>`
- Search vault: `obsidian search query=<text>`
- Manage tasks and properties
- View tags and backlinks
- Daily notes

## Developer Workflow

Typical plugin development cycle:

1. Reload plugin: `obsidian plugin:reload id=<plugin-id>`
2. Check errors: `obsidian dev:errors`
3. Screenshot: `obsidian dev:screenshot`
4. Inspect DOM: `obsidian dev:dom`
5. Run JavaScript: `obsidian eval code=<js>`
6. Inspect CSS: `obsidian dev:css`
7. Mobile emulation: `obsidian dev:mobile`

Run `obsidian help` to see all available commands for your installed version.
