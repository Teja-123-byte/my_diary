import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ["websocket", "polling"],   // Important for Vite
});

socket.on("connect", () => {
  console.log("✅ Connected to backend successfully! Socket ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket connection failed:", err.message);
  console.error("Check if backend is running on port 3001");
});

socket.on("disconnect", (reason) => {
  console.log("❌ Socket disconnected. Reason:", reason);
});