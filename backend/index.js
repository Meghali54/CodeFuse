import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import path from "node:path";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import oauthRoutes from "./routes/oAuthRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: "*",
  }),
);

app.use(cookieParser())
app.use(express.json({ limit: '16kb' }))
app.use(express.urlencoded({ extended: true, limit: '16kb' }))
app.use(express.static('public'))

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

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
app.use("/api/users", userRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/ai", aiRoutes);

// serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Session API endpoints
app.post("/api/sessions", (req, res) => {
  const { roomId, sessionName } = req.body;
  if (!roomId || !sessionName) {
    return res.status(400).json({ error: "roomId and sessionName required" });
  }

  sessionStore[roomId] = {
    roomId,
    sessionName,
    files: [
      {
        id: 'default',
        name: 'main.js',
        code: '// Write your code here',
        language: 'javascript'
      }
    ],
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  res.json({ success: true, session: sessionStore[roomId] });
});

app.get("/api/sessions/:roomId", (req, res) => {
  const { roomId } = req.params;
  const session = sessionStore[roomId];

  if (!session) {
    return res.json({ success: false, message: "Session not found" });
  }

  res.json(session);
});

app.get("/api/sessions", (req, res) => {
  const sessions = Object.values(sessionStore).map((s) => ({
    roomId: s.roomId,
    sessionName: s.sessionName,
    createdAt: s.createdAt,
    lastUpdated: s.lastUpdated,
  }));
  res.json(sessions);
});

app.put("/api/sessions/:roomId", (req, res) => {
  const { roomId } = req.params;
  const { files } = req.body;

  if (!sessionStore[roomId]) {
    return res.status(404).json({ error: "Session not found" });
  }

  if (files !== undefined) sessionStore[roomId].files = files;
  sessionStore[roomId].lastUpdated = new Date().toISOString();

  res.json({ success: true, session: sessionStore[roomId] });
});

const userSocketMap = {};
const cursorMap = {};
const sessionStore = {};
const roomAccessControl = {}; // Access control Storage
const roomAdmins = {};
const pendingRequests = {};

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
      };
    },
  ); //
};

//connection is instatiated to be

