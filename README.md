# BrainDump

BrainDump is a Next.js app for turning raw input into organized outputs.

## Features

- Draft multiple lines in the always-visible Input composer, then add them as rows with one click.
- Edit, select, and delete input rows with spreadsheet-style arrow, Shift+arrow, Backspace, and Delete controls.
- Process input items one by one with `A` (delete), `S` (stay in Input), and `D` (move to Output), while still being able to edit the current item.
- Create, rename, switch between, and clear multiple Outputs without hiding the Input composer.
- Resolve inputs that already exist in an Output while preserving their context.
- Copy Outputs as `*`-bulleted Markdown.
- Export and import the complete workspace, including the current unsubmitted Input draft.
- Preserve added input batches for later reconstruction.
- Optionally send Output items to Todoist with a locally stored API key.
- Store workspace data and drafts locally in the browser.

## Keyboard shortcuts

- `Cmd/Ctrl+P`: open processing mode.
- `Arrow Up` / `Arrow Down`: move the selected Input row.
- `Shift+Arrow Up` / `Shift+Arrow Down`: extend the Input selection.
- `Backspace` / `Delete`: delete selected Input rows.
- In processing mode: `A` or `Backspace` deletes the item, `S` keeps it in Input, `D` moves it to the active Output, and `Esc` exits.

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
