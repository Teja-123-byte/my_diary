import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Hand, Smile, MessageCircle, Users, ScreenShare } from "lucide-react";
import { FRIENDS } from "@/lib/mock";
import { Link } from "react-router-dom";

const PARTICIPANTS = [
  { id: "me", name: "You", emoji: "🦄", color: "bg-primary/30", host: true },
  ...FRIENDS.slice(0, 4).map((f) => ({ id: f.id, name: f.name, emoji: f.emoji, color: f.color, host: false })),
];

export default function Call() {
  const [muted, setMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [hand, setHand] = useState(false);
  const [spotlight, setSpotlight] = useState(PARTICIPANTS[0]);

  const others = PARTICIPANTS.filter((p) => p.id !== spotlight.id);

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="glass flex flex-col gap-3 rounded-[2rem] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> live · webinar
          </span>
          <h1 className="mt-2 font-display text-3xl font-black sm:text-4xl">Friday hangout 🪩</h1>
          <p className="text-sm text-muted-foreground">{PARTICIPANTS.length} friends · started 12 min ago</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-2xl bg-card/80 px-3 py-2 text-sm font-bold hover:bg-card">
            <Users className="h-4 w-4" /> {PARTICIPANTS.length}
          </button>
          <button className="inline-flex items-center gap-2 rounded-2xl bg-card/80 px-3 py-2 text-sm font-bold hover:bg-card">
            <MessageCircle className="h-4 w-4" /> Chat
          </button>
        </div>
      </header>

      {/* Spotlight */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <motion.div
          key={spotlight.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-video overflow-hidden rounded-[2rem] shadow-pop"
          style={{ background: "var(--gradient-pastel)" }}
        >
          {/* floating decoration */}
          <div className="absolute inset-0 opacity-60">
            <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-card/40 blur-2xl animate-blob" />
            <div className="absolute right-16 bottom-10 h-40 w-40 rounded-full bg-card/40 blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
          </div>

          <div className="relative grid h-full place-items-center">
            <motion.span
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="grid h-40 w-40 place-items-center rounded-[2rem] bg-card/80 text-7xl shadow-pop sm:h-48 sm:w-48 sm:text-8xl"
            >
              {spotlight.emoji}
            </motion.span>
          </div>

          {/* Bottom bar in tile */}
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-between">
            <span className="rounded-full bg-background/70 px-3 py-1.5 text-sm font-bold backdrop-blur">
              {spotlight.name} {spotlight.host && "· host"}
            </span>
            <div className="flex gap-1.5">
              {muted && spotlight.id === "me" && (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-destructive text-destructive-foreground">
                  <MicOff className="h-4 w-4" />
                </span>
              )}
              {hand && spotlight.id === "me" && (
                <span className="grid h-8 w-8 place-items-center rounded-full bg-butter text-butter-foreground">✋</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Side tiles */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {others.map((p, i) => (
            <motion.button
              key={p.id}
              onClick={() => setSpotlight(p)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className={`relative aspect-video overflow-hidden rounded-3xl shadow-soft ${p.color}`}
            >
              <div className="grid h-full place-items-center">
                <motion.span
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-5xl"
                >
                  {p.emoji}
                </motion.span>
              </div>
              <span className="absolute inset-x-2 bottom-2 truncate rounded-full bg-background/80 px-2.5 py-1 text-xs font-bold backdrop-blur">
                {p.name}
              </span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Reactions strip */}
      <section className="glass flex flex-wrap items-center justify-center gap-2 rounded-full px-4 py-2 text-2xl">
        {["❤️", "😂", "🎉", "👏", "🔥", "🦋", "✨", "🥹"].map((e) => (
          <motion.button
            key={e}
            whileHover={{ y: -6, scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            className="rounded-full px-2 py-1 hover:bg-card/70"
          >
            {e}
          </motion.button>
        ))}
      </section>

      {/* Controls */}
      <section className="glass sticky bottom-20 z-30 mx-auto flex max-w-2xl items-center justify-center gap-2 rounded-full p-2 lg:bottom-4">
        <ControlBtn
          active={!muted}
          onClick={() => setMuted((m) => !m)}
          label={muted ? "Unmute" : "Mute"}
          icon={muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        />
        <ControlBtn
          active={camOn}
          onClick={() => setCamOn((c) => !c)}
          label={camOn ? "Stop video" : "Start video"}
          icon={camOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        />
        <ControlBtn
          active={hand}
          onClick={() => setHand((h) => !h)}
          label="Raise hand"
          icon={<Hand className="h-5 w-5" />}
        />
        <ControlBtn label="React" icon={<Smile className="h-5 w-5" />} />
        <ControlBtn label="Share" icon={<ScreenShare className="h-5 w-5" />} />
        <Link
          to="/"
          className="ml-1 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-destructive-foreground shadow-pop transition-transform hover:-translate-y-0.5"
          style={{ background: "hsl(var(--destructive))" }}
          aria-label="Leave call"
        >
          <PhoneOff className="h-4 w-4" /> Leave
        </Link>
      </section>
    </div>
  );
}

function ControlBtn({
  icon,
  label,
  active = true,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-12 w-12 place-items-center rounded-full transition-all hover:-translate-y-0.5 ${
        active ? "bg-card/80 text-foreground hover:bg-card" : "bg-destructive/15 text-destructive"
      }`}
    >
      {icon}
    </button>
  );
}
