import { useEffect, useState, useRef } from "react";
import { socket } from "@/socket";   // Make sure path is correct
import { ArrowLeft, Send, Paperclip } from "lucide-react";

export default function Chat() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("YourName"); // Change later with real auth
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [usersInRoom, setUsersInRoom] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket listeners
  useEffect(() => {
    if (!joined) return;

    socket.on("chat-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user-joined", (data) => {
      setUsersInRoom((prev) => [...prev.filter(u => u.socketId !== data.socketId), data]);
    });

    socket.on("user-left", (data) => {
      setUsersInRoom((prev) => prev.filter(u => u.socketId !== data.socketId));
    });

    socket.on("all-users", (usersList) => {
      setUsersInRoom(usersList);
    });

    socket.on("file-shared", (fileData) => {
      setMessages((prev) => [...prev, { 
        ...fileData, 
        isFile: true 
      }]);
    });

    return () => {
      socket.off("chat-message");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("all-users");
      socket.off("file-shared");
    };
  }, [joined]);

  const joinRoom = () => {
    if (!roomId.trim()) {
      alert("Please enter a Room ID");
      return;
    }

    socket.connect();
    socket.emit("join-room", { roomId: roomId.trim(), username });
    setJoined(true);
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !joined) return;

    socket.emit("chat-message", {
      roomId,
      message: messageInput,
      username
    });

    setMessageInput("");
  };

  const uploadFile = async () => {
    if (!file || !joined) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomId", roomId);
    formData.append("username", username);

    try {
      await fetch("http://localhost:3001/upload", {
        method: "POST",
        body: formData,
      });
      setFile(null);
    } catch (err) {
      console.error("File upload failed", err);
    }
  };

  const leaveRoom = () => {
    socket.emit("leave-room");
    setJoined(false);
    setMessages([]);
    setUsersInRoom([]);
    setRoomId("");
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {!joined ? (
        // Join Room Screen
        <div className="flex h-full items-center justify-center">
          <div className="glass w-full max-w-md rounded-3xl p-8">
            <h1 className="text-3xl font-bold text-center mb-6">Join Study Room</h1>
            
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID (e.g. a0c5f1ec)"
              className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-lg focus:outline-none focus:border-primary mb-4"
            />

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your Name"
              className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-lg focus:outline-none focus:border-primary mb-6"
            />

            <button
              onClick={joinRoom}
              className="w-full rounded-2xl bg-primary py-4 font-bold text-primary-foreground hover:bg-primary/90"
            >
              Join Room
            </button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Ask your friend to share the Room ID
            </p>
          </div>
        </div>
      ) : (
        // Chat Screen
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-border p-4 flex items-center justify-between bg-card">
            <div className="flex items-center gap-3">
              <button onClick={leaveRoom} className="p-2">
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <p className="font-bold">Room: {roomId}</p>
                <p className="text-sm text-muted-foreground">{usersInRoom.length} online</p>
              </div>
            </div>
            <div className="text-sm text-green-500">● Connected</div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.username === username ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-3xl px-5 py-3 ${
                  msg.username === username 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card"
                }`}>
                  <p className="text-xs opacity-70 mb-1">{msg.username}</p>
                  {msg.isFile ? (
                    <a href={msg.fileUrl} target="_blank" className="underline">
                      📎 {msg.fileName}
                    </a>
                  ) : (
                    <p>{msg.message}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4 bg-card">
            <div className="flex gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 rounded-2xl border border-border bg-background px-5 py-3 focus:outline-none"
              />

              <label className="cursor-pointer p-3 rounded-2xl border border-border hover:bg-muted">
                <Paperclip className="h-5 w-5" />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>

              <button
                onClick={sendMessage}
                className="rounded-2xl bg-primary p-3 text-primary-foreground"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>

            {file && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>📎 {file.name}</span>
                <button onClick={uploadFile} className="text-primary underline">Upload</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}