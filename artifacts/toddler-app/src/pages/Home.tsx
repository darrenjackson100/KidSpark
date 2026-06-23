import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { useSoundContext } from "@/context/SoundContext";
import { sounds } from "@/lib/sounds";
import { THEMES } from "@/lib/themes";
import { computeBalance } from "@/lib/points";
import { getSpecies, buildPetContext, computePetNeeds, overallMood } from "@/lib/pets";

// A themed "learning world" the child can dive into.
interface World {
  id: string; title: string; desc: string; icon: string;
  gradient: string; decor: string[]; path: string;
}

// Main Learning worlds
const MAIN_WORLDS: World[] = [
  { id: "maths",   title: "Maths World",     desc: "Count, add & find treasure", icon: "🔢", gradient: "from-blue-500 to-indigo-700",   decor: ["7", "✨", "3", "⭐"], path: "/maths" },
  { id: "reading", title: "Reading Kingdom", desc: "Letters, words & magic pages", icon: "📖", gradient: "from-green-500 to-emerald-700", decor: ["A", "✨", "B", "C"],  path: "/reading" },
  { id: "science", title: "Science Lab",     desc: "Bubbles, planets & experiments", icon: "🧪", gradient: "from-teal-500 to-cyan-700",    decor: ["🫧", "🪐", "✨"],     path: "/science" },
  { id: "animals", title: "Animal Safari",   desc: "Meet animals & their sounds", icon: "🦁", gradient: "from-orange-500 to-amber-700",  decor: ["🐾", "🦒", "✨"],     path: "/animals" },
];

// Creative & Memory worlds
const CREATIVE_WORLDS: World[] = [
  { id: "memory",  title: "Memory Mountain", desc: "Flip cards & train your brain", icon: "🃏", gradient: "from-purple-500 to-fuchsia-700", decor: ["🧩", "🧠", "✨"], path: "/memory-hub" },
  { id: "colours", title: "Colour Castle",   desc: "Paint, shapes & rainbows", icon: "🎨", gradient: "from-pink-500 to-rose-700",     decor: ["🌈", "🔵", "🟡"], path: "/colours" },
  { id: "health",  title: "Health Hero",     desc: "Fruit, veg & a healthy body", icon: "🥦", gradient: "from-emerald-500 to-green-700", decor: ["🍎", "💧", "🥕"], path: "/health" },
];

const GREETINGS = ["Ready to learn today?", "Let's have fun!", "You're going to do great!", "Time to play and learn!", "What will we discover today?"];
const TOTAL_GAMES = 35;

