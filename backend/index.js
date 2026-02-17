import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import path from 'node:path';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

import cors from "cors";
const app = express();

app.use(cors({
  origin: "*",
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());

// Routes
app.use('/api/users', userRoutes);

// serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Session API endpoints
app.post('/api/sessions', (req, res) => {
  const { roomId, sessionName } = req.body;
  if (!roomId || !sessionName) {
    return res.status(400).json({ error: 'roomId and sessionName required' });
  }

  sessionStore[roomId] = {
    roomId,
    sessionName,
    code: '',
    language: 'javascript',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  res.json({ success: true, session: sessionStore[roomId] });
});

app.get('/api/sessions/:roomId', (req, res) => {
  const { roomId } = req.params;
  const session = sessionStore[roomId];

  if (!session) {
    return res.json({ success: false, message: 'Session not found' });
  }

  res.json(session);
});

app.get('/api/sessions', (req, res) => {
  const sessions = Object.values(sessionStore).map(s => ({
    roomId: s.roomId,
    sessionName: s.sessionName,
    createdAt: s.createdAt,
    lastUpdated: s.lastUpdated,
  }));
  res.json(sessions);
});

app.put('/api/sessions/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { code, language } = req.body;

  if (!sessionStore[roomId]) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (code !== undefined) sessionStore[roomId].code = code;
  if (language !== undefined) sessionStore[roomId].language = language;
  sessionStore[roomId].lastUpdated = new Date().toISOString();

  res.json({ success: true, session: sessionStore[roomId] });
});

const userSocketMap = {};
const cursorMap = {};
const sessionStore = {};

const palette = [
  "#F87171",
  "#FBBF24",
  "#34D399",
  "#60A5FA",
  "#A78BFA",
  "#F472B6",
  "#22D3EE",
  "#F97316",
];

const pickColor = (socketId) => {
  let hash = 0;
  for (let i = 0; i < socketId.length; i += 1) {
    hash = (hash << 5) - hash + socketId.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
};

const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId]?.username,
        color: userSocketMap[socketId]?.color,
      }
    }
  ) //
}

//connection is instatiated to be 



//fixed
io.on("connection", (socket) => {
  console.log(`user connected : ${socket.id}`);

  socket.on("join", ({ roomId, username }) => {
    userSocketMap[socket.id] = {
      username,
      color: pickColor(socket.id),
    };
    socket.join(roomId);

    const clients = getAllConnectedClients(roomId);
    console.log(clients)
    console.log(roomId)

    // broadcast to everyone in room
    io.to(roomId).emit("joined", {
      clients,
      username,
      socketId: socket.id,
    });
  });

  socket.on("disconnecting", () => {
    const username = userSocketMap[socket.id]?.username;
    const color = userSocketMap[socket.id]?.color;

    // remove user BEFORE recalculating clients
    delete userSocketMap[socket.id];
    delete cursorMap[socket.id];

    socket.rooms.forEach((roomId) => {
      if (roomId === socket.id) return;

      const clients = getAllConnectedClients(roomId);

      io.to(roomId).emit("disconnected", {
        socketId: socket.id,
        username,
        clients,
        color,
      });

      io.to(roomId).emit("cursor-removed", {
        socketId: socket.id,
      });
    });
  });

  socket.on("disconnect", () => {
    console.log(`user disconnected : ${socket.id}`);
  });


  //code sync logic
  socket.on("code-change", ({ roomId, code }) => {
    // console.log("code recieve dfrom" , roomId);
    // console.log("code length ", code.length)
    socket.to(roomId).emit("code-changed", { code });

    // Persist to session if exists
    if (sessionStore[roomId]) {
      sessionStore[roomId].code = code;
      sessionStore[roomId].lastUpdated = new Date().toISOString();
    }
  })

  // here i listend to the new joinee and sending the code to him
  socket.on("sync-state", ({ code, language, socketId }) => {
    io.to(socketId).emit("sync-state", { code, language });
  })

  socket.on("language-change", ({ roomId, language }) => {
    socket.to(roomId).emit("language-changed", { language });

    // Persist to session if exists
    if (sessionStore[roomId]) {
      sessionStore[roomId].language = language;
      sessionStore[roomId].lastUpdated = new Date().toISOString();
    }
  });

  socket.on("chat-message", ({ roomId, message, username, timestamp, color }) => {
    io.to(roomId).emit("chat-message", { message, username, timestamp, color });
  });

  socket.on("cursor-change", ({ roomId, cursor, username, color }) => {
    cursorMap[socket.id] = { cursor, username, color };
    socket.to(roomId).emit("cursor-change", {
      socketId: socket.id,
      cursor,
      username,
      color,
    });
  });


});



// Fallback for unknown routes - helpful for users accessing backend port by mistake
app.use((req, res) => {
  res.status(404).send(`
    <h1>404 - Not Found</h1>
    <p>You are accessing the Backend Server (Port ${process.env.PORT || 3000}).</p>
    <p>Please access the Frontend Application at: <a href="http://localhost:5173">http://localhost:5173</a> or the port shown in your terminal.</p>
  `);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`server is running at port : ${PORT}`);
});
