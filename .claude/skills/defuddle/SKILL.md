---
name: defuddle
description: Extract clean readable content from web pages using the defuddle CLI. Use instead of WebFetch when the user provides a URL to read or analyze, for online documentation, articles, blog posts, or any standard web page. Skip for URLs ending in .md.
---

# Defuddle Skill

Use the `defuddle` CLI to extract clean, readable content from web pages by removing navigation, ads, and other clutter. Reduces token usage compared to WebFetch.

## Primary Command

```bash
defuddle parse <url> --md
```

The `--md` flag outputs markdown format (recommended for most use cases).

## When to Use

- Standard web pages: articles, blog posts, online documentation
- When the user provides a URL to read or analyze

## When NOT to Use

- URLs ending in `.md` — use WebFetch directly (already markdown-formatted)

## Output Formats

| Format | Command |
|--------|---------|
| Markdown | `defuddle parse <url> --md` |
| JSON (html + markdown) | `defuddle parse <url> --json` |
| Plain HTML | `defuddle parse <url>` |
| Title only | `defuddle parse <url> -p title` |
| Description | `defuddle parse <url> -p description` |
| Domain | `defuddle parse <url> -p domain` |

## Save to File

```bash
defuddle parse <url> --md -o output.md
```
