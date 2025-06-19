# Staden: An Opinionated and Maintainable Outliner for Me

<img src="./docs/icon.png" alt="staden icon" width="200" height="200" />

- Built with a popular stack (TypeScript/React/Next.js/SQLite)
- Limited features
- Compatible with Logseq markdown
- Query tables using SQLite

## Roadmap
- Automatic export to markdown files
- Improve markdown editor
  - See also https://github.com/oshikiri/react-plaintext-outliner
  - Paste images from clipboard
  - Caret movement
  - Implement undo
  - etc.
- Android app (viewer)

## Getting Started

Requirements:

```bash
STADEN_ROOT=./docs
```

### Run the development server (and read documents)

```bash
npm run dev
```

GET `/api/initialize`

See <http://localhost:3000/pages/index>

![Screenshot at /pages/index](./docs/index-screenshot.png)

### Run the production server

```bash
npm run build
npm run start
```

## Remaining TODOs and Known Issues

```bash
git grep FIXME
```
