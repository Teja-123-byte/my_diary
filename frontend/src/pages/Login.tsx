import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Sparkles, BookHeart, ArrowRight, Github } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FloatingScene from "@/components/FloatingScene";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: mode === "signin" ? "Welcome back, friend ✨" : "Your diary is ready 📔",
        description: "Opening your dashboard…",
      });
      navigate("/");
    }, 700);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-primary/30 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-24 h-[26rem] w-[26rem] rounded-full bg-secondary/50 blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
        <div className="absolute -bottom-32 left-1/3 h-[24rem] w-[24rem] rounded-full bg-mint/40 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
      </div>

      {/* Top bar */}
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <motion.a
          href="/"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
          aria-label="My Diary home"
        >
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-pastel shadow-soft">
            <BookHeart className="h-5 w-5 text-foreground" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">My Diary</span>
        </motion.a>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground sm:flex">
          <a href="#" className="transition-colors hover:text-foreground">Features</a>
          <a href="#" className="transition-colors hover:text-foreground">Friends</a>
          <a href="#" className="transition-colors hover:text-foreground">About</a>
        </nav>
      </header>

      {/* Main grid */}
      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-16 pt-4 lg:grid-cols-2 lg:gap-6 lg:pt-10">
        {/* Left — 3D scene + headline */}
        <div className="relative order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mb-6 max-w-xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              for friends, by friends
            </span>
            <h1 className="mt-4 font-display text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Your day,<br />
              <span className="text-gradient">written together.</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
              Chat, video call, and tick off daily quests with your favorite humans — all in one cozy little diary.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="relative h-[360px] w-full sm:h-[440px] lg:h-[480px]"
          >
            <FloatingScene />
          </motion.div>
        </div>

        {/* Right — auth card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="order-1 lg:order-2 lg:justify-self-end"
        >
          <div className="glass relative w-full max-w-md rounded-[2rem] p-8 sm:p-10">
            <div className="mb-6">
              <h2 className="font-display text-3xl font-bold">
                {mode === "signin" ? "Hey, welcome back!" : "Start your diary"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "signin"
                  ? "Sign in to see what your friends are up to today."
                  : "Make a cozy corner of the internet with friends."}
              </p>
            </div>

            {/* Mode switch */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-muted/70 p-1 text-sm font-bold">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`relative rounded-xl px-3 py-2 transition-colors ${
                    mode === m ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === m && (
                    <motion.span
                      layoutId="auth-pill"
                      className="absolute inset-0 -z-0 rounded-xl bg-pastel shadow-soft"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{m === "signin" ? "Sign in" : "Sign up"}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="you@diary.cute"
                    className="h-12 rounded-2xl border-border/70 bg-card/80 pl-10 text-base focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="h-12 rounded-2xl border-border/70 bg-card/80 pl-10 text-base focus-visible:ring-primary"
                  />
                </div>
              </div>

              {mode === "signin" && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-muted-foreground">
                    <input type="checkbox" className="h-4 w-4 rounded border-border accent-[hsl(var(--primary))]" />
                    Remember me
                  </label>
                  <a href="#" className="font-semibold text-primary hover:underline">Forgot?</a>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="group relative h-12 w-full overflow-hidden rounded-2xl text-base font-bold shadow-pop transition-transform hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: "var(--gradient-primary)" }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2 text-primary-foreground">
                  {loading ? "One sec…" : mode === "signin" ? "Open my diary" : "Create my diary"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-card/80 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-soft"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#EA4335" d="M12 10.2v3.96h5.5c-.24 1.32-1.7 3.86-5.5 3.86-3.32 0-6.02-2.74-6.02-6.12S8.68 5.78 12 5.78c1.88 0 3.14.8 3.86 1.5l2.64-2.54C16.92 3.22 14.66 2.3 12 2.3 6.92 2.3 2.8 6.42 2.8 11.5S6.92 20.7 12 20.7c6.92 0 9.2-4.86 9.2-7.36 0-.5-.06-.88-.14-1.26H12z"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-card/80 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-soft"
              >
                <Github className="h-4 w-4" />
                GitHub
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing you agree to our <a href="#" className="font-semibold text-foreground hover:underline">Terms</a> & <a href="#" className="font-semibold text-foreground hover:underline">Privacy</a>.
            </p>
          </div>
        </motion.div>
      </section>
    </main>
  );
};

export default Login;
