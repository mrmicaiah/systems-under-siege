# Systems Under Siege

An 11ty-powered blog about home organization for overwhelmed parents.

## Development

```bash
npm install
npm run dev    # Start dev server
npm run build  # Build for production
```

## Deployment

Uses GitHub Pages with GitHub Actions. On push to main, the site auto-builds and deploys.

### Setup

1. Go to repo Settings → Pages
2. Set Source to "GitHub Actions"
3. Create `.github/workflows/deploy.yml` with the 11ty build workflow

## Configuration

Edit `src/_data/site.json` for site settings, colors, and API connections.

## Adding Posts

Create markdown files in `src/posts/`:

```markdown
---
title: "Post Title"
date: 2026-02-03
excerpt: "Short description"
image: https://example.com/image.jpg
author: Emily
tags:
  - organizing
---

Content here...
```

---

Published by [Untitled Publishers](https://untitledpublishers.com)
