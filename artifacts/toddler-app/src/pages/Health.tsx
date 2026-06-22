import React from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";

interface GameDef { path: string; title: string; description: string; emoji: string; color: string; ages: ("3-4"|"5-6"|"7-8")[]; gameId: string; }

const ALL_GAMES: GameDef[] = [
  { path: "/health/fruitveg",  title: "Fruit or Veg?",      description: "Can you tell a fruit from a vegetable?",  emoji: "🍎", color: "from-green-500 to-emerald-700",  ages: ["3-4","5-6"],       gameId: "pick-fruit-veg" },
  { path: "/health/drinks",    title: "Drink Choices",       description: "Which drinks are good for you?",          emoji: "💧", color: "from-blue-400 to-blue-600",      ages: ["3-4","5-6"],       gameId: "drink-choices" },
  { path: "/science/food",     title: "Healthy Food",        description: "Which foods help you grow strong?",       emoji: "🥦", color: "from-teal-500 to-teal-700",      ages: ["3-4","5-6"],       gameId: "food-sorting" },
  { path: "/health/lunchbox",  title: "Healthy Lunchbox",    description: "Build a great lunchbox!",                 emoji: "🥪", color: "from-lime-500 to-lime-700",      ages: ["5-6","7-8"],       gameId: "healthy-lunchbox" },
  { path: "/health/foodgroups",title: "Food Groups",         description: "Which food group is it?",                emoji: "🍽️", color: "from-orange-500 to-orange-700",  ages: ["7-8"],             gameId: "food-groups" },
  { path: "/health/time",      title: "Time Telling",        description: "What does the clock say?",                emoji: "🕐", color: "from-indigo-500 to-indigo-700",  ages: ["7-8"],             gameId: "time-telling" },
];

export default function Health() {
  const [, setLocation] = useLocation();
  const { activeProfile, gameResults } = useAppContext();
  if (!activeProfile) { setLocation("/"); return null; }

  const ageRange = activeProfile.ageRange;
  const played = new Set(gameResults.filter(r => r.childId === activeProfile.id).map(r => r.gameId));
  const relevant = ALL_GAMES.filter(g => g.ages.includes(ageRange));
  const other = ALL_GAMES.filter(g => !g.ages.includes(ageRange));

  const card = (g: GameDef, i: number, dimmed = false) => (
    <motion.div key={g.path}
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: dimmed ? 0.55 : 1, y: 0 }}
      transition={{ delay: i * 0.07, type: "spring" }}
      whileHover={{ scale: dimmed ? 1.02 : 1.06 }} whileTap={{ scale: 0.96 }}
      onClick={() => { sounds.pop(); setLocation(g.path); }}
      className={`cursor-pointer bg-gradient-to-br ${g.color} rounded-[2.5rem] p-7 shadow-xl text-white flex flex-col items-center text-center relative`}
      data-testid={`card-game-${g.gameId}`}>
      {!played.has(g.gameId) && !dimmed && <span className="absolute top-4 right-4 bg-white/30 text-white text-xs font-black px-3 py-1 rounded-full">NEW</span>}
      {played.has(g.gameId) && <span className="absolute top-4 right-4 text-xl">✅</span>}
      {dimmed && <span className="absolute top-4 right-4 bg-black/20 text-white text-xs font-black px-3 py-1 rounded-full">Other age</span>}
      <div className="text-7xl mb-4">{g.emoji}</div>
      <h2 className="text-2xl font-black mb-2">{g.title}</h2>
      <p className="text-base font-bold opacity-90">{g.description}</p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center gap-5 mb-8 bg-card rounded-[2rem] p-6 border-4 border-card-border shadow-md">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.click(); setLocation("/home"); }}
            className="h-16 px-6 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground font-black text-xl border-4 border-border transition-colors">
            ← Back
          </motion.button>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground">Health & Food 🥦</h1>
            <p className="text-xl font-bold text-muted-foreground">{relevant.length} games for {ageRange} year olds</p>
          </div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {relevant.map((g, i) => card(g, i))}
        </div>
        {other.length > 0 && (
          <>
            <h2 className="text-2xl font-black text-muted-foreground mb-4">Other age groups</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {other.map((g, i) => card(g, i, true))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
