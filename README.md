# Staden-outliner: An Opinionated and Maintainable Outliner

<img src="./docs/icon.png" alt="staden icon" width="200" height="200" />

- Supports Logseq-like markdown
- Built with TypeScript, Vite, Hono, and SQLite
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

Start the API server in one terminal:

```bash
bun run dev:api
```

Start the web app in another terminal:

```bash
bun run dev:web
```

Then initialize the vault:

```bash
curl -X POST http://127.0.0.1:3001/api/initialize
```

After starting both processes, you can view the documents at <http://localhost:5173/>.

![Screenshot at /pages/index](./docs/index-screenshot.png)

### Run the development server using Docker

For development, you can build and run the `api` and `web` services defined in `docker-compose.yml`.

```bash
docker compose up --build
```

Once the containers are running, open <http://localhost:5173/> in your browser.
The API listens on <http://localhost:3001/>.
When you are done, press `Ctrl+C` in the terminal or run `docker compose down` from a separate shell to stop the stack.

### Run in Production Mode

```bash
bun run build:web
```

Start the API server in one terminal:

```bash
bun run start:api
```

Start the web preview in another terminal:

```bash
bun run start:web
```

Then open <http://localhost:4173/> in your browser.

### Build a standalone API binary with Bun

This builds only the API server into a single executable.
The web app remains a separate Vite build.
You need Bun on the machine that produces the binary.

Build the binary:

```bash
bun run build:api:binary
```

Run the binary with the vault path set:

```bash
export STADEN_ROOT=./docs
./dist/staden-api
```

You can still override `HOST` and `PORT` when starting the binary.
The binary itself does not require Node.js, Bun scripts, or `tsx` at runtime.
The build command loads `tsconfig.json` and `package.json` so Bun can resolve the existing path aliases.
