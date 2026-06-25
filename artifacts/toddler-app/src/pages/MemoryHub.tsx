import React from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";

const GAMES = [
  { path: "/memory/cards",    title: "Memory Cards",     description: "Find the matching pairs!", emoji: "🃏", color: "from-teal-500 to-teal-700",    gameId: "memory-cards" },
  { path: "/memory/sequence", title: "Sequence Memory",  description: "Remember the order!",      emoji: "🔢", color: "from-blue-500 to-blue-700",    gameId: "sequence-memory" },
  { path: "/memory/animal",   title: "Animal Memory",    description: "Remember the animals!",    emoji: "🐾", color: "from-orange-500 to-orange-700", gameId: "animal-memory" },
];

export default function MemoryHub() {
  const [, setLocation] = useLocation();
  const { activeProfile, gameResults } = useAppContext();
  if (!activeProfile) { setLocation("/"); return null; }

  const played = new Set(gameResults.filter(r => r.childId === activeProfile.id).map(r => r.gameId));

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-5 mb-8 bg-card rounded-[2rem] p-6 border-4 border-card-border shadow-md">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.click(); setLocation("/home"); }}
            className="h-16 px-6 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground font-black text-xl border-4 border-border transition-colors">
            ← Back
          </motion.button>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground">Memory Games 🃏</h1>
            <p className="text-xl font-bold text-muted-foreground">Train your memory!</p>
          </div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {GAMES.map((g, i) => (
            <motion.div key={g.path}
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: "spring" }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
              onClick={() => { sounds.pop(); setLocation(g.path); }}
              className={`cursor-pointer bg-gradient-to-br ${g.color} rounded-[2.5rem] p-8 shadow-xl text-white flex flex-col items-center text-center relative`}>
              {!played.has(g.gameId) && <span className="absolute top-4 right-4 bg-white/30 text-white text-xs font-black px-3 py-1 rounded-full">NEW</span>}
              {played.has(g.gameId) && <span className="absolute top-4 right-4 text-xl">✅</span>}
              <div className="text-8xl mb-4">{g.emoji}</div>
              <h2 className="text-2xl font-black mb-2">{g.title}</h2>
              <p className="text-base font-bold opacity-90">{g.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
