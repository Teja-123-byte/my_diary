import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { BookHeart, LayoutDashboard, ListChecks, MessageCircle, Video, LogOut } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/tasks", label: "Daily tasks", icon: ListChecks },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/call", label: "Video call", icon: Video },
];

export default function AppLayout() {
  const location = useLocation();
  return (
    <div className="relative min-h-screen">
      {/* Background pastel blobs (shared) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-24 h-[26rem] w-[26rem] rounded-full bg-secondary/40 blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
        <div className="absolute -bottom-32 left-1/3 h-[24rem] w-[24rem] rounded-full bg-mint/40 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
      </div>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 lg:px-8">
        {/* Sidebar */}
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-[2rem] glass p-5 lg:flex">
          <NavLink to="/" className="mb-8 flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-pastel shadow-soft">
              <BookHeart className="h-5 w-5 text-foreground" />
            </span>
            <span className="font-display text-xl font-bold tracking-tight">My Diary</span>
          </NavLink>

          <nav className="flex flex-col gap-1.5">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
                    isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-0 rounded-2xl bg-pastel shadow-soft"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className="relative z-10 h-4.5 w-4.5" />
                    <span className="relative z-10">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl bg-card/70 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/25 text-lg">🦄</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">You</p>
                <p className="truncate text-xs text-muted-foreground">friend mode: on</p>
              </div>
              <NavLink to="/login" aria-label="Log out" className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </NavLink>
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 border-b border-border/50 bg-background/70 px-4 py-3 backdrop-blur-lg lg:hidden">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-pastel shadow-soft">
              <BookHeart className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold">My Diary</span>
          </NavLink>
          <NavLink to="/login" className="text-xs font-bold text-muted-foreground">Log out</NavLink>
        </header>

        {/* Main content */}
        <main className="min-w-0 flex-1 pb-24 pt-16 lg:pt-0">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-3xl glass px-2 py-2 lg:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                isActive ? "text-primary-foreground" : "text-muted-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId="nav-pill-mobile" className="absolute inset-0 -z-0 rounded-2xl bg-pastel shadow-soft" />
                )}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{label.split(" ")[0]}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
