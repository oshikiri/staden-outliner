# Staden-outliner: An Opinionated and Maintainable Outliner

<img src="./docs/icon.png" alt="staden icon" width="200" height="200" />

- Supports Logseq-like markdown
- Built with TypeScript, Bun, Hono, and SQLite
- Limited features
- Query tables using SQLite

## Roadmap
- Fix remaining `@owner` comments
- Add automatic export of markdown files
- Improve the Markdown editor
  - See also https://github.com/oshikiri/react-plaintext-outliner
  - Support pasting images from the clipboard
  - Improve caret movement
  - Implement undo and redo
- Android viewer app
- Full-text search
- Additional E2E tests

## Getting Started

Requirements:
- Bun
- SQLite

```bash
# Set root directory
export STADEN_ROOT=./docs
```
### Run the development server and view documents

Start the Bun server:

```bash
bun run dev
```

Then initialize the vault:

```bash
curl -X POST http://127.0.0.1:3000/api/initialize
```

After starting the server, you can view the documents at <http://localhost:3000/>.

![Screenshot at /pages/index](./docs/index-screenshot.png)

### Run the development server using Docker

For development, you can build and run the Bun service defined in `docker-compose.yml`.

```bash
docker compose up --build
```

Once the container is running, open <http://localhost:3000/> in your browser.
When you are done, press `Ctrl+C` in the terminal or run `docker compose down` from a separate shell to stop the stack.

### Run in Production Mode

```bash
bun run build
```

Start the Bun server:

```bash
bun run start
```

Then open <http://localhost:3000/> in your browser.
