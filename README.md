# CodeFusion — Real‑Time Collaborative Code Editor

CodeFusion is a multi‑user, real‑time code editor with live cursors, chat, session sharing, and multi‑language support. It pairs a React + Vite frontend with a Socket.IO + Express backend to deliver instant collaboration.

## Highlights

- **Live collaboration** with real‑time cursors and updates
- **Session links** to invite teammates instantly
- **Multi‑language editor** (JavaScript, Python, Java, C++)
- **Syntax linting** for quick feedback
- **Session management** (save, load, and list sessions)
- **Team chat** inside the editor

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, CodeMirror 6
- **Backend:** Node.js, Express, Socket.IO

## Project Structure

```
Collab-Code-main/
  backend/
    index.js
    package.json
  frontend/
    src/
    public/
    package.json
    .env
```

## Getting Started

### 1) Install Dependencies

**Backend**

```
cd backend
npm install
```

**Frontend**

```
cd ../frontend
npm install
```

### 2) Configure Environment

Create or update [frontend/.env](frontend/.env) and set the backend URL:

```
VITE_BACKEND_URL=http://localhost:3000
```

### 3) Run the App

**Start backend**

```
cd backend
npm start
```

**Start frontend**

```
cd ../frontend
npm run dev
```

Open the app at:

```
http://localhost:5173
```

## Usage

1. Open the app and create a new session.
2. Copy the room link or ID to invite collaborators.
3. Edit together with live cursors and chat.
4. Save sessions to reload code later.

## Scripts

**Frontend** (in [frontend](frontend))

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview build
- `npm run lint` — run ESLint

**Backend** (in [backend](backend))

- `npm start` — start server with nodemon

## Configuration

- **Backend Port:** defaults to `3000` (set `PORT` env var to override)
- **Frontend Port:** Vite default `5173`
- **Socket URL:** set via `VITE_BACKEND_URL` env var

## Environment Variables

**Backend** (create `.env` in `backend/` folder)

```
PORT=3000
MONGO_URI=mongodb://username:password@localhost:27017/codefuse
JWT_SECRET=your_jwt_secret_key

```

**Frontend** (create `.env` in `frontend/` folder)

```
VITE_BACKEND_URL=http://localhost:3000
```

### Render Deployment

For **backend Web Service** on Render:

```
PORT=3000
```

For **frontend Static Site** on Render:

```
VITE_BACKEND_URL=https://your-backend.onrender.com
```

## Troubleshooting

- **Frontend can’t connect to backend**: verify `VITE_BACKEND_URL` and that the backend is running.
- **Port conflict**: change the backend `PORT` and update `VITE_BACKEND_URL`.
- **Socket connection errors**: check CORS settings or firewall rules.

## License

MIT
