# BrainDump

BrainDump is a Next.js app for turning raw input into organized outputs.

## Features

- Capture one thought per line into Input.
- Process input items one by one with keyboard shortcuts.
- Move useful items into one or more Outputs.
- Preserve added input batches for later reconstruction.
- Optionally send Output items to Todoist with a locally stored API key.
- Export and import app state.
- Store data locally in the browser.

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```
