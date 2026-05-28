---
name: obsidian-markdown
description: Create and edit Obsidian Flavored Markdown with wikilinks, embeds, callouts, properties, and other Obsidian-specific syntax. Use when working with .md files in Obsidian, or when the user mentions wikilinks, callouts, frontmatter, tags, embeds, or Obsidian notes.
---

# Obsidian Flavored Markdown Skill

## Overview

This skill enables creation and editing of valid Obsidian Flavored Markdown, which extends CommonMark and GFM with specialized features including wikilinks, embeds, callouts, properties, comments, and additional syntax elements.

## Key Features

**Internal Links (Wikilinks):** Support for `[[Note Name]]` with optional display text, heading links, and block references via `^block-id`.

**Embeds:** Use `![[filename]]` syntax to embed notes, sections, images (with sizing), and PDF pages directly into content.

**Callouts:** Highlighted information blocks using `> [!type]` syntax with optional titles and collapse states, supporting types like note, warning, info, tip, danger, and others.

**Properties (Frontmatter):** YAML frontmatter section containing metadata such as title, date, tags, aliases, and cssclasses.

**Tags:** Searchable labels using `#tag` or `#nested/tag` hierarchy syntax in content or frontmatter.

**Additional Features:** Comments with `%% %%`, highlight syntax with `==text==`, LaTeX math support, Mermaid diagrams, and footnotes.

## Workflow Steps

1. Add frontmatter with properties at file top
2. Write content using standard Markdown and Obsidian syntax
3. Link related notes using wikilinks for vault connections
4. Embed external content as needed
5. Add callouts for emphasis
6. Verify rendering in Obsidian's reading view

## References

- [Callouts](references/CALLOUTS.md)
- [Embeds](references/EMBEDS.md)
- [Properties](references/PROPERTIES.md)
