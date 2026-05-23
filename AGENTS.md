# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js application (no monorepo, no external services required). All data is stored in the browser's `localStorage`.

### Quick reference

- **Dev server:** `npm run dev` (serves on http://localhost:3000)
- **Lint:** `npm run lint`
- **Type check:** `npx tsc --noEmit`
- **Build:** `npm run build`

See `README.md` for full documentation.

### Notes

- No database, Docker, or environment variables are needed.
- The optional Todoist integration requires a user-provided API key stored client-side in settings; it is not required for the app to function.
- The Next.js dev server uses Turbopack and starts quickly (~2 seconds).
