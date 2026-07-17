# Territory – Real-Time Multiplayer Grid Capture

Territory is a real-time multiplayer web application where players compete to claim cells on a shared 30×20 grid (600 cells). Every connected player sees updates instantly as cells are captured, making the board a live collaborative battlefield.

The application is built with **React**, **Node.js**, **Express**, and **Socket.IO**, with the server acting as the single source of truth for all game state.

---

## Features

- 🎮 Real-time multiplayer gameplay using Socket.IO
- ⚡ Instant synchronization across all connected clients
- 🟩 30 × 20 interactive grid (600 cells)
- 👤 Persistent player identity using Local Storage
- 🛡️ Cell immunity after capture to prevent instant recaptures
- ⏱️ Claim cooldown with animated circular progress indicator
- 📊 Live leaderboard
- 📢 Real-time activity feed
- 🔍 Smooth zoom & pan controls
- ✨ Ripple and capture animations
- ⚛️ Optimized rendering using `React.memo` so only affected cells re-render
- 📱 Responsive UI built with Tailwind CSS

---

## Tech Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- Socket.IO Client

### Backend

- Node.js
- Express.js
- Socket.IO

### Deployment

- Frontend – Vercel
- Backend – Render

---

## Local Setup

Clone the repository:

```bash
git clone <repository-url>
cd territory
```

### Install dependencies

Backend

```bash
cd server
npm install
```

Frontend

```bash
cd client
npm install
```

---

## Run the project

Start the backend

```bash
cd server
npm start
```

Runs on:

```
http://localhost:3000
```

Start the frontend

```bash
cd client
npm run dev
```

Runs on:

```
http://localhost:5173
```

Open multiple browser tabs or devices to experience real-time multiplayer.

---

## Production Deployment

### Backend (Render)

Deploy the **server** folder as a Render Web Service.

Start Command

```bash
npm start
```

Environment Variables

```env
CLIENT_URL=https://your-vercel-app.vercel.app
```

> Render automatically assigns the `PORT` environment variable.

---

### Frontend (Vercel)

Deploy the **client** folder as a Vite application.

Environment Variable

```env
VITE_API_URL=https://territory-react.onrender.com
```

The application connects to the backend using:

```js
const socket = io(import.meta.env.VITE_API_URL);
```

---

## Project Structure

```text
server/
  server.js
  package.json

client/
  src/
    components/
    hooks/
    App.jsx
  public/
  vite.config.js
```

---

## Real-Time Architecture

- The Express server maintains the authoritative game state.
- Clients communicate through Socket.IO.
- Every successful claim broadcasts updates to all connected players.
- React updates only the modified cell using `React.memo`, minimizing unnecessary re-renders.
- Player identity is preserved using `localStorage`, allowing refreshes without losing ownership.

---

## Future Improvements

- Redis adapter for horizontal Socket.IO scaling
- MongoDB/PostgreSQL persistence
- User authentication
- Rooms/private game sessions
- Spectator mode
- Match history & analytics
