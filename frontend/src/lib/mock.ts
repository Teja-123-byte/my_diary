export type Friend = {
  id: string;
  name: string;
  emoji: string;
  color: string; // tailwind bg class for avatar
  online: boolean;
  status?: string;
};

export const FRIENDS: Friend[] = [
  { id: "f1", name: "Aarav", emoji: "🦊", color: "bg-primary/30", online: true, status: "deep work mode" },
  { id: "f2", name: "Mira", emoji: "🐰", color: "bg-secondary/60", online: true, status: "sipping chai" },
  { id: "f3", name: "Kai", emoji: "🐻", color: "bg-mint/60", online: false, status: "back at 6" },
  { id: "f4", name: "Zoya", emoji: "🦋", color: "bg-butter/70", online: true, status: "doodling" },
  { id: "f5", name: "Dev", emoji: "🦉", color: "bg-accent/70", online: false },
];

export type TaskCategory = "study" | "health" | "social" | "personal";

export type Task = {
  id: string;
  title: string;
  category: TaskCategory;
  time: string;
  done: boolean;
  emoji: string;
};

export const TASKS_SEED: Task[] = [
  { id: "t1", title: "Morning pages — 1 page", category: "personal", time: "08:00", done: true, emoji: "📓" },
  { id: "t2", title: "30 min cardio", category: "health", time: "09:00", done: true, emoji: "🏃" },
  { id: "t3", title: "Read DSA chapter 4", category: "study", time: "11:00", done: false, emoji: "📚" },
  { id: "t4", title: "Call mom", category: "social", time: "13:30", done: false, emoji: "📞" },
  { id: "t5", title: "Ship login page polish", category: "study", time: "16:00", done: true, emoji: "✨" },
  { id: "t6", title: "Group study with friends", category: "social", time: "19:00", done: false, emoji: "🫶" },
  { id: "t7", title: "10 min meditation", category: "health", time: "22:00", done: false, emoji: "🧘" },
];

export const CATEGORY_STYLES: Record<TaskCategory, { label: string; chip: string; ring: string }> = {
  study:    { label: "Study",    chip: "bg-secondary/70 text-secondary-foreground", ring: "ring-secondary" },
  health:   { label: "Health",   chip: "bg-mint/70 text-mint-foreground",           ring: "ring-mint" },
  social:   { label: "Social",   chip: "bg-primary/25 text-foreground",             ring: "ring-primary" },
  personal: { label: "Personal", chip: "bg-butter/80 text-butter-foreground",       ring: "ring-butter" },
};

export type ChatMessage = {
  id: string;
  fromId: string; // "me" or friend id
  text: string;
  time: string;
};

export const CHAT_SEED: Record<string, ChatMessage[]> = {
  f1: [
    { id: "m1", fromId: "f1", text: "yo, you up for the 7pm study sesh?", time: "10:14" },
    { id: "m2", fromId: "me", text: "always 🫡 will bring snacks", time: "10:15" },
    { id: "m3", fromId: "f1", text: "pog. send the link when ready", time: "10:16" },
  ],
  f2: [
    { id: "m1", fromId: "f2", text: "look at this lil sketch i made 🐰✨", time: "09:02" },
    { id: "m2", fromId: "me", text: "OBSESSED. frame it.", time: "09:05" },
  ],
  f4: [
    { id: "m1", fromId: "f4", text: "did you finish ur tasks today?", time: "12:41" },
    { id: "m2", fromId: "me", text: "4/7… on it 🥲", time: "12:42" },
  ],
};
