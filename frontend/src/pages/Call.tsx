import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { socket } from "@/socket";
import { ArrowLeft, Mic, MicOff, Video, VideoOff, Smile, Users } from "lucide-react";

const REACTIONS = ["❤️", "🔥", "👏", "😂", "😮", "🙌", "🎉"];

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface RemotePeer {
  socketId: string;
  username: string;
  stream: MediaStream | null;
}

export default function Call() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [username, setUsername] = useState("Saitejasri");
  const [roomCode, setRoomCode] = useState(searchParams.get("roomId") || "");
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState("");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showReactions, setShowReactions] = useState(false);
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Map of socketId -> RTCPeerConnection
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  // Map of socketId -> video element
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // ─── Attach local stream to video element after DOM mounts ───
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(console.error);
    }
  }, [localStream, isJoined]);

  // ─── Create RTCPeerConnection for a remote peer ───
  const createPeerConnection = useCallback(
    (remoteSocketId: string, remoteUsername: string) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add all local tracks to this connection
      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });

      // When remote track arrives, attach stream to that peer
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setRemotePeers((prev) =>
          prev.map((p) =>
            p.socketId === remoteSocketId ? { ...p, stream: remoteStream } : p
          )
        );
      };

      // Send ICE candidates through the socket signaling server
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            to: remoteSocketId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] Peer ${remoteSocketId} state:`, pc.connectionState);
      };

      peerConnections.current[remoteSocketId] = pc;
      return pc;
    },
    []
  );

  // ─── Socket signaling events ───
  useEffect(() => {
    if (!isJoined) return;

    // A new user joined — existing users send them an offer
    const handleUserJoined = async ({
      socketId,
      username: remoteUsername,
    }: {
      socketId: string;
      username: string;
    }) => {
      console.log("[Socket] user-joined:", remoteUsername, socketId);

      setRemotePeers((prev) => {
        if (prev.find((p) => p.socketId === socketId)) return prev;
        return [...prev, { socketId, username: remoteUsername, stream: null }];
      });

      const pc = createPeerConnection(socketId, remoteUsername);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { to: socketId, offer, username });
    };

    // We received an offer — send back an answer
    const handleOffer = async ({
      from,
      offer,
      username: remoteUsername,
    }: {
      from: string;
      offer: RTCSessionDescriptionInit;
      username: string;
    }) => {
      console.log("[Socket] offer from:", remoteUsername);

      setRemotePeers((prev) => {
        if (prev.find((p) => p.socketId === from)) return prev;
        return [...prev, { socketId: from, username: remoteUsername, stream: null }];
      });

      const pc = createPeerConnection(from, remoteUsername);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer });
    };

    // We received an answer to our offer
    const handleAnswer = async ({
      from,
      answer,
    }: {
      from: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      console.log("[Socket] answer from:", from);
      const pc = peerConnections.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    // ICE candidate from a peer
    const handleIceCandidate = async ({
      from,
      candidate,
    }: {
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peerConnections.current[from];
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    // A user left the room
    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      console.log("[Socket] user-left:", socketId);
      peerConnections.current[socketId]?.close();
      delete peerConnections.current[socketId];
      setRemotePeers((prev) => prev.filter((p) => p.socketId !== socketId));
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("user-left", handleUserLeft);
    };
  }, [isJoined, createPeerConnection]);

  // ─── Join webinar ───
  const joinWebinar = async () => {
    const code = roomCode.trim();
    if (!code) {
      setError("Please enter Room Code");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      socket.connect();
      socket.emit("join-room", { roomId: code, username });

      setIsJoined(true);
      setError("");
      setSearchParams({ roomId: code });
    } catch (err: any) {
      console.error("Camera error:", err);
      setError("Failed to access camera. Please allow permission.");
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) track.enabled = !isMicOn;
      setIsMicOn((prev) => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) track.enabled = !isVideoOn;
      setIsVideoOn((prev) => !prev);
    }
  };

  const leaveCall = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};
    setLocalStream(null);
    setRemotePeers([]);
    socket.emit("leave-room");
    navigate("/chat");
  };

  const sendReaction = (emoji: string) => {
    socket.emit("reaction", { roomId: roomCode, emoji });
    setShowReactions(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      Object.values(peerConnections.current).forEach((pc) => pc.close());
    };
  }, []);

  const totalUsers = 1 + remotePeers.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf4ff] via-[#f3e8ff] to-[#e0f2fe] flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-white/60 flex items-center px-6 justify-between bg-white/70 backdrop-blur-md">
        <button
          onClick={leaveCall}
          className="flex items-center gap-2 text-red-500 hover:text-red-600"
        >
          <ArrowLeft size={24} /> Leave Webinar
        </button>
        <div className="font-semibold text-xl text-gray-800">Webinar Room</div>
        {/* Shows real connected user count */}
        <div className="flex items-center gap-2 text-emerald-500">
          <Users size={20} /> {totalUsers}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-600 text-center">{error}</div>
      )}

      {!isJoined ? (
        /* Room Entry Screen */
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Join Video Webinar
            </h2>
            <p className="text-gray-500 mb-8">Study together with friends</p>

            <div className="space-y-5">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Enter Room ID (e.g. a0c5f1ec)"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-400 text-lg"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your Name"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-violet-400 text-lg"
              />
              <button
                onClick={joinWebinar}
                className="w-full py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg"
              >
                Join Webinar
              </button>
            </div>

            <p className="text-gray-400 text-sm mt-6">
              Ask your friend to share the Room ID
            </p>
          </div>
        </div>
      ) : (
        /* Video Grid — auto layout based on number of participants */
        <div className="flex-1 p-6 flex flex-col">
          <div
            className={`flex-1 grid gap-4 ${
              totalUsers === 1
                ? "grid-cols-1 place-items-center"
                : totalUsers === 2
                ? "grid-cols-2"
                : "grid-cols-2"
            }`}
          >
            {/* Local video tile */}
            <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isVideoOn && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-white text-3xl font-bold">
                    {username.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center gap-2">
                You ({username})
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Remote video tiles */}
            {remotePeers.map((peer) => (
              <div
                key={peer.socketId}
                className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/20"
              >
                {peer.stream ? (
                  <video
                    autoPlay
                    playsInline
                    ref={(el) => {
                      remoteVideoRefs.current[peer.socketId] = el;
                      if (el && peer.stream && el.srcObject !== peer.stream) {
                        el.srcObject = peer.stream;
                        el.play().catch(console.error);
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-violet-700 flex items-center justify-center text-white text-3xl font-bold">
                      {peer.username.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-gray-400 text-sm">Connecting...</p>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl text-white text-sm font-medium">
                  {peer.username}
                </div>
              </div>
            ))}
          </div>

          {remotePeers.length === 0 && (
            <p className="text-center text-gray-500 mt-6">
              Waiting for friends to join the webinar...
            </p>
          )}
        </div>
      )}

      {/* Bottom Controls */}
      {isJoined && (
        <div className="h-20 bg-white/90 backdrop-blur-xl border-t border-gray-200 flex items-center justify-center gap-8">
          <button
            onClick={toggleMic}
            className={`p-5 rounded-2xl transition-all ${
              isMicOn ? "bg-gray-100 hover:bg-gray-200" : "bg-red-500 text-white"
            }`}
          >
            {isMicOn ? <Mic size={28} /> : <MicOff size={28} />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-5 rounded-2xl transition-all ${
              isVideoOn ? "bg-gray-100 hover:bg-gray-200" : "bg-red-500 text-white"
            }`}
          >
            {isVideoOn ? <Video size={28} /> : <VideoOff size={28} />}
          </button>

          <button
            onClick={() => setShowReactions(!showReactions)}
            className="p-5 rounded-2xl bg-gray-100 hover:bg-gray-200 transition"
          >
            <Smile size={28} />
          </button>

          <button
            onClick={leaveCall}
            className="px-10 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-lg transition"
          >
            End Webinar
          </button>
        </div>
      )}

      {/* Reactions panel */}
      {showReactions && isJoined && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 flex gap-4 bg-white/90 backdrop-blur-2xl p-4 rounded-3xl shadow-xl border border-white">
          {REACTIONS.map((emoji, i) => (
            <button
              key={i}
              onClick={() => sendReaction(emoji)}
              className="text-5xl hover:scale-125 transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
