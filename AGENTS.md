# Agent Guide

## Project

N-stop Google Map is a client-side React and TypeScript app for creating
multi-stop Google Maps routes. It uses Vite, Tailwind CSS 4, Tesseract.js, and
the Vite PWA plugin.

## Structure

- `src/App.tsx`: main UI and route editing, paste, save, search, and load flows.
- `src/utils/GoogleMapUrlGenerator.ts`: turns a list of stops into a Google
  Maps directions URL.
- `src/utils/ExtractLocations.ts`: extracts locations from numbered stop
  lists with AM/PM times; returns input unchanged if that format is not found.
- `src/utils/SavedStopsStore.ts`: IndexedDB persistence for named routes.
- `src/index.css`: Tailwind import and global page defaults.
- `vite.config.ts`: Vite, React, Tailwind, PWA configuration, and deployment
  base path.

## Existing behavior to preserve

- The current textarea is persisted using `usehooks-ts` under the local-storage
  key `n-stop-google-map-input`.
- Pasted images are OCR-processed with Tesseract.js. OCR text and plain-text
  paste both flow through location extraction.
- Keep the line-number gutter synchronized with textarea vertical scrolling.
- The Google Maps URL is generated from the current textarea contents.
- Named routes are persisted in IndexedDB database `n-stop-google-map`, object
  store `saved-stops`. Matching titles are exact and case-sensitive; saving
  one updates its content and timestamp.
- Saved routes are sorted by update time and searchable by title and stop text.
- All route data remains in browser storage; there is no server API or account
  sync.

## Implementation conventions

- Use Tailwind utility classes in JSX for component styles. Keep global CSS in
  `src/index.css` for global defaults; avoid reintroducing component-specific
  stylesheets without a clear need.
- Preserve the responsive layout, semantic landmarks, associated form labels,
  skip link, keyboard focus visibility, screen-reader status announcements,
  sufficient color contrast, and reduced-motion support.
- Keep IndexedDB behavior in `SavedStopsStore.ts`. Surface failures visibly;
  do not silently substitute success or discard route data.
- Avoid changing local-storage keys or IndexedDB schema without a deliberate
  migration.
- When changing paste parsing, cover plain multiline text and OCR text as well
  as the numbered/time-delimited input format.
- Keep TypeScript strict and avoid unnecessary casts.

## Commands

```sh
npm run dev
npm run build
npm run lint
npm run preview
```

There are currently no test files in the repository. Run the focused available
validation for each change; `npm run build` checks TypeScript and bundles the
app, while `npm run lint` runs ESLint.
