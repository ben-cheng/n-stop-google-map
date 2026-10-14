# N-stop Google Map

A browser-based tool for turning a list of locations into a multi-stop Google
Maps directions route. Enter stops manually or paste a route list, then open
the generated link in Google Maps. Named routes can be saved locally and loaded
again later.

## Features

- Create a Google Maps directions link from stops entered one per line.
- Paste text or an image containing route information. Pasted images are
  recognized with OCR; numbered entries with AM/PM times are converted to
  location-only lines when the input matches that format.
- See line numbers beside the route editor.
- Save routes with a title in browser IndexedDB, update a saved route by saving
  with the same exact title, and load saved routes back into the editor.
- Search saved routes by title or stop text.
- Install as a Progressive Web App in supported browsers.

Route data is stored only in the current browser. It is not uploaded or synced
between devices.

## Getting started

Requirements: Node.js and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

## Usage

1. Enter one location on each line in **Stops**.
2. To import route text, paste it into the editor. To use OCR, copy an image and
   paste it into the editor.
3. Name the route and select **Save route** to keep it in this browser.
4. Use **Search saved routes** to find routes by name or stop, then select
   **Load** to put one in the editor.
5. Select **View route in Google Maps** to open the directions.

The current editor contents are also persisted in local storage automatically.
Selecting **Clear stops** clears the editor contents.

## Development

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create a production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

## Technology

- React and TypeScript
- Vite with SWC
- Tailwind CSS 4
- Tesseract.js for image OCR
- IndexedDB for named routes and local storage for the current editor contents
- Vite PWA plugin

## Deployment

Vite is configured with `/n-stop-google-map/` as its base path for deployment.
Keep the deployment path in sync with `base` in `vite.config.ts` if hosting the
app elsewhere.
