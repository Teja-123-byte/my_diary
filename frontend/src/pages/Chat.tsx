import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, Search, Phone, Video } from "lucide-react";
import { CHAT_SEED, FRIENDS, type ChatMessage } from "@/lib/mock";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

export default function Chat() {
  const [activeId, setActiveId] = useState(FRIENDS[0].id);
  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>(CHAT_SEED);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const friend = useMemo(() => FRIENDS.find((f) => f.id === activeId)!, [activeId]);
  const messages = allMessages[activeId] ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, activeId, typing]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setAllMessages((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), { id: `m${Date.now()}`, fromId: "me", text, time }],
    }));
    setDraft("");
    // Fake typing reply
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setAllMessages((prev) => ({
        ...prev,
        [activeId]: [
          ...(prev[activeId] ?? []),
          {
            id: `m${Date.now() + 1}`,
            fromId: friend.id,
            text: ["aw cute 🫶", "ok noted!", "hehe okok", "love that for you ✨", "say less"][Math.floor(Math.random() * 5)],
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      }));
    }, 1400);
  };

  return (
    <div className="grid h-[calc(100vh-7rem)] grid-cols-1 gap-4 lg:h-[calc(100vh-3rem)] lg:grid-cols-[320px_1fr]">
      {/* Friends list */}
      <aside className="glass hidden flex-col rounded-[2rem] p-4 lg:flex">
        <h1 className="px-2 pb-3 font-display text-2xl font-bold">Chats</h1>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search friends…" className="h-10 rounded-2xl border-border/60 bg-card/80 pl-9" />
        </div>
        <div className="-mx-2 flex-1 space-y-1 overflow-y-auto px-2">
          {FRIENDS.map((f) => {
            const last = (allMessages[f.id] ?? [])[ (allMessages[f.id] ?? []).length - 1 ];
            return (
              <button
                key={f.id}
                onClick={() => setActiveId(f.id)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors ${
                  activeId === f.id ? "bg-pastel shadow-soft" : "hover:bg-card/70"
                }`}
              >
                <div className="relative">
                  <span className={`grid h-11 w-11 place-items-center rounded-2xl text-xl ${f.color}`}>{f.emoji}</span>
                  {f.online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-mint" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{f.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{last?.text ?? f.status ?? "say hi 👋"}</p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Conversation */}
      <section className="glass flex min-h-0 flex-col rounded-[2rem]">
        {/* Mobile friend tabs */}
        <div className="flex gap-2 overflow-x-auto px-4 pt-4 lg:hidden">
          {FRIENDS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveId(f.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${
                activeId === f.id ? "bg-pastel shadow-soft" : "bg-card/70 text-muted-foreground"
              }`}
            >
              <span className="text-lg">{f.emoji}</span> {f.name}
            </button>
          ))}
        </div>

        {/* Header */}
        <header className="flex items-center gap-3 border-b border-border/40 px-5 py-4">
          <span className={`grid h-11 w-11 place-items-center rounded-2xl text-xl ${friend.color}`}>{friend.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{friend.name}</p>
            <p className="text-xs text-muted-foreground">{friend.online ? "online · " : "offline · "}{friend.status}</p>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-xl bg-card/70 hover:bg-card"><Phone className="h-4 w-4" /></button>
          <Link to="/call" className="grid h-10 w-10 place-items-center rounded-xl bg-card/70 hover:bg-card"><Video className="h-4 w-4" /></Link>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const me = m.fromId === "me";
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex items-end gap-2 ${me ? "justify-end" : "justify-start"}`}
                >
                  {!me && <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-sm ${friend.color}`}>{friend.emoji}</span>}
                  <div
                    className={`max-w-[75%] rounded-3xl px-4 py-2.5 text-sm shadow-soft ${
                      me ? "rounded-br-md text-primary-foreground" : "rounded-bl-md bg-card"
                    }`}
                    style={me ? { background: "var(--gradient-primary)" } : undefined}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    <p className={`mt-1 text-[10px] font-semibold ${me ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{m.time}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {typing && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
              <span className={`grid h-8 w-8 place-items-center rounded-xl text-sm ${friend.color}`}>{friend.emoji}</span>
              <div className="flex gap-1 rounded-3xl rounded-bl-md bg-card px-4 py-3 shadow-soft">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-2 w-2 rounded-full bg-muted-foreground/60"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border/40 p-4">
          <div className="flex items-center gap-2 rounded-2xl bg-card/80 p-2">
            <button className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted"><Smile className="h-5 w-5" /></button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={`Message ${friend.name}…`}
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none"
            />
            <button
              onClick={send}
              className="grid h-10 w-10 place-items-center rounded-xl text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--gradient-primary)" }}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
