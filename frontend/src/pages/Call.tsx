import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { socket } from "@/socket";
import { ArrowLeft, Mic, MicOff, Video, VideoOff, Smile, Users, Copy } from "lucide-react";

const REACTIONS = ["❤️", "🔥", "👏", "😂", "😮", "🙌", "🎉"];

interface Peer {
  socketId: string;
  username: string;
  stream: MediaStream | null;
}

export default function Call() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [roomId, setRoom] = useState(searchParams.get("roomId") || "");

  const [username, setUsername] = useState("Saitejasri");
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState("");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showReactions, setShowReactions] = useState(false);
  const [peers, setPeers] = useState<Peer[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Record<string, RTCPeerConnection>>({});
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const toggleMic = () => {
  const stream = localStreamRef.current;
  if (!stream) return;

  const audioTrack = stream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    setIsMicOn(audioTrack.enabled);
  }
};

const toggleVideo = () => {
  const stream = localStreamRef.current;
  if (!stream) return;

  const videoTrack = stream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    setIsVideoOn(videoTrack.enabled);
  }
};
  // Start Local Camera
  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error(err);
      setError("Failed to access camera/microphone");
      return null;
    }
  };

 const createPeerConnection = useCallback((targetSocketId: string) => {
  if (!localStreamRef.current) {
    console.error("❌ No local stream");
    return null;
  }

  // Close existing connection if any
  if (pcsRef.current[targetSocketId]) {
    pcsRef.current[targetSocketId].close();
  }

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // ✅ Add local tracks
  localStreamRef.current.getTracks().forEach((track) => {
    pc.addTrack(track, localStreamRef.current!);
  });

  // ✅ Receive remote stream
  pc.ontrack = (event) => {
    console.log("🎥 Received stream from", targetSocketId);

    const remoteStream = event.streams[0];
    setPeers((prev) =>
      prev.map((p) =>
        p.socketId === targetSocketId
          ? { ...p, stream: remoteStream }
          : p
      )
    );
  };

  // ✅ ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        targetSocketId,
        candidate: event.candidate,
      });
    }
  };

  pcsRef.current[targetSocketId] = pc;
  return pc;
}, []);
  // Join Room
  const joinWebinar = async () => {
    if (!roomId) {
      setError("No Room ID found");
      return;
    }

    const stream = await startLocalStream();
    if (!stream) return;

    socket.connect();
    socket.emit("join-room", { roomId, username });
    setIsJoined(true);
  };

  // Signaling
  useEffect(() => {
    if (!isJoined || !roomId) return;

    const onAllUsers = async (users: any[]) => {
      const others = users.filter((u) => u.socketId !== socket.id);
      setPeers(others.map((u) => ({ socketId: u.socketId, username: u.username, stream: null })));

      // Send offer to existing users
      for (const user of others) {
        const pc = createPeerConnection(user.socketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { targetSocketId: user.socketId, offer });
      }
    };

    const onUserJoined = async ({ socketId, username: uname }) => {
  setPeers((prev) => {
    if (prev.find((p) => p.socketId === socketId)) return prev;
    return [...prev, { socketId, username: uname, stream: null }];
  });

  // ✅ IMPORTANT: create offer for new user
  const pc = createPeerConnection(socketId);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("offer", {
    targetSocketId: socketId,
    offer,
  });
};

    const onOffer = async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      let pc = pcsRef.current[from];
      if (!pc) pc = createPeerConnection(from);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", { targetSocketId: from, answer });
    };

    const onAnswer = async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      const pc = pcsRef.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const onIceCandidate = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = pcsRef.current[from];
      if (pc) pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const onUserLeft = ({ socketId }: { socketId: string }) => {
      pcsRef.current[socketId]?.close();
      delete pcsRef.current[socketId];
      setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
    };

    socket.on("all-users", onAllUsers);
    socket.on("user-joined", onUserJoined);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("user-left", onUserLeft);

    return () => {
      socket.off("all-users", onAllUsers);
      socket.off("user-joined", onUserJoined);
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIceCandidate);
      socket.off("user-left", onUserLeft);
    };
  }, [isJoined, roomId, createPeerConnection]);

  const leaveCall = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    Object.values(pcsRef.current).forEach((pc) => pc.close());
    pcsRef.current = {};
    socket.emit("leave-room");
    navigate("/chat");
  };

  const totalUsers = 1 + peers.length;

 return (
  <div className="min-h-screen bg-gradient-to-br from-[#fdf4ff] via-[#f3e8ff] to-[#e0f2fe] flex flex-col">
    {/* Header */}
    <div className="h-16 border-b border-white/60 flex items-center px-6 justify-between bg-white/70 backdrop-blur-md">
      <button onClick={leaveCall} className="flex items-center gap-2 text-red-500 hover:text-red-600">
        <ArrowLeft size={24} /> Leave Webinar
      </button>
      <div className="font-semibold text-xl text-gray-800">Webinar Room</div>
      <div className="flex items-center gap-2 text-emerald-500">
        <Users size={20} /> {totalUsers}
      </div>
    </div>

    {error && <div className="p-4 bg-red-100 text-red-600 text-center">{error}</div>}

    {!isJoined ? (
      /* Join Screen */
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Join Video Webinar</h2>
          <p className="text-gray-500 mb-8">Study together with friends</p>

          <div className="space-y-5">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Enter Room ID"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl"
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your Name"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl"
            />
            <button
              onClick={joinWebinar}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-2xl font-bold"
            >
              Join Webinar
            </button>
          </div>
        </div>
      </div>
    ) : (
      <>
        {/* Video Grid */}
        <div className="flex-1 p-6">
          <div className={`grid gap-6 ${totalUsers === 1 ? "grid-cols-1" : "grid-cols-2"} max-w-6xl mx-auto`}>
            
            {/* Local Video */}
            <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
             <video
  ref={(el) => {
    if (el && localStreamRef.current) {
      if (el.srcObject !== localStreamRef.current) {
        el.srcObject = localStreamRef.current;

        el.onloadedmetadata = () => {
          el.play().catch(() => {});
        };
      }
    }
  }}
  autoPlay
  playsInline
  muted
  className="w-full h-full object-cover"
/>
              <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-xl text-white text-sm">
                You ({username})
              </div>
            </div>

            {/* Remote Videos */}
            {peers.map((peer) => (
              <div
                key={peer.socketId}
                className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
              >
                <video
                  ref={(el) => {
                    if (el && localStreamRef.current) {
                      el.srcObject = localStreamRef.current;
                      el.muted = true;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-xl text-white text-sm">
                  {peer.username}
                </div>
              </div>
            ))}

          </div>

          {peers.length === 0 && (
            <p className="text-center text-gray-500 mt-10">
              Waiting for friends to join...
            </p>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="h-20 bg-white/90 backdrop-blur-xl border-t border-gray-200 flex items-center justify-center gap-8">
          <button onClick={toggleMic} className={`p-5 rounded-2xl ${isMicOn ? "bg-gray-100" : "bg-red-500 text-white"}`}>
            {isMicOn ? <Mic size={28} /> : <MicOff size={28} />}
          </button>

          <button onClick={toggleVideo} className={`p-5 rounded-2xl ${isVideoOn ? "bg-gray-100" : "bg-red-500 text-white"}`}>
            {isVideoOn ? <Video size={28} /> : <VideoOff size={28} />}
          </button>

          <button onClick={leaveCall} className="px-10 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold">
            End Webinar
          </button>
        </div>
      </>
    )}
  </div>
); 
}