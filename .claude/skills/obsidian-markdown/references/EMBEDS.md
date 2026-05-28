# Embeds Reference

## Note Embeds

```markdown
![[Note Name]]
![[Note Name#Heading]]
![[Note Name#^block-id]]
```

## Image Embeds

Local images:
```markdown
![[image.png]]
![[image.png|640]]
![[image.png|640x480]]
```

External images:
```markdown
![Alt text](https://example.com/image.png)
![Alt text|640](https://example.com/image.png)
```

## Audio Embeds

```markdown
![[audio.mp3]]
![[audio.ogg]]
```

## PDF Embeds

```markdown
![[document.pdf]]
![[document.pdf#page=2]]
![[document.pdf#height=500]]
```

## List Embeds

Embed a specific list block by block ID:
```markdown
![[Note#^list-id]]
```

## Search Results

Embed search query results inside a code block with language `search`:
````markdown
```search
tag:#project status:done
```
````
