# One Good Day

[One Good Day](https://onegoodday.work/) is a free, account-free daily priority planner. It keeps the day focused on one meaningful outcome, a short list of commitments, and optional work instead of turning the day into an hourly schedule.

## Features

- **One Thing** — choose the outcome that would make today a win and break it into smaller steps.
- **Shoulds and Coulds** — separate commitments from optional tasks, add substeps, and set task priority.
- **Jot down mode** — use a simple checklist when a structured plan is more than you need.
- **Focus mode** — start any task in a distraction-light view with an adjustable timer and step list.
- **Daily rollover** — begin each day with a clean planner and choose whether to carry unfinished work forward.
- **Week view and reflections** — review the current week's plans and keep a short record of how each day went.
- **Brainstorm canvas** — build connected idea maps, organise nodes as ideas, questions, or tasks, and send selected nodes to the planner.
- **Sharing and export** — transfer today's plan with a QR code, share a brainstorm by link, and export boards as SVG, PNG, PDF, or Markdown.
- **Personalisation** — choose a colour theme and turn interface sounds on or off.
- **Local-first use** — no account is required; planner data and brainstorms are stored in the browser.

## Using the app

### Plan today

1. Write the day's main outcome under **The One Thing**.
2. Add steps beneath it, then enter necessary work under **Shoulds** and optional work under **Coulds**.
3. Use a task's priority control to cycle its priority, or add nested steps when it needs breaking down.
4. Check items off as they are completed. Completed items move out of the way, and completing the One Thing triggers a small celebration.

Use the list-style control near the page title to switch to **Jot down**. If the structured planner already contains work, the app can copy those items into the simple list.

### Focus on a task

Select **Start** on the One Thing or the play button beside another task. Focus mode shows only that task, its steps, and a timer. Adjust the duration with the dial or controls, start or pause it, and close the overlay at any time; a compact timer remains available while it is running.

### Review and continue work

- Select the date at the top of the planner to open **This week**.
- Use **Reflect** to save a note about the day; open **Reflections** to see past entries.
- On a new day, use the unfinished-work panel to bring individual tasks into today's plan or dismiss them.
- Use the reset button to clear the current view. Resetting structured mode also removes today's planner snapshot and rollover queue.

### Brainstorm

1. Open **Brainstorm** from the planner and enter a central node.
2. Select a node, type in the bottom field, and press <kbd>Enter</kbd> to add a linked child idea.
3. Drag nodes to arrange them; pan or zoom the canvas, collapse branches, and use the overview map to navigate larger boards.
4. Classify a selected node as an idea, question, or task. A task node can also be marked complete.
5. Send the selected node to the planner as the One Thing, a Should, or a Could. Its direct children become task steps.

The board toolbar manages multiple brainstorms, search, themes, reset, share links, and downloads. Undo and redo use the standard <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Z</kbd> shortcuts.

### Move or share data

- **Send to phone** creates a QR code for today's plan. Scan it on another device and confirm the import; importing replaces that browser's current plan.
- A brainstorm share link contains a snapshot of the board. Anyone with the link can read that snapshot.
- Data is not automatically synced. Clearing site data or using a private browsing session can remove locally saved work.

## Technical overview

### Stack

- TypeScript, React 19, and TanStack Start/Router
- Vite 7 for development and production builds
- Tailwind CSS 4 and Radix UI primitives for styling and accessible interface controls
- Framer Motion for interface transitions and Canvas Confetti for completion feedback
- Tiptap for the One Thing editor
- Vitest for unit tests and ESLint/Prettier for code quality
- Vercel deployment through a server adapter; a Cloudflare Workers configuration is also included

### How the pieces connect

- **Routing and rendering:** file-based routes in `src/routes` connect the daily planner, brainstorm canvas, reflection timeline, transfer receiver, guides, and design diary. TanStack Start produces the client and server bundles.
- **Planner state:** React hooks own the active UI state and debounce changes into browser storage. The planner writes to both `localStorage` and IndexedDB, keeps current-week snapshots, detects a date change, archives the previous day, and queues unfinished tasks for rollover.
- **Brainstorm state:** a browser-local library stores multiple boards. Graph helpers model parent/child relationships, layout helpers place nodes, and a canvas view layer handles dragging, panning, zooming, filtering, and the overview map. Per-board history powers undo and redo.
- **Planner bridge:** selecting a brainstorm node can update the One Thing, Shoulds, or Coulds. Direct child nodes are converted into the destination task's steps, with confirmation before replacing an existing One Thing.
- **Device transfer and sharing:** planner transfer data is Base64URL-encoded into the URL fragment used by the QR code, so the payload is not sent to the server. Brainstorm share links similarly encode a portable snapshot in the URL. Treat either link as containing the data it displays.
- **Exports:** brainstorm exports are generated in the browser. The graph is rendered to SVG and converted as needed for PNG or PDF; Markdown export preserves the idea hierarchy as text.
- **Themes and feedback:** CSS custom properties drive the visual themes. Sound, motion, confetti, and theme preferences are coordinated by small browser-side utilities.

There is no application database, authentication service, or required runtime API key.

## Run it yourself

The hosted app is available at **[onegoodday.work](https://onegoodday.work/)**. To run the repository locally, install [Node.js](https://nodejs.org/) 20.19 or newer and npm.

```bash
git clone <repository-url>
cd one-good-day-planner
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). No `.env` file or external service is required.

### Useful commands

```bash
npm run dev        # start the development server
npm test           # run the Vitest suite once
npm run lint       # run ESLint
npm run build      # create a production build
npm run preview    # serve the production build locally
npm run format     # format the repository with Prettier
```

For a production-like local check, run `npm run build` followed by `npm run preview`. The committed `vercel.json` builds the same app for Vercel and routes requests through the TanStack Start server handler.
