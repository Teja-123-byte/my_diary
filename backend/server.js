const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000", "*"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json());

// ====================== FILE UPLOAD ======================
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt|ppt|pptx/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) return cb(null, true);
    cb(new Error('Only images, PDFs, and documents are allowed!'));
  }
});

app.use('/uploads', express.static(uploadDir));

// ====================== DATABASE ======================
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studytogether')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

const TaskSchema = new mongoose.Schema({
  userId: String,
  roomId: String,
  title: String,
  deadline: Date,
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Task = mongoose.model('Task', TaskSchema);

// ====================== IN-MEMORY ======================
const rooms = new Map();     // roomId → Map<socketId, username>
const userRooms = new Map(); // socketId → roomId

// ====================== SOCKET.IO ======================
io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  // ── Create Room (from chat/dashboard) ──
  socket.on('create-room', ({ username }) => {
    const roomId = uuidv4().slice(0, 8);
    rooms.set(roomId, new Map());
    socket.emit('room-created', { roomId });
    console.log(`📌 Room created: ${roomId} by ${username}`);
  });

  // ── Join Room ──
  socket.on('join-room', ({ roomId, username }) => {
    // ✅ Auto-create room if it doesn't exist yet
    // This handles the case where user types a room ID directly
    // without going through create-room first
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
      console.log(`📌 Room auto-created: ${roomId}`);
    }

    const room = rooms.get(roomId);

    socket.join(roomId);
    userRooms.set(socket.id, roomId);

    // ✅ Build existing users list BEFORE adding the new joiner
    const existingUsers = Array.from(room.entries()).map(([id, name]) => ({
      socketId: id,
      username: name,
    }));

    console.log(`📋 Room ${roomId} existing users:`, existingUsers.map(u => u.username));

    // ✅ Send existing users to NEW joiner only (they send offers to each)
    socket.emit('all-users', existingUsers);

    // ✅ Tell EXISTING users someone new joined (socket.to = everyone except sender)
    socket.to(roomId).emit('user-joined', { socketId: socket.id, username });

    // ✅ Now add new user to room
    room.set(socket.id, username);

    console.log(`👥 ${username} (${socket.id}) joined room ${roomId} | Total: ${room.size}`);
  });

  // ── Chat ──
  socket.on('chat-message', ({ roomId, message, username }) => {
    if (!rooms.has(roomId)) return;
    io.to(roomId).emit('chat-message', {
      username, message, timestamp: Date.now(), socketId: socket.id
    });
  });

  // ── WebRTC Signaling ──
  socket.on('offer', ({ targetSocketId, offer, username }) => {
    console.log(`📡 offer: ${socket.id} → ${targetSocketId}`);
    io.to(targetSocketId).emit('offer', {
      from: socket.id,
      offer,
      username: username || getUsernameFor(socket.id),
    });
  });

  socket.on('answer', ({ targetSocketId, answer }) => {
    console.log(`📡 answer: ${socket.id} → ${targetSocketId}`);
    io.to(targetSocketId).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('ice-candidate', { from: socket.id, candidate });
  });

  // ── Tasks ──
  socket.on('create-task', async ({ userId, roomId, title, deadline }) => {
    try {
      const task = new Task({ userId, roomId, title, deadline });
      await task.save();
      io.to(roomId).emit('new-task', { taskId: task._id, title, deadline, userId });
    } catch (err) { console.error("Task error:", err); }
  });

  socket.on('update-task', async ({ taskId, completed }) => {
    try {
      const task = await Task.findById(taskId);
      if (task) {
        task.completed = completed;
        await task.save();
        io.to(task.userId).emit('task-updated', { taskId, completed });
      }
    } catch (err) { console.error("Task update error:", err); }
  });

  // ── Leave ──
  socket.on('leave-room', () => handleLeave(socket));
  socket.on('disconnect', () => {
    handleLeave(socket);
    console.log(`❌ Disconnected: ${socket.id}`);
  });
});

function getUsernameFor(socketId) {
  const roomId = userRooms.get(socketId);
  if (roomId && rooms.has(roomId)) return rooms.get(roomId).get(socketId) || 'Unknown';
  return 'Unknown';
}

function handleLeave(socket) {
  const roomId = userRooms.get(socket.id);
  if (!roomId || !rooms.has(roomId)) return;

  const room = rooms.get(roomId);
  const username = room.get(socket.id) || 'Someone';

  room.delete(socket.id);
  userRooms.delete(socket.id);

  socket.to(roomId).emit('user-left', { socketId: socket.id, username });
  socket.leave(roomId);

  if (room.size === 0) {
    rooms.delete(roomId);
    console.log(`🗑️ Room ${roomId} deleted (empty)`);
  }

  console.log(`🚪 ${username} (${socket.id}) left room ${roomId}`);
}

// ====================== FILE UPLOAD ROUTE ======================
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const { roomId, username } = req.body;
  if (!roomId) return res.status(400).json({ message: 'roomId is required' });

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  io.to(roomId).emit('file-shared', {
    username: username || 'Someone',
    fileName: req.file.originalname,
    fileUrl,
    fileType: path.extname(req.file.originalname).toLowerCase(),
    timestamp: Date.now()
  });

  res.json({ success: true, fileUrl, fileName: req.file.originalname });
});

// ====================== TASK REMINDERS ======================
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const overdue = await Task.find({ completed: false, deadline: { $lt: now } });
  for (const task of overdue) {
    io.to(task.userId).emit('task-reminder', {
      taskId: task._id,
      title: task.title,
      message: `⏰ Your task "${task.title}" is overdue!`
    });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});