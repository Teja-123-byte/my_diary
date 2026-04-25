import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Flame, Sparkles, Plus, MessageCircle, Video } from "lucide-react";
import StreakRing from "@/components/StreakRing";
import { CATEGORY_STYLES } from "@/lib/mock";           // Keep only styles
import { socket } from "@/socket";                      // ← Import socket
import { useQuery } from "@tanstack/react-query";

const greet = () => {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [onlineFriends, setOnlineFriends] = useState<any[]>([]);

  // Fetch tasks from backend (real data)
  const { data: fetchedTasks, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      // You can later replace this with real API call if you add REST endpoints
      return []; // Placeholder for now
    },
  });

  // Connect to Socket when Dashboard loads
  useEffect(() => {
    socket.connect();

    // Example: Listen for new tasks created by friends in rooms
    socket.on("new-task", (newTask) => {
      setTasks((prev) => [...prev, newTask]);
    });

    socket.on("task-updated", ({ taskId, completed }) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, completed } : t))
      );
    });

    socket.on("task-reminder", (reminder) => {
      alert(reminder.message); // Or show a nice toast notification
    });

    return () => {
      socket.off("new-task");
      socket.off("task-updated");
      socket.off("task-reminder");
      // Don't disconnect here if user might go to other pages
    };
  }, []);

  const done = useMemo(() => 
    tasks.filter((t) => t.completed || t.done).length, 
    [tasks]
  );

  const toggleTask = (id: string) => {
    const task = tasks.find((t) => t._id === id || t.id === id);
    if (!task) return;

    socket.emit("update-task", {
      taskId: task._id || task.id,
      completed: !(task.completed || task.done)
    });
  };

  // Quick action: Create a study room
  const createStudyRoom = () => {
    const username = "YourName"; // Replace with real user from auth later
    socket.emit("create-room", { username });
    
    socket.once("room-created", ({ roomId }) => {
      alert(`Room created! Share this code: ${roomId}`);
      // Optionally navigate to /room/${roomId}
      window.location.href = `/room/${roomId}`;
    });
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
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
            You're {done}/{tasks.length || 6} tasks in. Tiny wins stack into beautiful weeks — keep going. 🌷
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/tasks"
              className="group inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
              style={{ background: "var(--gradient-primary)" }}
            >
              View all tasks <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <button
              onClick={createStudyRoom}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card/70 px-5 py-3 text-sm font-bold hover:-translate-y-0.5 hover:shadow-soft transition-all"
            >
              <Video className="h-4 w-4" /> Start a room
            </button>

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
          <StreakRing done={done} total={tasks.length || 6} />
          <p className="text-center text-sm text-muted-foreground">
            {done === (tasks.length || 6) 
              ? "All done — go celebrate! 🎉" 
              : `${(tasks.length || 6) - done} more to crush today.`}
          </p>
        </motion.div>
      </section>

      {/* Floating Tasks - Now Connected */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Floating quests</h2>
            <p className="text-sm text-muted-foreground">Tap a card to mark it done.</p>
          </div>
          <Link to="/tasks" className="text-sm font-bold text-primary hover:underline">See all →</Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.length > 0 ? (
            tasks.slice(0, 6).map((t, i) => {
              const style = CATEGORY_STYLES[t.category] || CATEGORY_STYLES["general"];
              return (
                <motion.button
                  key={t._id || t.id}
                  onClick={() => toggleTask(t._id || t.id)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.97 }}
                  className={`group relative overflow-hidden rounded-[1.75rem] p-5 text-left transition-shadow hover:shadow-pop ${
                    t.completed || t.done ? "bg-card/60" : "bg-card/90"
                  } shadow-soft`}
                >
                  {/* Same card UI as before */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-pastel text-2xl shadow-soft">
                      {t.emoji || "📝"}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${style.chip}`}>
                      {style.label}
                    </span>
                  </div>
                  <h3 className={`mt-4 text-lg font-bold leading-snug ${(t.completed || t.done) ? "text-muted-foreground line-through" : ""}`}>
                    {t.title}
                  </h3>
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>⏰ {t.time || t.deadline}</span>
                    <span className={`grid h-6 w-6 place-items-center rounded-full border-2 ${(t.completed || t.done) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                      {(t.completed || t.done) ? "✓" : ""}
                    </span>
                  </div>
                </motion.button>
              );
            })
          ) : (
            <p className="text-muted-foreground">No tasks yet. Create some in the Tasks page!</p>
          )}
        </div>
      </section>

      {/* Friends Section */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass rounded-[2rem] p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Friends online</h2>
            <Link to="/chat" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              Open chat <MessageCircle className="h-4 w-4" />
            </Link>
          </div>
          {/* Keep your friends UI or connect to real online users later */}
          {/* ... your existing friends cards ... */}
        </div>

        {/* Mood tracker - unchanged */}
        <div className="glass rounded-[2rem] p-6">
          {/* ... your mood section ... */}
        </div>
      </section>
    </div>
  );
}