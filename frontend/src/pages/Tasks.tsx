import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { CATEGORY_STYLES, TASKS_SEED, type Task, type TaskCategory } from "@/lib/mock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FILTERS: Array<{ key: "all" | "todo" | "done"; label: string }> = [
  { key: "all", label: "All" },
  { key: "todo", label: "To do" },
  { key: "done", label: "Done" },
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(TASKS_SEED);
  const [filter, setFilter] = useState<"all" | "todo" | "done">("all");
  const [draft, setDraft] = useState("");
  const [draftCat, setDraftCat] = useState<TaskCategory>("personal");

  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const remaining = total - done;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const visible = useMemo(() => {
    if (filter === "todo") return tasks.filter((t) => !t.done);
    if (filter === "done") return tasks.filter((t) => t.done);
    return tasks;
  }, [tasks, filter]);

  const toggle = (id: string) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const add = () => {
    if (!draft.trim()) return;
    setTasks((ts) => [
      ...ts,
      {
        id: `t${Date.now()}`,
        title: draft.trim(),
        category: draftCat,
        time: "Anytime",
        done: false,
        emoji: { study: "📚", health: "💪", social: "🫶", personal: "🌱" }[draftCat],
      },
    ]);
    setDraft("");
  };

  return (
    <div className="space-y-8">
      {/* Header + progress */}
      <section className="glass rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              daily quests
            </span>
            <h1 className="mt-3 font-display text-4xl font-black sm:text-5xl">
              {remaining === 0 ? "All clear ✨" : <>{remaining} left to <span className="text-gradient">crush.</span></>}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {done} completed · {remaining} remaining · {pct}% of today
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 sm:items-end">
            <div className="flex items-baseline gap-1.5 font-display text-5xl font-black">
              <span>{pct}</span><span className="text-2xl text-muted-foreground">%</span>
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">today's progress</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-4 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-pastel shadow-soft"
          />
        </div>

        {/* Stat chips */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: total, tint: "bg-secondary/60 text-secondary-foreground" },
            { label: "Done", value: done, tint: "bg-mint/70 text-mint-foreground" },
            { label: "Left", value: remaining, tint: "bg-primary/25 text-foreground" },
            { label: "Streak", value: "12d", tint: "bg-butter/80 text-butter-foreground" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl p-4 ${s.tint}`}>
              <div className="font-display text-3xl font-black leading-none">{s.value}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-widest opacity-80">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Add new */}
      <section className="glass rounded-[2rem] p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a new tiny quest…"
            className="h-12 flex-1 rounded-2xl border-border/70 bg-card/80 text-base"
          />
          <select
            value={draftCat}
            onChange={(e) => setDraftCat(e.target.value as TaskCategory)}
            className="h-12 rounded-2xl border border-border bg-card/80 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {(Object.keys(CATEGORY_STYLES) as TaskCategory[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_STYLES[c].label}</option>
            ))}
          </select>
          <Button
            onClick={add}
            className="h-12 rounded-2xl px-6 font-bold text-primary-foreground shadow-pop"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
      </section>

      {/* Filter + list */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`relative rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                filter === f.key ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter === f.key && (
                <motion.span layoutId="filter-pill" className="absolute inset-0 -z-0 rounded-full bg-pastel shadow-soft" />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          ))}
        </div>

        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {visible.map((t) => {
              const style = CATEGORY_STYLES[t.category];
              return (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    onClick={() => toggle(t.id)}
                    className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-soft ${
                      t.done ? "bg-card/60" : "bg-card/90 shadow-soft"
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition-all ${
                        t.done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
                      }`}
                    >
                      {t.done && <Check className="h-5 w-5" />}
                    </span>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-pastel text-xl shadow-soft">
                      {t.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</p>
                      <p className="text-xs text-muted-foreground">⏰ {t.time}</p>
                    </div>
                    <span className={`hidden rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest sm:inline-block ${style.chip}`}>
                      {style.label}
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </section>
    </div>
  );
}
