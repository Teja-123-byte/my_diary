require('dotenv').config();   

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

// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// ================= FILE UPLOAD =================
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// serve files
app.use('/uploads', express.static(uploadDir));

// upload route
app.post('/upload', upload.single('file'), (req, res) => {
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const { roomId, username } = req.body;

  io.to(roomId).emit('file-shared', {
    username,
    fileName: req.file.originalname,
    fileUrl,
    timestamp: Date.now()
  });

  res.json({ fileUrl });
});

// ================= DATABASE =================
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studytogether')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const TaskSchema = new mongoose.Schema({
  userId: String,
  roomId: String,
  title: String,
  deadline: Date,
  completed: { type: Boolean, default: false }
});

const Task = mongoose.model('Task', TaskSchema);

// ================= ROOMS =================
const rooms = new Map();
const userRooms = new Map();

// ================= SOCKET LOGIC =================
io.on('connection', (socket) => {
  console.log('User:', socket.id);

  // create room
  socket.on('create-room', ({ username }) => {
    const roomId = uuidv4().slice(0, 8);
    rooms.set(roomId, { users: new Map() });
    socket.emit('room-created', { roomId });
  });

  // join room
  socket.on('join-room', ({ roomId, username }) => {
    if (!rooms.has(roomId)) return;

    socket.join(roomId);
    userRooms.set(socket.id, roomId);
    rooms.get(roomId).users.set(socket.id, username);

    io.to(roomId).emit('user-joined', { username, id: socket.id });
  });

  // chat
  socket.on('chat-message', ({ roomId, message, username }) => {
    io.to(roomId).emit('chat-message', {
      username,
      message,
      time: Date.now()
    });
  });

  // ================= WEBRTC SIGNALING =================
  socket.on('offer', ({ target, offer }) => {
    io.to(target).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ target, answer }) => {
    io.to(target).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ target, candidate }) => {
    io.to(target).emit('ice-candidate', { candidate, from: socket.id });
  });

  // ================= TASKS =================
  socket.on('create-task', async ({ userId, roomId, title, deadline }) => {
    const task = await Task.create({ userId, roomId, title, deadline });

    io.to(roomId).emit('new-task', {
      taskId: task._id,
      title,
      deadline
    });
  });

  // disconnect
  socket.on('disconnect', () => {
    const roomId = userRooms.get(socket.id);
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).users.delete(socket.id);
      io.to(roomId).emit('user-left', socket.id);
    }
    userRooms.delete(socket.id);
  });
});

// ================= CRON (REMINDER) =================
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const overdue = await Task.find({
    completed: false,
    deadline: { $lt: now }
  });

  overdue.forEach(task => {
    io.to(task.userId).emit('task-reminder', {
      title: task.title,
      message: `Task "${task.title}" overdue`
    });
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});