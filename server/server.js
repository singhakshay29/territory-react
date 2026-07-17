/**
 * TERRITORY — real-time shared grid capture game
 * -------------------------------------------------
 * Server is the single source of truth for grid state. All writes
 * (claims) are validated and applied here, then broadcast to every
 * connected client. Because Node processes socket events one at a
 * time on a single thread, two "simultaneous" claims on the same
 * cell are never actually concurrent from the server's point of
 * view — they're serialized, and whichever arrives first wins.
 * That's the whole conflict-resolution story: no locks needed,
 * just a single authoritative process making decisions in order.
 */

const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

// ---- Grid configuration ------------------------------------------------
const COLS = 30;
const ROWS = 20;
const CELL_COUNT = COLS * ROWS;

// ---- Game rules ---------------------------------------------------------
const CLAIM_COOLDOWN_MS = 1200; // how often a player may claim a cell
const IMMUNITY_MS = 4000; // a freshly-claimed cell resists recapture briefly
const LEADERBOARD_SIZE = 8;

// A curated, high-contrast palette so player colors are always readable
// against the dark board and distinguishable from one another.
const PALETTE = [
  '#f59e0b', '#fb7185', '#a78bfa', '#34d399',
  '#38bdf8', '#fb923c', '#f472b6', '#a3e635',
  '#22d3ee', '#facc15', '#c084fc', '#4ade80',
  '#f87171', '#60a5fa', '#e879f9', '#2dd4bf',
];

const ADJECTIVES = ['Swift', 'Quiet', 'Bold', 'Lucky', 'Sly', 'Bright', 'Iron', 'Solar', 'Rogue', 'Calm'];
const NOUNS = ['Fox', 'Hawk', 'Wolf', 'Otter', 'Lynx', 'Falcon', 'Bear', 'Raven', 'Viper', 'Comet'];

function randomName() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${a}${n}${Math.floor(Math.random() * 90 + 10)}`;
}

function sanitizeName(raw) {
  if (typeof raw !== 'string') return randomName();
  const cleaned = raw.replace(/[^\w \-']/g, '').trim().slice(0, 16);
  return cleaned.length ? cleaned : randomName();
}

// ---- State ---------------------------------------------------------------
// Grid cells reference a persistent profile id, NOT a socket id, so
// ownership survives reconnects/refreshes.
const grid = new Array(CELL_COUNT).fill(null).map(() => ({
  owner: null,      // profile id
  claimedAt: 0,
}));

// profileId -> { id, name, color, count, lastClaim, online }
const profiles = new Map();
// socket.id -> profileId
const socketToProfile = new Map();

let usedColors = new Set();

function assignColor() {
  const free = PALETTE.filter((c) => !usedColors.has(c));
  const color = free.length
    ? free[Math.floor(Math.random() * free.length)]
    : PALETTE[Math.floor(Math.random() * PALETTE.length)];
  usedColors.add(color);
  return color;
}

function getOrCreateProfile(id, name) {
  let profile = profiles.get(id);
  if (profile) {
    if (name) profile.name = sanitizeName(name);
    return profile;
  }
  profile = {
    id,
    name: sanitizeName(name),
    color: assignColor(),
    count: 0,
    lastClaim: 0,
    online: false,
  };
  profiles.set(id, profile);
  return profile;
}

function serializeGrid() {
  // Compact array form: [ownerId|null, claimedAt] per cell.
  return grid.map((c) => (c.owner ? [c.owner, c.claimedAt] : null));
}

function publicProfile(p) {
  return { id: p.id, name: p.name, color: p.color, count: p.count, online: p.online };
}

function leaderboard() {
  return [...profiles.values()]
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, LEADERBOARD_SIZE)
    .map(publicProfile);
}

function onlineCount() {
  let n = 0;
  for (const p of profiles.values()) if (p.online) n += 1;
  return n;
}

function stats() {
  const claimed = grid.reduce((n, c) => n + (c.owner ? 1 : 0), 0);
  return { claimed, total: CELL_COUNT, online: onlineCount() };
}

// ---- Server setup ----------------------------------------------------------
const app = express();
// Production: serve the built React app (client/dist).
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/socket.io')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  // In dev, the React app runs on Vite's own port (5173) and talks to
  // this server over a different origin, so CORS needs to allow it.
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  socket.on('join', (payload, cb) => {
    try {
      const clientId = payload && typeof payload.id === 'string' && payload.id.length <= 64
        ? payload.id
        : null;
      const id = clientId || `p_${socket.id}`;
      const profile = getOrCreateProfile(id, payload && payload.name);
      profile.online = true;

      socketToProfile.set(socket.id, id);

      cb({
        ok: true,
        you: publicProfile(profile),
        grid: serializeGrid(),
        profiles: [...profiles.values()].map(publicProfile),
        leaderboard: leaderboard(),
        stats: stats(),
        rules: { cooldownMs: CLAIM_COOLDOWN_MS, immunityMs: IMMUNITY_MS, cols: COLS, rows: ROWS },
      });

      io.emit('presence', { stats: stats() });
      socket.broadcast.emit('activity', { text: `${profile.name} joined`, color: profile.color });
    } catch (err) {
      cb({ ok: false, reason: 'server_error' });
    }
  });

  socket.on('claim', (payload, cb) => {
    if (typeof cb !== 'function') return;
    const profileId = socketToProfile.get(socket.id);
    if (!profileId) return cb({ ok: false, reason: 'not_joined' });
    const profile = profiles.get(profileId);
    if (!profile) return cb({ ok: false, reason: 'not_joined' });

    const index = Number(payload && payload.index);
    if (!Number.isInteger(index) || index < 0 || index >= CELL_COUNT) {
      return cb({ ok: false, reason: 'bad_index' });
    }

    const now = Date.now();
    const sinceLast = now - profile.lastClaim;
    if (sinceLast < CLAIM_COOLDOWN_MS) {
      return cb({ ok: false, reason: 'cooldown', retryAfter: CLAIM_COOLDOWN_MS - sinceLast });
    }

    const cell = grid[index];

    if (cell.owner === profile.id) {
      return cb({ ok: false, reason: 'already_yours' });
    }

    if (cell.owner) {
      const heldFor = now - cell.claimedAt;
      if (heldFor < IMMUNITY_MS) {
        return cb({ ok: false, reason: 'immune', retryAfter: IMMUNITY_MS - heldFor });
      }
      const prevOwner = profiles.get(cell.owner);
      if (prevOwner) prevOwner.count = Math.max(0, prevOwner.count - 1);
    }

    cell.owner = profile.id;
    cell.claimedAt = now;
    profile.lastClaim = now;
    profile.count += 1;

    const update = {
      index,
      owner: profile.id,
      name: profile.name,
      color: profile.color,
      claimedAt: now,
    };

    io.emit('cellUpdate', update);
    io.emit('leaderboard', leaderboard());
    io.emit('presence', { stats: stats() });

    cb({ ok: true, cooldownMs: CLAIM_COOLDOWN_MS });
  });

  socket.on('disconnect', () => {
    const profileId = socketToProfile.get(socket.id);
    socketToProfile.delete(socket.id);
    if (!profileId) return;

    // Only mark offline if no other socket for this profile remains
    // (guards against duplicate tabs briefly overlapping).
    const stillConnected = [...socketToProfile.values()].includes(profileId);
    if (!stillConnected) {
      const profile = profiles.get(profileId);
      if (profile) {
        profile.online = false;
        io.emit('presence', { stats: stats() });
        socket.broadcast.emit('activity', { text: `${profile.name} left`, color: profile.color });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Territory server listening on http://localhost:${PORT}`);
});
