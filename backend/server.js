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

// ====================== CORS SETUP (Important for Vite) ======================
app.use(cors({
  origin: ["http://localhost:8080","http://localhost:5173", "http://localhost:3000", "*"], // Vite default port + others
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:8080","http://localhost:5173", "http://localhost:3000", "*"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json());

// ====================== FILE UPLOAD SETUP ======================
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt|ppt|pptx/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only images, PDFs, and documents are allowed!'));
  }
});

// Serve uploaded files
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

// ====================== IN-MEMORY STORAGE ======================
const rooms = new Map();        // roomId → { users: Map<socketId, username> }
const userRooms = new Map();    // socketId → roomId

// ====================== SOCKET.IO LOGIC ======================
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Create Room
  socket.on('create-room', ({ username }) => {
    const roomId = uuidv4().slice(0, 8);
    rooms.set(roomId, { users: new Map() });
    socket.emit('room-created', { roomId });
    console.log(`📌 Room created: ${roomId} by ${username}`);
  });

  // Join Room
  socket.on('join-room', ({ roomId, username }) => {
    const room = rooms.get(roomId);
    if (!room) {
      return socket.emit('error', { message: 'Room does not exist' });
    }

    socket.join(roomId);
    userRooms.set(socket.id, roomId);
    room.users.set(socket.id, username);

    const usersInRoom = Array.from(room.users.entries()).map(([id, name]) => ({
      socketId: id,
      username: name
    }));

    // Notify others
    io.to(roomId).emit('user-joined', { socketId: socket.id, username });
    // Send current users to new user
    socket.emit('all-users', usersInRoom);

    console.log(`👥 ${username} joined room ${roomId}`);
  });

  // Chat Message
  socket.on('chat-message', ({ roomId, message, username }) => {
    if (!rooms.has(roomId)) return;
    io.to(roomId).emit('chat-message', {
      username,
      message,
      timestamp: Date.now(),
      socketId: socket.id
    });
  });

  // WebRTC Signaling for Video Call
  socket.on('offer', ({ targetSocketId, offer }) => {
    io.to(targetSocketId).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ targetSocketId, answer }) => {
    io.to(targetSocketId).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('ice-candidate', { candidate, from: socket.id });
  });

  // Tasks
  socket.on('create-task', async ({ userId, roomId, title, deadline }) => {
    try {
      const task = new Task({ userId, roomId, title, deadline });
      await task.save();
      io.to(roomId).emit('new-task', {
        taskId: task._id,
        title,
        deadline,
        userId
      });
    } catch (err) {
      console.error("Error creating task:", err);
    }
  });

  socket.on('update-task', async ({ taskId, completed }) => {
    try {
      const task = await Task.findById(taskId);
      if (task) {
        task.completed = completed;
        await task.save();
        io.to(task.userId).emit('task-updated', { taskId, completed });
      }
    } catch (err) {
      console.error("Error updating task:", err);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const roomId = userRooms.get(socket.id);
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      const username = room.users.get(socket.id);

      room.users.delete(socket.id);
      io.to(roomId).emit('user-left', { socketId: socket.id, username });

      if (room.users.size === 0) {
        rooms.delete(roomId);
        console.log(`🗑️ Room ${roomId} deleted (empty)`);
      }
    }
    userRooms.delete(socket.id);
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// ====================== FILE UPLOAD ROUTE ======================
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { roomId, username } = req.body;
  if (!roomId) {
    return res.status(400).json({ message: 'roomId is required' });
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  io.to(roomId).emit('file-shared', {
    username: username || 'Someone',
    fileName: req.file.originalname,
    fileUrl,
    fileType: path.extname(req.file.originalname).toLowerCase(),
    timestamp: Date.now()
  });

  res.json({
    success: true,
    fileUrl,
    fileName: req.file.originalname
  });
});

// ====================== TASK REMINDER (Every Minute) ======================
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const overdueTasks = await Task.find({
    completed: false,
    deadline: { $lt: now }
  });

  for (const task of overdueTasks) {
    io.to(task.userId).emit('task-reminder', {
      taskId: task._id,
      title: task.title,
      message: `⏰ Your task "${task.title}" is overdue!`
    });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 StudyTogether Backend running on http://localhost:${PORT}`);
  console.log(`✅ CORS allowed for http://localhost:5173`);
});