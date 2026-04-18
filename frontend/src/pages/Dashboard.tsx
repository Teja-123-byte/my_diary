import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Flame, Sparkles, Plus, MessageCircle, Video } from "lucide-react";
import StreakRing from "@/components/StreakRing";
import { CATEGORY_STYLES, FRIENDS, TASKS_SEED, type Task } from "@/lib/mock";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api"; // ✅ correct


const greet = () => {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(TASKS_SEED);
  const done = useMemo(() => tasks.filter((t) => t.done).length, [tasks]);

  const toggle = (id: string) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const onlineFriends = FRIENDS.filter((f) => f.online);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[2rem] p-6 sm:p-8 lg:col-span-2"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            today's diary
          </span>
          <h1 className="mt-3 font-display text-4xl font-black leading-[1.05] sm:text-5xl">
            {greet()}, <span className="text-gradient">friend.</span>
          </h1>
          <p className="mt-2 max-w-lg text-muted-foreground">
            You're {done}/{tasks.length} tasks in. Tiny wins stack into beautiful weeks — keep going. 🌷
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/tasks"
              className="group inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--gradient-primary)" }}
            >
              View all tasks <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/call" className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card/70 px-5 py-3 text-sm font-bold hover:-translate-y-0.5 hover:shadow-soft transition-all">
              <Video className="h-4 w-4" /> Start a room
            </Link>
            <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-butter/70 px-3 py-1.5 text-sm font-bold text-butter-foreground">
              <Flame className="h-4 w-4" /> 12 day streak
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass flex flex-col items-center justify-center gap-3 rounded-[2rem] p-6"
        >
          <StreakRing done={done} total={tasks.length} />
          <p className="text-center text-sm text-muted-foreground">
            {done === tasks.length ? "All done — go celebrate! 🎉" : `${tasks.length - done} more to crush today.`}
          </p>
        </motion.div>
      </section>

      {/* Floating task cards */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Floating quests</h2>
            <p className="text-sm text-muted-foreground">Tap a card to mark it done.</p>
          </div>
          <Link to="/tasks" className="text-sm font-bold text-primary hover:underline">See all →</Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.slice(0, 6).map((t, i) => {
            const style = CATEGORY_STYLES[t.category];
            return (
              <motion.button
                key={t.id}
                onClick={() => toggle(t.id)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                whileHover={{ y: -6, rotate: i % 2 === 0 ? -1 : 1 }}
                whileTap={{ scale: 0.97 }}
                className={`group relative overflow-hidden rounded-[1.75rem] p-5 text-left transition-shadow hover:shadow-pop ${
                  t.done ? "bg-card/60" : "bg-card/90"
                } shadow-soft`}
                aria-pressed={t.done}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-pastel text-2xl shadow-soft animate-float-slow" style={{ animationDelay: `${i * 0.4}s` }}>
                    {t.emoji}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${style.chip}`}>
                    {style.label}
                  </span>
                </div>
                <h3 className={`mt-4 text-lg font-bold leading-snug ${t.done ? "text-muted-foreground line-through" : ""}`}>
                  {t.title}
                </h3>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>⏰ {t.time}</span>
                  <span className={`grid h-6 w-6 place-items-center rounded-full border-2 ${t.done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                    {t.done ? "✓" : ""}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Friends + quick chat */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass rounded-[2rem] p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Friends online</h2>
            <Link to="/chat" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              Open chat <MessageCircle className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {onlineFriends.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-2xl bg-card/80 p-3"
              >
                <div className="relative">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl ${f.color} animate-float-slow`} style={{ animationDelay: `${i * 0.3}s` }}>
                    {f.emoji}
                  </span>
                  <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-mint" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold">{f.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{f.status}</p>
                </div>
              </motion.div>
            ))}
            <Link
              to="/chat"
              className="grid place-items-center rounded-2xl border-2 border-dashed border-border bg-card/40 p-3 text-sm font-bold text-muted-foreground hover:bg-card/70"
            >
              <Plus className="mb-1 h-5 w-5" />
              invite a friend
            </Link>
          </div>
        </div>

        <div className="glass rounded-[2rem] p-6">
          <h2 className="font-display text-2xl font-bold">Today's mood</h2>
          <p className="mt-1 text-sm text-muted-foreground">How's your heart doing?</p>
          <div className="mt-5 grid grid-cols-5 gap-2 text-2xl">
            {["😴", "🙂", "🥰", "🔥", "🥲"].map((e) => (
              <button key={e} className="aspect-square rounded-2xl bg-card/80 transition-transform hover:-translate-y-1 hover:bg-card">
                {e}
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-pastel/60 p-4 text-sm">
            <p className="font-bold">✨ tiny prompt</p>
            <p className="mt-1 text-foreground/80">One thing you're proud of from yesterday?</p>
          </div>
        </div>
      </section>
    </div>
  );
}
