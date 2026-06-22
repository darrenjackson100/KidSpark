import React from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";

interface GameDef {
  path: string; title: string; description: string;
  emoji: string; color: string;
  ages: ("3-4" | "5-6" | "7-8")[];
  gameId: string;
}

const ALL_GAMES: GameDef[] = [
  { path: "/maths/count",        title: "Count Objects",     description: "How many can you count?",         emoji: "🍎", color: "from-orange-500 to-orange-700",  ages: ["3-4","5-6","7-8"], gameId: "count-objects" },
  { path: "/maths/tracing",      title: "Number Tracing",    description: "Practise writing numbers!",       emoji: "✏️", color: "from-lime-500 to-lime-700",      ages: ["3-4"],             gameId: "number-tracing" },
  { path: "/maths/match",        title: "Match Numbers",     description: "Find the right group!",           emoji: "🔢", color: "from-green-500 to-green-700",    ages: ["3-4","5-6"],       gameId: "match-numbers" },
  { path: "/maths/memory",       title: "Memory Cards",      description: "Find the matching pairs!",        emoji: "🃏", color: "from-teal-500 to-teal-700",      ages: ["3-4","5-6","7-8"], gameId: "memory-cards" },
  { path: "/maths/color",        title: "Colour Match",      description: "Name the colour!",                emoji: "🎨", color: "from-pink-500 to-pink-700",      ages: ["3-4","5-6"],       gameId: "color-match" },
  { path: "/maths/dice",         title: "Dice Counting",     description: "Count the dots on the dice!",     emoji: "🎲", color: "from-blue-500 to-blue-700",      ages: ["5-6","7-8"],       gameId: "dice-counting" },
  { path: "/maths/diceflash",    title: "Dice Flash!",       description: "Remember the dice — how many?",   emoji: "⚡", color: "from-yellow-500 to-amber-600",   ages: ["3-4","5-6","7-8"], gameId: "dice-flash" },
  { path: "/maths/bigger",       title: "Which is Bigger?",  description: "Pick the bigger number!",         emoji: "📈", color: "from-indigo-500 to-indigo-700",  ages: ["5-6","7-8"],       gameId: "which-bigger" },
  { path: "/maths/smaller",      title: "Which is Smaller?", description: "Pick the smaller number!",        emoji: "📉", color: "from-cyan-500 to-cyan-700",      ages: ["5-6","7-8"],       gameId: "which-smaller" },
  { path: "/maths/addition",     title: "Adding Up",         description: "Add pictures together!",          emoji: "➕", color: "from-purple-500 to-purple-700",  ages: ["5-6","7-8"],       gameId: "addition" },
  { path: "/maths/missing",      title: "Missing Number",    description: "Fill in the gap!",                emoji: "❓", color: "from-amber-500 to-amber-700",    ages: ["5-6","7-8"],       gameId: "missing-number" },
  { path: "/maths/bonds",        title: "Number Bonds",      description: "What makes 10?",                  emoji: "🔟", color: "from-emerald-500 to-emerald-700",ages: ["5-6"],             gameId: "number-bonds" },
  { path: "/maths/timed",        title: "Timed Maths",       description: "How fast can you go?",            emoji: "⏱️", color: "from-rose-500 to-rose-700",      ages: ["5-6","7-8"],       gameId: "timed-maths" },
  { path: "/maths/subtraction",  title: "Taking Away",       description: "Subtract and find the answer!",   emoji: "➖", color: "from-red-500 to-red-700",        ages: ["7-8"],             gameId: "subtraction" },
  { path: "/maths/times",        title: "Times Tables",      description: "Groups make multiplication fun!", emoji: "✖️", color: "from-violet-500 to-violet-700",  ages: ["7-8"],             gameId: "multiplication" },
  { path: "/maths/wordproblems", title: "Word Problems",     description: "Read, think, and solve!",         emoji: "📖", color: "from-sky-500 to-sky-700",        ages: ["7-8"],             gameId: "word-problems" },
  { path: "/maths/money",        title: "Money Maths",       description: "Count coins and notes!",          emoji: "💰", color: "from-yellow-500 to-yellow-700",  ages: ["7-8"],             gameId: "money-count" },
  { path: "/maths/ninja",        title: "Number Ninja ⚡",   description: "Quick-fire mental maths!",        emoji: "🥷", color: "from-gray-700 to-gray-900",      ages: ["5-6","7-8"],       gameId: "number-ninja" },
];

export default function Maths() {
  const [, setLocation] = useLocation();
  const { activeProfile, gameResults } = useAppContext();
  if (!activeProfile) { setLocation("/"); return null; }

  const ageRange = activeProfile.ageRange;
  const played = new Set(gameResults.filter(r => r.childId === activeProfile.id).map(r => r.gameId));
  const relevant = ALL_GAMES.filter(g => g.ages.includes(ageRange));

  const card = (g: GameDef, i: number, dimmed = false) => (
    <motion.div key={g.path}
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: dimmed ? 0.55 : 1, y: 0 }}
      transition={{ delay: i * 0.05, type: "spring", stiffness: 130 }}
      whileHover={{ scale: dimmed ? 1.02 : 1.05 }} whileTap={{ scale: 0.96 }}
      onClick={() => { sounds.pop(); setLocation(g.path); }}
      className={`cursor-pointer bg-gradient-to-br ${g.color} rounded-[2.5rem] p-6 shadow-xl text-white flex flex-col items-center text-center relative`}
      data-testid={`card-game-${g.gameId}`}>
      {!played.has(g.gameId) && !dimmed && <span className="absolute top-4 right-4 bg-white/30 text-white text-xs font-black px-3 py-1 rounded-full">NEW</span>}
      {played.has(g.gameId) && <span className="absolute top-4 right-4 text-xl">✅</span>}
      {dimmed && <span className="absolute top-4 right-4 bg-black/20 text-white text-xs font-black px-3 py-1 rounded-full">Other age</span>}
      <div className="text-6xl mb-3">{g.emoji}</div>
      <h2 className="text-xl font-black mb-1">{g.title}</h2>
      <p className="text-sm font-bold opacity-90">{g.description}</p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center gap-5 mb-8 bg-card rounded-[2rem] p-6 border-4 border-card-border shadow-md">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.click(); setLocation("/home"); }}
            className="h-16 px-6 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground font-black text-xl border-4 border-border transition-colors">
            ← Back
          </motion.button>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground">Maths Games 🔢</h1>
            <p className="text-xl font-bold text-muted-foreground">
              {relevant.length} games for {ageRange} year olds · {played.size} played
            </p>
          </div>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {relevant.map((g, i) => card(g, i))}
        </div>
      </div>
    </div>
  );
}
