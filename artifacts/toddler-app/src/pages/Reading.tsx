import React from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";

interface GameDef { path: string; title: string; description: string; emoji: string; color: string; ages: ("3-4"|"5-6"|"7-8")[]; gameId: string; }

const ALL_GAMES: GameDef[] = [
  { path: "/reading/write-name",      title: "Write My Name",     description: "Trace and write your own name!",  emoji: "✏️", color: "from-indigo-500 to-indigo-700", ages: ["3-4","5-6","7-8"], gameId: "write-name" },
  { path: "/reading/phonics-build",   title: "Build the Word",    description: "Hear a word, build it!",          emoji: "🧱", color: "from-amber-500 to-amber-700",   ages: ["5-6"],             gameId: "phonics-build-word" },

  { path: "/reading/alphabet",    title: "Alphabet Tap",      description: "Find the right letter!",          emoji: "🔤", color: "from-blue-500 to-blue-700",     ages: ["3-4"],        gameId: "alphabet-tap" },
  { path: "/reading/letterfill",  title: "Letter Fill",       description: "Fill in the missing letter!",     emoji: "🔡", color: "from-cyan-500 to-cyan-700",     ages: ["3-4"],        gameId: "letter-fill" },
  { path: "/reading/picture",     title: "Picture & Word",    description: "Match the picture to its word!",  emoji: "🖼️", color: "from-orange-500 to-orange-700", ages: ["3-4","5-6"],  gameId: "match-picture-word" },
  { path: "/reading/emotions",    title: "How Do They Feel?", description: "Name the feelings!",              emoji: "😊", color: "from-yellow-500 to-yellow-700", ages: ["3-4","5-6"],  gameId: "happy-sad" },
  { path: "/reading/rhyming",     title: "Rhyming Words",     description: "Find the word that rhymes!",      emoji: "🎵", color: "from-green-500 to-green-700",   ages: ["5-6"],        gameId: "rhyming-words" },
  { path: "/reading/fillin",      title: "Fill in the Word",  description: "Complete the sentence!",          emoji: "✍️", color: "from-purple-500 to-purple-700", ages: ["5-6","7-8"],  gameId: "fill-in-word" },
  { path: "/reading/missing",     title: "Missing Letter",    description: "What letter is missing?",         emoji: "🔡", color: "from-teal-500 to-teal-700",     ages: ["5-6"],        gameId: "missing-letter" },
  { path: "/reading/spelling",    title: "Spelling Challenge",description: "Pick the correct spelling!",      emoji: "✏️", color: "from-pink-500 to-pink-700",     ages: ["7-8"],        gameId: "spelling-quiz" },
];

export default function Reading() {
  const [, setLocation] = useLocation();
  const { activeProfile, gameResults } = useAppContext();
  if (!activeProfile) { setLocation("/"); return null; }

  const ageRange = activeProfile.ageRange;
  const played = new Set(gameResults.filter(r => r.childId === activeProfile.id).map(r => r.gameId));
  const relevant = ALL_GAMES.filter(g => g.ages.includes(ageRange));

  const card = (g: GameDef, i: number, dimmed = false) => (
    <motion.div key={g.path}
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: dimmed ? 0.55 : 1, y: 0 }}
      transition={{ delay: i * 0.07, type: "spring" }}
      whileHover={{ scale: dimmed ? 1.02 : 1.05 }} whileTap={{ scale: 0.96 }}
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
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-5 mb-8 bg-card rounded-[2rem] p-6 border-4 border-card-border shadow-md">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.click(); setLocation("/home"); }}
            className="h-16 px-6 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground font-black text-xl border-4 border-border transition-colors">
            ← Back
          </motion.button>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground">Reading & Words 📖</h1>
            <p className="text-xl font-bold text-muted-foreground">{relevant.length} games for {ageRange} year olds</p>
          </div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {relevant.map((g, i) => card(g, i))}
        </div>
      </div>
    </div>
  );
}
