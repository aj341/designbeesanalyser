# Homepage Analyzer

This is a self-hostable copy of your Replit app, cleaned up so you can run and deploy it yourself.

## What changed

- Removed the Replit-only frontend plugins.
- Switched Anthropic auth to standard `ANTHROPIC_API_KEY` support, while still accepting the old Replit vars.
- Replaced Postgres with SQLite, so the app stores data in a local `.db` file instead of requiring a database server.
- Made the backend cross-platform for Windows and macOS/Linux development.
- Made the backend serve the built frontend so production can run as a single app.

## Requirements

- Node.js 24+
- An Anthropic API key

## First-time setup

1. Copy `.env.example` to `.env` and fill in `ANTHROPIC_API_KEY`.
2. Install dependencies:

```bash
corepack pnpm install
```

3. Create the SQLite database schema:

```bash
corepack pnpm db:push
```

4. Install the browser Puppeteer uses for screenshots:

```bash
corepack pnpm install:browsers
```

## Local development

Run the API and frontend together:

```bash
corepack pnpm dev
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`
- SQLite file: `./data/homepage-analyzer.db`

The frontend proxies `/api` requests to the backend in development. If you host the frontend separately, set `VITE_API_BASE_URL`.

## Production build

Build everything:

```bash
corepack pnpm build
```

Start the production server:

```bash
corepack pnpm start
```

After the frontend is built, the API server will serve the static app and the API from the same process.

## Hosting note

SQLite is a good fit if you host the app somewhere that keeps a persistent disk or volume. Avoid static-only or fully ephemeral hosts.

## Useful commands

```bash
corepack pnpm dev
corepack pnpm dev:api
corepack pnpm dev:web
corepack pnpm db:push
corepack pnpm build
corepack pnpm start
```
