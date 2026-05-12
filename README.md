# BrainDump

BrainDump is a Next.js app for turning a raw stream of notes into an organized stack of actions.

## Features

- Capture one thought per line into a stream.
- Process stream items one by one with keyboard shortcuts.
- Move useful items into a stack with context, category, priority, and due date fields.
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