export default function Home() {
  const [, setLocation] = useLocation();
  const { activeProfile, gameResults, rewardPurchases } = useAppContext();
  const { muted, toggleMute, ttsEnabled, toggleTTS } = useSoundContext();

  useEffect(() => { if (!activeProfile) setLocation("/"); }, [activeProfile, setLocation]);
  if (!activeProfile) return null;

  const greeting = GREETINGS[new Date().getDay() % GREETINGS.length];
  const myResults = gameResults.filter(r => r.childId === activeProfile.id);
  const totalStars = myResults.reduce((acc, r) => acc + r.stars, 0);
  const uniqueGames = new Set(myResults.map(r => r.gameId)).size;
  const progressPct = Math.min(100, Math.round((uniqueGames / TOTAL_GAMES) * 100));
  const pointsEnabled = activeProfile.pointsEnabled ?? false;
  const myPurchases = rewardPurchases.filter(p => p.childId === activeProfile.id);
  const pointsBalance = computeBalance(myResults, myPurchases);
  const didDailyToday = myResults.some(r =>
    r.gameId === "daily-challenge" && r.playedAt.slice(0, 10) === new Date().toISOString().slice(0, 10)
  );
  const badgeCount = [
    myResults.length >= 1, myResults.filter(g => g.category === "maths").length >= 3,
    myResults.filter(g => g.category === "animals").length >= 3, myResults.filter(g => g.category === "reading").length >= 1,
    myResults.some(g => g.score === g.total), myResults.length >= 10,
    myResults.some(g => g.gameId === "daily-challenge"), myResults.some(g => g.gameId === "memory-cards"),
    myResults.some(g => g.gameId === "timed-maths" && g.stars === 3), myResults.filter(g => g.category === "science").length >= 1,
    myResults.filter(g => g.category === "health").length >= 1,
  ].filter(Boolean).length;

  const theme = THEMES[activeProfile.theme ?? "default"] ?? THEMES.default;
  const nav = (path: string) => { sounds.pop(); setLocation(path); };

  // Virtual pet summary for the "My Pet" card.
  const pet = activeProfile.pet;
  const petCtx = pet ? buildPetContext(myResults, activeProfile.streakDays ?? 0) : null;
  const petSpecies = pet ? getSpecies(pet.species) : null;
  const petNeeds = pet && petCtx ? computePetNeeds(pet, petCtx.lastLearnAt) : null;
  const petMood = petNeeds ? overallMood(petNeeds) : null;
  const petNeedsCare = petNeeds ? Object.values(petNeeds).some(v => v < 35) : false;

  const adultCards: { id: string; title: string; desc: string; icon: string; path: string }[] = [
    { id: "notes", title: "Notes", desc: "Tips & reminders", icon: "📝", path: "/notes" },
    { id: "class", title: "Class Summary", desc: "Overview & report", icon: "👨‍🎓", path: "/class" },
    ...(activeProfile.mode === "teacher"
      ? [{ id: "classroom", title: "Classroom", desc: "Manage your class", icon: "🏫", path: "/classroom" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="bg-card rounded-[2rem] border-4 border-card-border shadow-md p-5 mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br ${theme.gradientFrom} ${theme.gradientTo} flex items-center justify-center text-4xl shadow-lg flex-shrink-0`}>
              {activeProfile.avatarPhoto
                ? <img src={activeProfile.avatarPhoto} alt={`${activeProfile.name}'s photo`} className="w-full h-full object-cover" />
                : (activeProfile.avatarEmoji ?? "👋")}
            </div>
            <div>
              <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring" }}
                className="text-3xl md:text-4xl font-black text-foreground">
                Hi, {activeProfile.name}!
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="text-lg font-bold text-muted-foreground">{greeting} 🌟</motion.p>
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            {/* Toggle switches */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <ToggleControl
                emoji={muted ? "🔇" : "🔊"} label="Sound" on={!muted}
                onToggle={() => { sounds.click(); toggleMute(); }}
                testId="button-toggle-mute" />
              <ToggleControl
                emoji="📖" label="Read Aloud" on={ttsEnabled}
                onToggle={() => { sounds.click(); toggleTTS(); }}
                testId="button-toggle-tts" />
            </div>
            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {activeProfile.mode === "teacher" && (
                <button onClick={() => nav("/classroom")}
                  className="h-12 flex-1 min-w-[6rem] px-3 sm:px-4 rounded-xl bg-purple-500 hover:bg-purple-600 active:scale-95 text-white font-black text-sm sm:text-base border-4 border-purple-600 transition-all shadow-md flex items-center justify-center gap-1 whitespace-nowrap"
                  data-testid="button-classroom">
                  🏫 Live Class
                </button>
              )}
              <button onClick={() => { sounds.click(); setLocation(`/edit-profile/${activeProfile.id}`); }}
                className="h-12 flex-1 min-w-[5rem] px-3 sm:px-4 rounded-xl bg-muted hover:bg-muted/70 active:scale-95 text-muted-foreground font-bold text-sm sm:text-base border-4 border-border transition-all flex items-center justify-center gap-1 whitespace-nowrap"
                data-testid="button-edit-my-profile">
                ✏️ Settings
              </button>
              <button onClick={() => { sounds.click(); setLocation("/"); }}
                className="h-12 flex-1 min-w-[5rem] px-3 sm:px-4 rounded-xl bg-muted hover:bg-muted/70 active:scale-95 text-muted-foreground font-bold text-sm sm:text-base border-4 border-border transition-all flex items-center justify-center gap-1 whitespace-nowrap"
                data-testid="button-switch-profile">
                🔄 Swap Profile
              </button>
            </div>
          </div>
        </header>

        {/* Two big cards: Rewards Shop + My Pet */}
          <div className={`grid gap-3 sm:gap-4 mb-5 ${pointsEnabled ? "grid-cols-2" : "grid-cols-1"}`}>          {pointsEnabled && (
            <motion.button type="button"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => nav("/shop")}
              className="text-left cursor-pointer rounded-[2rem] p-5 sm:p-6 shadow-lg border-4 border-transparent bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 text-white fflex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-2 sm:gap-5 min-h-[120px]"
              data-testid="card-rewards-shop">
              <motion.div className="text-5xl sm:text-6xl flex-shrink-0 drop-shadow-md"
                animate={{ y: [0, -6, 0], rotate: [0, 6, -6, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}>
                🛍️
              </motion.div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">Rewards Shop</h2>
                <p className="text-2xl sm:text-3xl font-black text-white leading-tight mt-0.5">{pointsBalance} 💰</p>
                <p className="text-sm sm:text-base font-bold text-white/90 leading-snug">Points available to spend</p>
              </div>
              <div className="hidden sm:flex bg-white/20 text-white font-black text-base px-4 py-2 rounded-2xl flex-shrink-0">Open →</div>
            </motion.button>
          )}

          <motion.button type="button"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => nav("/pet")}
            className={`text-left cursor-pointer rounded-[2rem] p-5 sm:p-6 shadow-lg border-4 border-transparent text-white flex items-center gap-4 sm:gap-5 min-h-[120px] ${
              pet
                ? "bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-500"
                : "bg-gradient-to-br from-violet-400 via-purple-400 to-fuchsia-400"
            }`}
            data-testid="card-my-pet">
            <motion.div className="text-5xl sm:text-6xl flex-shrink-0 drop-shadow-md"
              animate={{ y: [0, -6, 0], rotate: [0, 6, -6, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
              {pet && petSpecies ? petSpecies.emoji : "🐣"}
            </motion.div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">My Pet</h2>
              {pet && petSpecies && petCtx && petMood ? (
                <>
                  <p className="text-2xl sm:text-3xl font-black text-white leading-tight mt-0.5 truncate">
                    {pet.petName || petSpecies.name}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-white/90 leading-snug">
                    {petMood.emoji} {petMood.label} · {petCtx.stage.label}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl sm:text-3xl font-black text-white leading-tight mt-0.5">Adopt a Pet!</p>
                  <p className="text-sm sm:text-base font-bold text-white/90 leading-snug">A friend that grows as you learn</p>
                </>
              )}
            </div>
            {petNeedsCare && (
              <span className="bg-white text-rose-600 font-black text-xs sm:text-sm px-3 py-1 rounded-full flex-shrink-0 animate-pulse">
                Needs you!
              </span>
            )}
            <div className="hidden sm:flex bg-white/20 text-white font-black text-base px-4 py-2 rounded-2xl flex-shrink-0">
              {pet ? "Visit →" : "Adopt →"}
            </div>
          </motion.button>
        </div>

        {/* Timed Play */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={() => nav("/timed-play")}
          className="cursor-pointer rounded-[2rem] p-4 sm:p-5 mb-3 shadow-lg border-4 border-transparent bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white flex items-center gap-3 sm:gap-5"
          data-testid="card-timed-play">
          <div className="text-4xl sm:text-5xl flex-shrink-0">⏱️</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-white">Timed Play!</h2>
            <p className="text-sm sm:text-base font-bold text-white/90">5, 10, 15 or 30 minutes · mixed questions</p>
          </div>
          <div className="bg-white/20 text-white font-black text-base sm:text-lg px-4 sm:px-5 py-2 rounded-2xl flex-shrink-0">Play →</div>
        </motion.div>

        {/* Daily Challenge */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={() => nav("/daily")}
          className={`cursor-pointer rounded-[2rem] p-4 sm:p-5 mb-7 shadow-lg border-4 flex items-center gap-3 sm:gap-5 ${
            didDailyToday ? "bg-green-50 border-green-200" : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-transparent"
          }`} data-testid="card-daily-challenge">
          <div className="text-4xl sm:text-5xl flex-shrink-0">📅</div>
          <div className="flex-1 min-w-0">
            <h2 className={`text-xl sm:text-2xl font-black ${didDailyToday ? "text-green-800" : "text-white"}`}>
              {didDailyToday ? "Daily Challenge Done! ✅" : "Today's Daily Challenge!"}
            </h2>
            <p className={`text-sm sm:text-base font-bold mt-0.5 ${didDailyToday ? "text-green-600" : "text-white/90"}`}>
              {didDailyToday ? "Come back tomorrow for more!" : `${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} — fresh every day`}
            </p>
          </div>
          {!didDailyToday && <div className="bg-white/20 text-white font-black text-base sm:text-lg px-4 sm:px-5 py-2 rounded-2xl flex-shrink-0">Play →</div>}
        </motion.div>

        {/* Choose Your Adventure */}
        <div className="mb-4 sm:mb-6 px-1">
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground flex items-center gap-2">
            <span>🗺️</span> Choose Your Adventure
          </motion.h2>
          <p className="text-base sm:text-lg font-bold text-muted-foreground mt-1">Pick a world and start learning!</p>
        </div>

        <GroupLabel emoji="📚" title="Main Learning" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-7">
          {MAIN_WORLDS.map((w, i) => (
            <WorldCard key={w.id} world={w} index={i} onNavigate={nav} />
          ))}
        </div>

        <GroupLabel emoji="🎨" title="Creative & Memory" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-9">
          {CREATIVE_WORLDS.map((w, i) => (
            <WorldCard key={w.id} world={w} index={i} onNavigate={nav} />
          ))}
        </div>

        {/* Grown-Up Zone (adult-only, locked) */}
        <GroupLabel emoji="🔒" title="Grown-Up Zone" subtitle="Passcode needed — for parents & teachers" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {adultCards.map((c, i) => (
            <AdultCard key={c.id} card={c} index={i} onNavigate={nav} />
          ))}
        </div>

        {/* My Progress — lower & adult-styled */}
        <motion.button
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={() => nav("/progress")}
          className="w-full text-left cursor-pointer rounded-[2rem] p-5 sm:p-7 shadow-xl border-4 border-slate-700 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white relative"
          data-testid="card-home-progress">
          <span className="absolute top-4 right-4 text-base bg-white/15 rounded-full w-9 h-9 flex items-center justify-center">🔒</span>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-5xl sm:text-6xl flex-shrink-0 drop-shadow-md">📊</div>
            <div className="flex-1 min-w-0 pr-8">
              <h2 className="text-2xl sm:text-3xl font-black leading-tight">My Progress</h2>
              <p className="text-sm sm:text-lg font-bold text-white/70 leading-snug">Scores, badges, reviews & the learning journey</p>
            </div>
            <div className="hidden sm:flex bg-white/15 text-white font-black text-lg px-6 py-3 rounded-2xl flex-shrink-0">View →</div>
          </div>

          <div className="mt-4 sm:mt-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm sm:text-base font-black text-white/80">Games Explored</span>
              <span className="text-sm sm:text-base font-black text-white">{uniqueGames} / {TOTAL_GAMES}</span>
            </div>
            <div className="h-4 sm:h-5 bg-white/20 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { emoji: "⭐", value: totalStars, label: "Stars" },
              { emoji: "🏆", value: badgeCount, label: "Badges" },
              { emoji: "🎮", value: myResults.length, label: "Games" },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-2xl py-2 sm:py-3 px-2 text-center">
                <div className="text-xl sm:text-2xl leading-none mb-0.5">{s.emoji}</div>
                <div className="text-lg sm:text-2xl font-black leading-tight">{s.value}</div>
                <div className="text-[10px] sm:text-xs font-bold text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.button>

      </div>
    </div>
  );
}

function GroupLabel({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 sm:mb-4 px-1">
      <span className="text-2xl sm:text-3xl">{emoji}</span>
      <div>
        <h3 className="text-xl sm:text-2xl font-black text-foreground leading-tight">{title}</h3>
        {subtitle && <p className="text-xs sm:text-sm font-bold text-muted-foreground leading-tight">{subtitle}</p>}
      </div>
    </div>
  );
}

// A small sparkle burst that replays whenever `trigger` changes (on tap).
function SparkleBurst({ trigger }: { trigger: number }) {
  if (!trigger) return null;
  const count = 7;
  return (
    <span key={trigger} aria-hidden className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dist = 64;
        return (
          <motion.span key={i} className="absolute text-lg sm:text-xl"
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, scale: [0, 1.3, 0], opacity: [1, 1, 0] }}
            transition={{ duration: 0.6, ease: "easeOut" }}>
            ✨
          </motion.span>
        );
      })}
    </span>
  );
}

function WorldCard({ world, index, onNavigate }: { world: World; index: number; onNavigate: (path: string) => void }) {
  const [burst, setBurst] = useState(0);
  const handleClick = () => { setBurst(b => b + 1); onNavigate(world.path); };
  return (
    <motion.button type="button"
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.05, type: "spring", stiffness: 120 }}
      whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={`group relative overflow-hidden cursor-pointer rounded-[2rem] p-5 sm:p-6 text-center text-white shadow-lg hover:shadow-2xl min-h-[170px] sm:min-h-[200px] flex flex-col items-center justify-center bg-gradient-to-br ${world.gradient}`}
      data-testid={`card-home-${world.id}`}>
      {/* soft glow on hover */}
      <span className={`pointer-events-none absolute -inset-8 opacity-0 group-hover:opacity-40 blur-3xl transition-opacity duration-300 bg-gradient-to-br ${world.gradient}`} />
      {/* floating themed decor */}
      {world.decor.map((d, i) => (
        <motion.span key={i} aria-hidden
          className="pointer-events-none absolute text-base sm:text-xl font-black opacity-40 select-none"
          style={{ left: `${10 + i * 24}%`, top: `${12 + (i % 2) * 62}%` }}
          animate={{ y: [0, -10, 0], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}>
          {d}
        </motion.span>
      ))}
      <SparkleBurst trigger={burst} />
      <div className="relative z-10 flex flex-col items-center">
        <motion.div className="text-5xl sm:text-6xl mb-2 drop-shadow-md"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}>
          {world.icon}
        </motion.div>
        <h3 className="text-lg sm:text-xl font-black leading-tight">{world.title}</h3>
        <p className="text-xs sm:text-sm font-bold text-white/90 leading-snug mt-1">{world.desc}</p>
      </div>
    </motion.button>
  );
}

function AdultCard({ card, index, onNavigate }: {
  card: { id: string; title: string; desc: string; icon: string; path: string };
  index: number; onNavigate: (path: string) => void;
}) {
  return (
    <motion.button type="button"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.05 }}
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      onClick={() => onNavigate(card.path)}
      className="relative cursor-pointer rounded-[1.75rem] p-5 text-left shadow-md border-4 border-slate-700 bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center gap-4 min-h-[96px]"
      data-testid={`card-home-${card.id}`}>
      <span className="absolute top-3 right-3 text-sm bg-white/15 rounded-full w-8 h-8 flex items-center justify-center">🔒</span>
      <div className="text-4xl flex-shrink-0">{card.icon}</div>
      <div className="min-w-0 pr-6">
        <h3 className="text-lg font-black leading-tight">{card.title}</h3>
        <p className="text-xs font-bold text-white/60 leading-snug">{card.desc}</p>
      </div>
    </motion.button>
  );
}

function ToggleControl({ emoji, label, on, onToggle, testId }: {
  emoji: string; label: string; on: boolean; onToggle: () => void; testId: string;
}) {
  return (
    <button onClick={onToggle} role="switch" aria-checked={on} aria-label={`${label} ${on ? "on" : "off"}`}
      className="flex items-center gap-2 h-12 px-3 rounded-xl border-4 border-border bg-muted hover:bg-muted/70 active:scale-95 transition-all"
      data-testid={testId}>
      <span className="text-xl leading-none flex-shrink-0">{emoji}</span>
      <span className="font-bold text-sm text-foreground whitespace-nowrap">{label}</span>
      <span className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${on ? "bg-green-500" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${on ? "translate-x-5" : "translate-x-0"}`} />
      </span>
      <span className={`text-[10px] font-black w-7 text-center flex-shrink-0 ${on ? "text-green-600" : "text-gray-400"}`}>
        {on ? "ON" : "OFF"}
      </span>
    </button>
  );
}