//fixed
io.on("connection", (socket) => {
  console.log(`user connected : ${socket.id}`);

  socket.on("request-join", ({ roomId, username }) => {
    userSocketMap[socket.id] = {
      username,
      color: pickColor(socket.id),
    };

    // If room does not exist → create and make this user admin
    if (!roomAccessControl[roomId]) {
      roomAccessControl[roomId] = {
        adminSocketId: socket.id,
        participants: new Set(),
        pending: new Map(),
      };

      roomAccessControl[roomId].participants.add(socket.id);
      socket.join(roomId);

      io.to(socket.id).emit("join-approved", { isAdmin: true });
      return;
    }

    const room = roomAccessControl[roomId];

    // If admin reconnects
    if (socket.id === room.adminSocketId) {
      room.participants.add(socket.id);
      socket.join(roomId);
      io.to(socket.id).emit("join-approved", { isAdmin: true });
      return;
    }

    // Add to pending list
    room.pending.set(socket.id, username);

    // Notify admin
    io.to(room.adminSocketId).emit("join-request", {
      username,
      socketId: socket.id,
    });

    // Tell user to wait
    io.to(socket.id).emit("waiting-for-approval");
  });

  socket.on("approve-user", ({ roomId, socketId }) => {
    const room = roomAccessControl[roomId];
    if (!room) return;

    if (socket.id !== room.adminSocketId) return; // only admin allowed

    room.pending.delete(socketId);
    room.participants.add(socketId);

    io.sockets.sockets.get(socketId)?.join(roomId);

    io.to(socketId).emit("join-approved", { isAdmin: false });

    const clients = getAllConnectedClients(roomId);

    io.to(roomId).emit("joined", {
      clients,
      username: userSocketMap[socketId]?.username,
      socketId,
    });
  });


  socket.on("deny-user", ({ roomId, socketId }) => {
    const room = roomAccessControl[roomId];
    if (!room) return;

    if (socket.id !== room.adminSocketId) return;

    room.pending.delete(socketId);

    io.to(socketId).emit("join-denied");
  });

  socket.on("remove-user", ({ roomId, socketId }) => {
    const room = roomAccessControl[roomId];
    if (!room) return;

    if (socket.id !== room.adminSocketId) return;

    // Remove from participants
    room.participants.delete(socketId);

    // Force leave room
    io.sockets.sockets.get(socketId)?.leave(roomId);

    // Notify removed user
    io.to(socketId).emit("removed-by-admin");
    const clients = getAllConnectedClients(roomId);

    io.to(roomId).emit("disconnected", {
      socketId,
      username: userSocketMap[socketId]?.username,
      clients,
      color: userSocketMap[socketId]?.color,
    });
  });


  socket.on("disconnecting", () => {
    const username = userSocketMap[socket.id]?.username;
    const color = userSocketMap[socket.id]?.color;

    // CLEAN ACCESS CONTROL FIRST
    for (const roomId in roomAccessControl) {
      const room = roomAccessControl[roomId];

      // If admin leaves → destroy room completely
      if (room.adminSocketId === socket.id) {
        io.to(roomId).emit("room-closed", {
          message: "Admin left. Room closed.",
        });

        delete roomAccessControl[roomId];
        continue;
      }

      // Remove from participants
      room.participants.delete(socket.id);

      // Remove from pending
      room.pending.delete(socket.id);
    }

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

  // Code Sync - Updated for files
  socket.on("file-change", ({ roomId, fileId, code }) => {
    socket.to(roomId).emit("file-changed", { fileId, code });

    if (sessionStore[roomId]) {
      const fileIndex = sessionStore[roomId].files.findIndex(f => f.id === fileId);
      if (fileIndex !== -1) {
        sessionStore[roomId].files[fileIndex].code = code;
        sessionStore[roomId].lastUpdated = new Date().toISOString();
      }
    }
  });

  socket.on("sync-state", ({ files, activeFile, socketId }) => {
    io.to(socketId).emit("files-synced", { files, activeFile });
  });

  socket.on("file-create", ({ roomId, file }) => {
    socket.to(roomId).emit("file-created", { file });

    if (sessionStore[roomId]) {
      sessionStore[roomId].files.push(file);
      sessionStore[roomId].lastUpdated = new Date().toISOString();
    }
  });

  socket.on("file-delete", ({ roomId, fileId }) => {
    socket.to(roomId).emit("file-deleted", { fileId });

    if (sessionStore[roomId]) {
      sessionStore[roomId].files = sessionStore[roomId].files.filter(f => f.id !== fileId);
      sessionStore[roomId].lastUpdated = new Date().toISOString();
    }
  });

  socket.on("file-rename", ({ roomId, fileId, newName }) => {
    socket.to(roomId).emit("file-renamed", { fileId, newName });

    if (sessionStore[roomId]) {
      const fileIndex = sessionStore[roomId].files.findIndex(f => f.id === fileId);
      if (fileIndex !== -1) {
        sessionStore[roomId].files[fileIndex].name = newName;
        sessionStore[roomId].lastUpdated = new Date().toISOString();
      }
    }
  });

  socket.on(
    "chat-message",
    ({ roomId, message, username, timestamp, color }) => {
      io.to(roomId).emit("chat-message", {
        message,
        username,
        timestamp,
        color,
      });
    },
  );

  socket.on("cursor-change", ({ roomId, cursor, username, color, fileId }) => {
    cursorMap[socket.id] = { cursor, username, color, fileId };

    socket.to(roomId).emit("cursor-change", {
      socketId: socket.id,
      cursor,
      username,
      color,
      fileId,
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
