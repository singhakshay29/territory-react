## Production Deployment

The project is deployed as two separate services:

- **Frontend:** Vercel (React + Vite)
- **Backend:** Render (Express + Socket.IO)

### Backend (Render)

```bash
cd server
npm install
npm start
```

Set the following environment variables:

```env
CLIENT_URL=https://your-frontend.vercel.app
PORT=10000
```

> Render automatically provides `PORT`, so you don't need to hardcode it.

### Frontend (Vercel)

Create a `.env.production` file:

```env
VITE_API_URL=https://territory-react.onrender.com/
```

Build locally if needed:

```bash
cd client
npm install
npm run build
```

Deploy the `client` folder to Vercel.

The React app connects directly to the Socket.IO backend using:

```js
const socket = io(import.meta.env.VITE_API_URL);
```