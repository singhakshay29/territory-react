# Territory — real-time shared grid capture (React edition)

A 30×20 (600-cell) board that any number of people can open at once. Click an
unclaimed or "unshielded" cell to take it in your color; everyone else's
screen updates within milliseconds.

Same backend and real-time design as the vanilla-JS version — this swap is
frontend-only: **React (Vite) in place of plain HTML/CSS/JS.** Everything
under "Tech choices" in the original write-up about the server still holds;
this README focuses on what changed.

## Run it

Two processes: the Socket.IO backend, and the Vite dev server for React.

```bash
# terminal 1 — backend
cd server
npm install
npm start          # http://localhost:3000

# terminal 2 — frontend (dev mode, hot reload)
cd client
npm install
npm run dev         # http://localhost:5173
```

Open `http://localhost:5173` — Vite proxies `/socket.io` to `:3000` (see
`client/vite.config.js`), so the React app talks to the real backend with no
CORS setup needed. Open several tabs/devices to see it multiplayer.

### Production build

```bash
cd client && npm run build     # outputs client/dist
cd ../server && npm start      # now serves client/dist directly on :3000
```

In production there's only one process and one port — Express serves the
built React bundle and handles the WebSocket connections from the same
origin.

## What changed moving to React

**State shape stayed identical, only how it's held changed.** The vanilla
version kept a `Map<index, ownerData>` and imperatively poked the DOM
(`d.style.backgroundColor = …`) whenever a `cellUpdate` arrived. The React
version keeps the same data in a `grid` array in state
(`client/src/hooks/useGame.js`) and lets React reconcile the DOM instead.

**One socket connection, created once, outside the React lifecycle.** The
socket lives as a module-level singleton in `useGame.js`, not inside a
component. Two reasons: it needs to survive `<StrictMode>`'s deliberate
double-invoke of effects in dev without opening two connections, and there's
only ever one board to be connected to, so a singleton is simpler than
threading a socket through context for no benefit.

**Per-cell memoization keeps 600-cell updates cheap.** Every claim causes
exactly one cell's data to change, but naively re-rendering the app on every
`cellUpdate` would re-diff all 600 `<Cell>`s. Instead, `grid` is updated
immutably by index — `next[index] = newCellData; return next` — so every
*other* index keeps its existing object reference. Each `<Cell>` is wrapped
in `React.memo` with a custom comparator over `(cell, mine, flash)`; cells
whose props are reference-equal to last render bail out of re-rendering
entirely. In practice, a claim only ever re-renders the one cell that
changed.

**Animation stays intentionally imperative.** The capture pulse and the
expanding "ripple" are triggered from React (a `useEffect` watching the
latest server-confirmed update) but the ripple SVG circle itself is created
and appended directly to the DOM via a ref, the same way the vanilla version
did it. High-frequency, purely-visual, fire-and-forget animation is a case
where reaching for `useState` + conditional JSX per frame would be slower
and not any clearer than a five-line imperative helper — so I kept it
imperative rather than forcing it into idiomatic-React for its own sake.

**Zoom/pan and the cooldown ring are local component state.** They don't
need to be shared with anything else, so they live in `Board.jsx` and
`CooldownRing.jsx` respectively rather than in the shared `useGame` hook.

## File map

```
server/
  server.js          same authoritative game server as before
client/
  vite.config.js     dev-only proxy of /socket.io → :3000
  src/
    hooks/useGame.js  socket lifecycle + all shared game state
    components/
      NameGate.jsx     callsign entry screen
      Topbar.jsx        brand, live online/claimed stats, identity badge
      Board.jsx         grid rendering, zoom/pan, ripple + flash effects
      Cell.jsx           memoized single cell
      CooldownRing.jsx   countdown ring, driven by claim acks
      Sidebar.jsx         leaderboard + activity feed
      Toast.jsx           transient notifications
    styles.css          unchanged from the vanilla version
```

## Rules, protocol, and scaling notes

Unchanged from the vanilla edition — 1.2s claim cooldown, 4s immunity window
on freshly claimed cells, persistent client-generated identity in
`localStorage` so refreshing doesn't orphan your cells, and the same
`join` / `claim` / `cellUpdate` / `leaderboard` / `presence` / `activity`
event contract. See the code comments in `server/server.js` for the full
reasoning — none of that needed to change for the frontend swap, which is
exactly the point of keeping the real-time/backend logic decoupled from how
it's rendered.
