---
name: json-canvas
description: Create and edit JSON Canvas files (.canvas) with nodes, edges, groups, and connections. Use when working with .canvas files, creating visual canvases, mind maps, flowcharts, or when the user mentions Canvas files in Obsidian.
---

# JSON Canvas Skill

## File Structure

A canvas file (`.canvas`) contains two top-level arrays following the [JSON Canvas Spec 1.0](https://jsoncanvas.org/spec/1.0/):

```json
{
  "nodes": [],
  "edges": []
}
```

## Common Workflows

### 1. Create a New Canvas

1. Create a `.canvas` file with base structure `{"nodes": [], "edges": []}`
2. Generate unique 16-character hex IDs for each node (e.g., `"6f0ad84f44ce9c17"`)
3. Add nodes with required fields: `id`, `type`, `x`, `y`, `width`, `height`
4. Add edges referencing valid node IDs via `fromNode` and `toNode`
5. Validate: parse JSON, verify all `fromNode`/`toNode` values exist in nodes array

### 2. Add a Node

1. Read and parse the existing `.canvas` file
2. Generate a unique ID not colliding with existing IDs
3. Choose position (`x`, `y`) avoiding overlaps (leave 50–100px spacing)
4. Append new node to `nodes` array
5. Optionally add edges

### 3. Connect Two Nodes

1. Identify source and target node IDs
2. Generate a unique edge ID
3. Set `fromNode`/`toNode`; optionally `fromSide`/`toSide` and `label`
4. Append the edge to `edges`

## Nodes

### Generic Node Attributes

| Attribute | Required | Type | Description |
|-----------|----------|------|-------------|
| `id` | Yes | string | Unique 16-char hex identifier |
| `type` | Yes | string | `text`, `file`, `link`, or `group` |
| `x` | Yes | integer | X position in pixels |
| `y` | Yes | integer | Y position in pixels |
| `width` | Yes | integer | Width in pixels |
| `height` | Yes | integer | Height in pixels |
| `color` | No | canvasColor | Preset `"1"`–`"6"` or hex `"#FF0000"` |

### Text Nodes

```json
{
  "id": "6f0ad84f44ce9c17",
  "type": "text",
  "x": 0, "y": 0, "width": 400, "height": 200,
  "text": "# Hello World\n\nThis is **Markdown** content."
}
```

Use `\n` for line breaks in JSON strings. Do **not** use `\\n`.

### File Nodes

```json
{
  "id": "a1b2c3d4e5f67890",
  "type": "file",
  "x": 500, "y": 0, "width": 400, "height": 300,
  "file": "Attachments/diagram.png"
}
```

Optional: `"subpath": "#Heading"` to link to a heading or block.

### Link Nodes

```json
{
  "id": "c3d4e5f678901234",
  "type": "link",
  "x": 1000, "y": 0, "width": 400, "height": 200,
  "url": "https://obsidian.md"
}
```

### Group Nodes

```json
{
  "id": "d4e5f6789012345a",
  "type": "group",
  "x": -50, "y": -50, "width": 1000, "height": 600,
  "label": "Project Overview",
  "color": "4"
}
```

## Edges

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `id` | Yes | - | Unique identifier |
| `fromNode` | Yes | - | Source node ID |
| `fromSide` | No | - | `top`, `right`, `bottom`, `left` |
| `fromEnd` | No | `none` | `none` or `arrow` |
| `toNode` | Yes | - | Target node ID |
| `toSide` | No | - | `top`, `right`, `bottom`, `left` |
| `toEnd` | No | `arrow` | `none` or `arrow` |
| `color` | No | - | Line color |
| `label` | No | - | Text label |

```json
{
  "id": "0123456789abcdef",
  "fromNode": "6f0ad84f44ce9c17",
  "fromSide": "right",
  "toNode": "a1b2c3d4e5f67890",
  "toSide": "left",
  "label": "leads to"
}
```

## Colors

| Preset | Color |
|--------|-------|
| `"1"` | Red |
| `"2"` | Orange |
| `"3"` | Yellow |
| `"4"` | Green |
| `"5"` | Cyan |
| `"6"` | Purple |

## ID Generation

Generate 16-character lowercase hexadecimal strings (64-bit random value): `"6f0ad84f44ce9c17"`

## Layout Guidelines

- Coordinates can be negative (infinite canvas)
- `x` increases right, `y` increases down; position is the top-left corner
- Space nodes 50–100px apart; 20–50px padding inside groups
- Align to grid (multiples of 10 or 20)

| Node Type | Suggested Width | Suggested Height |
|-----------|-----------------|------------------|
| Small text | 200–300 | 80–150 |
| Medium text | 300–450 | 150–300 |
| Large text | 400–600 | 300–500 |
| File preview | 300–500 | 200–400 |

## Validation Checklist

1. All `id` values are unique across nodes and edges
2. Every `fromNode`/`toNode` references an existing node ID
3. Required fields present per node type
4. `type` is one of: `text`, `file`, `link`, `group`
5. `fromSide`/`toSide` is one of: `top`, `right`, `bottom`, `left`
6. `fromEnd`/`toEnd` is one of: `none`, `arrow`
7. Color presets are `"1"`–`"6"` or valid hex
8. JSON is valid and parseable

## References

- [Examples](references/EXAMPLES.md)
- [JSON Canvas Spec 1.0](https://jsoncanvas.org/spec/1.0/)
