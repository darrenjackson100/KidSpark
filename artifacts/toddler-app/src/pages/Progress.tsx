import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAppContext, GameResult, ChildProfile, QuestionRecord } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";

function Stars({ count }: { count: number }) {
  return <span className="flex gap-1">{[1,2,3].map(s => <span key={s} className={`text-xl ${s <= count ? "" : "opacity-20 grayscale"}`}>⭐</span>)}</span>;
}
function formatTime(secs?: number) {
  if (!secs) return null;
  const m = Math.floor(secs / 60), s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface Badge {
  id: string; emoji: string; label: string; desc: string; color: string; bg: string; border: string;
  check: (r: GameResult[], profile: ChildProfile) => boolean;
  progress?: (r: GameResult[], profile: ChildProfile) => { current: number; target: number };
}

const BADGES: Badge[] = [
  { id:"first-game",     emoji:"🎮", label:"First Steps",         desc:"Play your first game",                  color:"text-blue-700",    bg:"bg-blue-50",     border:"border-blue-200",    check:r=>r.length>=1, progress:r=>({current:Math.min(r.length,1),target:1}) },
  { id:"games-5",        emoji:"🌟", label:"5 Games",             desc:"Play 5 games total",                    color:"text-green-700",   bg:"bg-green-50",    border:"border-green-200",   check:r=>r.length>=5, progress:r=>({current:Math.min(r.length,5),target:5}) },
  { id:"games-10",       emoji:"🌟", label:"10 Games",            desc:"Play 10 games total",                   color:"text-green-700",   bg:"bg-green-50",    border:"border-green-200",   check:r=>r.length>=10,progress:r=>({current:Math.min(r.length,10),target:10}) },
  { id:"games-25",       emoji:"🚀", label:"25 Games",            desc:"Play 25 games total",                   color:"text-green-900",   bg:"bg-green-100",   border:"border-green-300",   check:r=>r.length>=25,progress:r=>({current:Math.min(r.length,25),target:25}) },
  { id:"games-50",       emoji:"👑", label:"50 Games",            desc:"Play 50 games total",                   color:"text-emerald-700", bg:"bg-emerald-50",  border:"border-emerald-200", check:r=>r.length>=50,progress:r=>({current:Math.min(r.length,50),target:50}) },
  { id:"explorer",       emoji:"🗺️", label:"Explorer",            desc:"Try 5 different games",                 color:"text-slate-700",   bg:"bg-slate-50",    border:"border-slate-200",   check:r=>new Set(r.map(g=>g.gameId)).size>=5, progress:r=>({current:Math.min(new Set(r.map(g=>g.gameId)).size,5),target:5}) },
  { id:"perfect-score",  emoji:"🏆", label:"Perfect Score",       desc:"Get every answer right in a game",      color:"text-yellow-700",  bg:"bg-yellow-50",   border:"border-yellow-200",  check:r=>r.some(g=>g.score===g.total) },
  { id:"ten-perfect",    emoji:"💯", label:"10 Perfect Scores",   desc:"Get 10 perfect scores",                 color:"text-yellow-900",  bg:"bg-yellow-100",  border:"border-yellow-300",  check:r=>r.filter(g=>g.score===g.total).length>=10, progress:r=>({current:Math.min(r.filter(g=>g.score===g.total).length,10),target:10}) },
  { id:"three-star",     emoji:"⭐", label:"Three Stars",         desc:"Earn 3 stars on any game",              color:"text-amber-700",   bg:"bg-amber-50",    border:"border-amber-200",   check:r=>r.some(g=>g.stars===3) },
  { id:"fifty-stars",    emoji:"💫", label:"Star Collector",      desc:"Earn 50 total stars",                   color:"text-yellow-700",  bg:"bg-yellow-50",   border:"border-yellow-200",  check:r=>r.reduce((a,g)=>a+g.stars,0)>=50, progress:r=>({current:Math.min(r.reduce((a,g)=>a+g.stars,0),50),target:50}) },
  { id:"maths-star",     emoji:"🔢", label:"Maths Star",          desc:"Play 3 maths games",                    color:"text-orange-700",  bg:"bg-orange-50",   border:"border-orange-200",  check:r=>r.filter(g=>g.category==="maths").length>=3, progress:r=>({current:Math.min(r.filter(g=>g.category==="maths").length,3),target:3}) },
  { id:"counting-champ", emoji:"🔢", label:"Counting Champion",   desc:"Complete 5 maths games",                color:"text-blue-700",    bg:"bg-blue-50",     border:"border-blue-200",    check:r=>r.filter(g=>g.category==="maths").length>=5, progress:r=>({current:Math.min(r.filter(g=>g.category==="maths").length,5),target:5}) },
  { id:"maths-master",   emoji:"🧮", label:"Maths Master",        desc:"Complete 10 maths games",               color:"text-blue-900",    bg:"bg-blue-100",    border:"border-blue-300",    check:r=>r.filter(g=>g.category==="maths").length>=10, progress:r=>({current:Math.min(r.filter(g=>g.category==="maths").length,10),target:10}) },
  { id:"number-ninja",   emoji:"🥷", label:"Number Ninja",        desc:"Complete Number Ninja",                  color:"text-gray-700",    bg:"bg-gray-100",    border:"border-gray-300",    check:r=>r.some(g=>g.gameId==="number-ninja") },
  { id:"speed-champ",    emoji:"⚡", label:"Fast Thinker",        desc:"Get 3 stars on Timed Maths",             color:"text-rose-700",    bg:"bg-rose-50",     border:"border-rose-200",    check:r=>r.some(g=>g.gameId==="timed-maths"&&g.stars===3) },
  { id:"money-champ",    emoji:"💰", label:"Money Champion",      desc:"Complete Money Maths",                   color:"text-yellow-700",  bg:"bg-yellow-50",   border:"border-yellow-200",  check:r=>r.some(g=>g.gameId==="money-count") },
  { id:"word-problem",   emoji:"📐", label:"Problem Solver",      desc:"Complete Word Problems",                 color:"text-sky-700",     bg:"bg-sky-50",      border:"border-sky-200",     check:r=>r.some(g=>g.gameId==="word-problems") },
  { id:"time-teller",    emoji:"🕐", label:"Time Teller",         desc:"Complete Time Telling",                  color:"text-indigo-700",  bg:"bg-indigo-50",   border:"border-indigo-200",  check:r=>r.some(g=>g.gameId==="time-telling") },
  { id:"animal-expert",  emoji:"🦁", label:"Animal Expert",       desc:"Play 3 animal games",                   color:"text-green-700",   bg:"bg-green-50",    border:"border-green-200",   check:r=>r.filter(g=>g.category==="animals").length>=3, progress:r=>({current:Math.min(r.filter(g=>g.category==="animals").length,3),target:3}) },
  { id:"animal-lover",   emoji:"🐾", label:"Animal Lover",        desc:"Play 6 different animal games",         color:"text-amber-700",   bg:"bg-amber-50",    border:"border-amber-200",   check:r=>new Set(r.filter(g=>g.category==="animals").map(g=>g.gameId)).size>=6, progress:r=>({current:Math.min(new Set(r.filter(g=>g.category==="animals").map(g=>g.gameId)).size,6),target:6}) },
  { id:"diet-expert",    emoji:"🥩", label:"Diet Detective",      desc:"Complete Animal Diets",                  color:"text-rose-700",    bg:"bg-rose-50",     border:"border-rose-200",    check:r=>r.some(g=>g.gameId==="animal-diet") },
  { id:"reading-rocket", emoji:"📖", label:"Reading Rocket",      desc:"Play your first reading game",           color:"text-indigo-700",  bg:"bg-indigo-50",   border:"border-indigo-200",  check:r=>r.filter(g=>g.category==="reading").length>=1 },
  { id:"word-wizard",    emoji:"✨", label:"Word Wizard",         desc:"Complete 5 reading games",              color:"text-purple-700",  bg:"bg-purple-50",   border:"border-purple-200",  check:r=>r.filter(g=>g.category==="reading").length>=5, progress:r=>({current:Math.min(r.filter(g=>g.category==="reading").length,5),target:5}) },
  { id:"spelling-star",  emoji:"🔡", label:"Spelling Star",       desc:"Complete Spelling Challenge",           color:"text-violet-700",  bg:"bg-violet-50",   border:"border-violet-200",  check:r=>r.some(g=>g.gameId==="spelling-quiz") },
  { id:"story-master",   emoji:"📚", label:"Story Master",        desc:"Complete Fill in the Word",             color:"text-indigo-700",  bg:"bg-indigo-50",   border:"border-indigo-200",  check:r=>r.some(g=>g.gameId==="fill-in-word") },
  { id:"science-exp",    emoji:"🧪", label:"Science Explorer",    desc:"Play your first science game",          color:"text-teal-700",    bg:"bg-teal-50",     border:"border-teal-200",    check:r=>r.filter(g=>g.category==="science").length>=1 },
  { id:"little-sci",     emoji:"🔬", label:"Little Scientist",    desc:"Complete 5 science games",              color:"text-cyan-700",    bg:"bg-cyan-50",     border:"border-cyan-200",    check:r=>r.filter(g=>g.category==="science").length>=5, progress:r=>({current:Math.min(r.filter(g=>g.category==="science").length,5),target:5}) },
  { id:"space-explorer", emoji:"🚀", label:"Space Explorer",      desc:"Complete Space Explorer",               color:"text-blue-900",    bg:"bg-blue-100",    border:"border-blue-300",    check:r=>r.some(g=>g.gameId==="space-facts") },
  { id:"sink-float",     emoji:"🌊", label:"Science Thinker",     desc:"Complete Sink or Float",                color:"text-slate-700",   bg:"bg-slate-50",    border:"border-slate-200",   check:r=>r.some(g=>g.gameId==="sink-or-float") },
  { id:"colour-champ",   emoji:"🎨", label:"Colour Champion",     desc:"Complete Colour Match",                 color:"text-pink-700",    bg:"bg-pink-50",     border:"border-pink-200",    check:r=>r.some(g=>g.gameId==="color-match") },
  { id:"shape-star",     emoji:"🔷", label:"Shape Superstar",     desc:"Complete Shape Sorting",                color:"text-blue-700",    bg:"bg-blue-50",     border:"border-blue-200",    check:r=>r.some(g=>g.gameId==="shape-sorting") },
  { id:"memory-master",  emoji:"🃏", label:"Memory Master",       desc:"Complete Memory Cards",                 color:"text-cyan-700",    bg:"bg-cyan-50",     border:"border-cyan-200",    check:r=>r.some(g=>g.gameId==="memory-cards") },
  // Health badges
  { id:"fruit-finder",   emoji:"🍎", label:"Fruit Finder",        desc:"Complete Fruit or Veg?",                color:"text-red-700",     bg:"bg-red-50",      border:"border-red-200",     check:r=>r.some(g=>g.gameId==="pick-fruit-veg") },
  { id:"veggie-hero",    emoji:"🥦", label:"Veggie Hero",         desc:"Play 3 health games",                   color:"text-green-700",   bg:"bg-green-50",    border:"border-green-200",   check:r=>r.filter(g=>g.category==="health").length>=3, progress:r=>({current:Math.min(r.filter(g=>g.category==="health").length,3),target:3}) },
  { id:"water-champ",    emoji:"💧", label:"Water Champion",      desc:"Complete Drink Choices",                color:"text-blue-700",    bg:"bg-blue-50",     border:"border-blue-200",    check:r=>r.some(g=>g.gameId==="drink-choices") },
  { id:"healthy-plate",  emoji:"🥗", label:"Healthy Plate Star",  desc:"Complete Healthy Lunchbox",             color:"text-emerald-700", bg:"bg-emerald-50",  border:"border-emerald-200", check:r=>r.some(g=>g.gameId==="healthy-lunchbox") },
  { id:"food-groups-exp",emoji:"🍽️", label:"Food Groups Expert",  desc:"Complete Food Groups",                  color:"text-orange-700",  bg:"bg-orange-50",   border:"border-orange-200",  check:r=>r.some(g=>g.gameId==="food-groups") },
  { id:"super-health",   emoji:"💚", label:"Super Health Learner",desc:"Complete 5 health games",               color:"text-green-900",   bg:"bg-green-100",   border:"border-green-300",   check:r=>r.filter(g=>g.category==="health").length>=5, progress:r=>({current:Math.min(r.filter(g=>g.category==="health").length,5),target:5}) },
  // Streak badges
  { id:"streak-3",       emoji:"🔥", label:"3 Day Streak",        desc:"Play 3 days in a row",                  color:"text-red-700",     bg:"bg-red-50",      border:"border-red-200",     check:(_,p)=>(p.streakDays??0)>=3, progress:(_,p)=>({current:Math.min(p.streakDays??0,3),target:3}) },
  { id:"streak-7",       emoji:"🔥", label:"7 Day Streak",        desc:"Play 7 days in a row",                  color:"text-orange-700",  bg:"bg-orange-50",   border:"border-orange-200",  check:(_,p)=>(p.streakDays??0)>=7, progress:(_,p)=>({current:Math.min(p.streakDays??0,7),target:7}) },
  { id:"streak-30",      emoji:"🏅", label:"30 Day Streak",       desc:"Play 30 days in a row",                 color:"text-red-900",     bg:"bg-red-100",     border:"border-red-300",     check:(_,p)=>(p.streakDays??0)>=30, progress:(_,p)=>({current:Math.min(p.streakDays??0,30),target:30}) },
  { id:"daily-learner",  emoji:"📅", label:"Daily Learner",       desc:"Complete a Daily Challenge",            color:"text-indigo-700",  bg:"bg-indigo-50",   border:"border-indigo-200",  check:r=>r.some(g=>g.gameId==="daily-challenge") },
];

const CATEGORY_FILTERS = [
  { key: "all",      label: "All",            emoji: "🎮" },
  { key: "maths",    label: "Maths",          emoji: "🔢" },
  { key: "animals",  label: "Animals",        emoji: "🦁" },
  { key: "reading",  label: "Reading",        emoji: "📖" },
  { key: "science",  label: "Science",        emoji: "🧪" },
  { key: "health",   label: "Health",         emoji: "🥦" },
  { key: "colours",  label: "Colours",        emoji: "🎨" },
  { key: "correct",  label: "Good Scores",    emoji: "✅" },
  { key: "practice", label: "Needs Practice", emoji: "⚠️" },
] as const;
type FilterKey = typeof CATEGORY_FILTERS[number]["key"];

const BAR_COLORS = ["#3b82f6","#f97316","#22c55e","#a855f7","#ec4899","#f59e0b","#14b8a6","#ef4444","#10b981"];

// Split a game name into at most `maxLines` balanced lines so labels wrap
// neatly under each bar instead of being truncated.
function wrapLabel(text: string, maxChars = 11, maxLines = 2): string[] {
  // Break any single word longer than maxChars into chunks so it never clips.
  const words = text.split(" ").flatMap(w => {
    if (w.length <= maxChars) return [w];
    const chunks: string[] = [];
    for (let i = 0; i < w.length; i += maxChars) chunks.push(w.slice(i, i + maxChars));
    return chunks;
  });
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1] + "…";
    return kept;
  }
  return lines;
}

function WrapTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const lines = wrapLabel(payload?.value ?? "");
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fontSize={11} fontWeight={700} fill="currentColor">
        {lines.map((line, i) => (
          <tspan key={i} x={0} dy={i === 0 ? 14 : 13}>{line}</tspan>
        ))}
      </text>
    </g>
  );
}

const CATEGORY_COUNTS = [
  { label: "Maths",   emoji: "🔢", key: "maths",   color: "bg-blue-100 border-blue-300 text-blue-800" },
  { label: "Animals", emoji: "🦁", key: "animals", color: "bg-orange-100 border-orange-300 text-orange-800" },
  { label: "Reading", emoji: "📖", key: "reading", color: "bg-green-100 border-green-300 text-green-800" },
  { label: "Science", emoji: "🧪", key: "science", color: "bg-teal-100 border-teal-300 text-teal-800" },
  { label: "Health",  emoji: "🥦", key: "health",  color: "bg-emerald-100 border-emerald-300 text-emerald-800" },
  { label: "Colours", emoji: "🎨", key: "colours", color: "bg-pink-100 border-pink-300 text-pink-800" },
];

export default function Progress() {
  const [, setLocation] = useLocation();
  const { activeProfile, gameResults, rewardPurchases } = useAppContext();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [showBadgesAll, setShowBadgesAll] = useState(false);

  if (!activeProfile) { setLocation("/"); return null; }

  const myResults = gameResults.filter(r => r.childId === activeProfile.id);
  const totalStars = myResults.reduce((acc, r) => acc + r.stars, 0);
  const myPurchases = rewardPurchases
    .filter(p => p.childId === activeProfile.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const filteredResults = myResults.filter(r => {
    if (filter === "all") return true;
    if (filter === "correct") return r.score / r.total >= 0.8;
    if (filter === "practice") return r.score / r.total < 0.6;
    return r.category === filter;
  });

  const wrongByGame: Record<string, { gameName: string; category: string; wrong: number; total: number; resultId: string }> = {};
  myResults.forEach(r => {
    if (!r.questionHistory?.length) return;
    const wrong = r.questionHistory.filter((q: QuestionRecord) => !q.isCorrect).length;
    if (wrong === 0) return;
    const key = r.gameId;
    if (!wrongByGame[key] || wrong > wrongByGame[key].wrong)
      wrongByGame[key] = { gameName: r.gameName, category: r.category, wrong, total: r.questionHistory.length, resultId: r.id };
  });
  const needsPractice = Object.values(wrongByGame).sort((a, b) => (b.wrong / b.total) - (a.wrong / a.total)).slice(0, 5);

  const byGame: Record<string, { name: string; best: number }> = {};
  myResults.forEach(r => {
    const pct = Math.round((r.score / r.total) * 100);
    if (!byGame[r.gameId] || pct > byGame[r.gameId].best)
      byGame[r.gameId] = { name: r.gameName, best: pct };
  });
  const chartData = Object.values(byGame);

  const earnedBadges = BADGES.filter(b => b.check(myResults, activeProfile));
  const unearnedBadges = BADGES.filter(b => !b.check(myResults, activeProfile));

  return (
    <div className="min-h-screen bg-background p-4 sm:p-5 md:p-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="flex items-center gap-3 sm:gap-5 mb-6 sm:mb-8 bg-card rounded-[2rem] p-4 sm:p-6 border-4 border-card-border shadow-md">
          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
            onClick={() => { sounds.click(); setLocation("/home"); }}
            className="h-12 sm:h-16 px-4 sm:px-6 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground font-black text-base sm:text-xl border-4 border-border transition-colors flex-shrink-0">
            ← Back
          </motion.button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-foreground leading-tight">Progress & Stars ⭐</h1>
            <p className="text-base sm:text-xl font-bold text-muted-foreground truncate">Keep it up, {activeProfile.name}! 🎉</p>
          </div>
        </header>

        {/* Top stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {[
            { label:"Games", value:myResults.length, emoji:"🎮", color:"bg-gradient-to-br from-blue-500 to-blue-700" },
            { label:"Stars", value:totalStars,        emoji:"⭐", color:"bg-gradient-to-br from-amber-400 to-orange-500" },
            { label:"Badges",value:earnedBadges.length,emoji:"🏆",color:"bg-gradient-to-br from-green-500 to-teal-600" },
          ].map((s,i) => (
            <motion.div key={i} initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.1 }}
              className={`${s.color} rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 text-white text-center shadow-xl`}>
              <div className="text-3xl sm:text-5xl mb-1 sm:mb-2">{s.emoji}</div>
              <div className="text-3xl sm:text-5xl font-black">{s.value}</div>
              <div className="text-sm sm:text-lg font-bold opacity-90 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Reward history */}
        {(activeProfile.pointsEnabled ?? false) && myPurchases.length > 0 && (
          <div className="bg-card border-4 border-card-border rounded-[2rem] p-5 sm:p-6 mb-6">
            <h2 className="text-2xl font-black text-foreground mb-4">🎁 Reward History</h2>
            <div className="space-y-2">
              {myPurchases.map(p => {
                const s = p.status === "approved"
                  ? { label: "Approved ✅", cls: "bg-green-100 text-green-700 border-green-300" }
                  : p.status === "pending"
                  ? { label: "Waiting ⏳", cls: "bg-amber-100 text-amber-700 border-amber-300" }
                  : p.status === "rejected"
                  ? { label: "Denied ✖", cls: "bg-red-100 text-red-600 border-red-300" }
                  : { label: "Cancelled 🚫", cls: "bg-gray-100 text-gray-500 border-gray-300" };
                const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={p.id} className="flex items-center gap-3 bg-muted/60 rounded-2xl px-4 py-3"
                    data-testid={`progress-reward-${p.id}`}>
                    <span className="text-2xl sm:text-3xl flex-shrink-0">{p.rewardEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-foreground text-sm sm:text-base truncate">{p.rewardName}</p>
                      <p className="text-xs font-bold text-muted-foreground">💰 {p.pointsSpent} · asked {fmt(p.createdAt)}</p>
                      {p.decidedAt && (
                        <p className="text-xs font-bold text-muted-foreground">
                          {p.status === "cancelled" ? "Cancelled" : p.status === "rejected" ? "Denied" : "Approved"} {fmt(p.decidedAt)}
                          {p.status === "approved" && p.balanceAfter !== undefined && ` · ${p.balanceAfter} left`}
                        </p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black border-2 flex-shrink-0 ${s.cls}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category breakdown */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {CATEGORY_COUNTS.map(cat => (
            <div key={cat.key} className={`rounded-2xl border-4 p-3 text-center ${cat.color}`}>
              <div className="text-2xl">{cat.emoji}</div>
              <div className="text-2xl font-black">{myResults.filter(r => r.category === cat.key).length}</div>
              <div className="text-xs font-bold">{cat.label}</div>
            </div>
          ))}
        </div>

        {/* Needs Practice */}
        {needsPractice.length > 0 && (
          <div className="bg-amber-50 border-4 border-amber-200 rounded-[2rem] p-6 mb-6">
            <h2 className="text-2xl font-black text-amber-800 mb-4">⚠️ Needs Practice</h2>
            <p className="text-base font-bold text-amber-700 mb-4">These topics had the most incorrect answers:</p>
            <div className="space-y-3">
              {needsPractice.map(g => {
                const pct = Math.round((g.wrong / g.total) * 100);
                return (
                  <div key={g.gameName} onClick={() => { sounds.click(); setLocation(`/game-review/${g.resultId}`); }}
                    className="flex items-center gap-4 bg-white rounded-2xl px-5 py-3 border-2 border-amber-200 cursor-pointer hover:bg-amber-50 transition-colors">
                    <div className="flex-1">
                      <p className="font-black text-amber-900">{g.gameName}</p>
                      <p className="text-sm font-bold text-amber-700 capitalize">{g.category} · {g.wrong}/{g.total} incorrect</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-3 bg-amber-100 rounded-full overflow-hidden border border-amber-200">
                        <div className="h-full bg-red-500 rounded-full" style={{ width:`${pct}%` }} />
                      </div>
                      <span className="text-sm font-black text-red-600 w-10 text-right">{pct}%</span>
                      <span className="text-lg text-amber-500">›</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Earned badges */}
        {earnedBadges.length > 0 && (
          <div className="bg-card rounded-[2rem] p-7 border-4 border-card-border shadow-md mb-6">
            <h2 className="text-3xl font-black text-foreground mb-5">Badges Earned 🏆 ({earnedBadges.length}/{BADGES.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {earnedBadges.map((b,i) => (
                <motion.div key={b.id} initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:i*0.04, type:"spring" }}
                  className={`${b.bg} border-4 ${b.border} rounded-2xl p-4 flex flex-col items-center text-center gap-1`}>
                  <span className="text-4xl">{b.emoji}</span>
                  <span className={`text-sm font-black ${b.color}`}>{b.label}</span>
                  <span className="text-xs font-bold text-muted-foreground">{b.desc}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Locked badges */}
        {unearnedBadges.length > 0 && (
          <div className="bg-card rounded-[2rem] p-7 border-4 border-card-border shadow-md mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-3xl font-black text-foreground">Next to Unlock 🔒</h2>
              {unearnedBadges.length > 8 && (
                <button onClick={() => setShowBadgesAll(v => !v)} className="text-sm font-black text-primary">
                  {showBadgesAll ? "Show less" : `Show all ${unearnedBadges.length}`}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(showBadgesAll ? unearnedBadges : unearnedBadges.slice(0,8)).map(b => {
                const prog = b.progress ? b.progress(myResults, activeProfile) : null;
                return (
                  <div key={b.id} className="bg-muted/60 border-4 border-border rounded-2xl p-4 flex flex-col items-center text-center gap-1 opacity-80">
                    <span className="text-4xl grayscale opacity-50">{b.emoji}</span>
                    <span className="text-sm font-black text-muted-foreground">{b.label}</span>
                    <span className="text-xs font-bold text-muted-foreground">{b.desc}</span>
                    {prog && (
                      <div className="w-full mt-2">
                        <div className="h-2 bg-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width:`${(prog.current/prog.target)*100}%` }} />
                        </div>
                        <p className="text-xs font-bold text-muted-foreground mt-1">{prog.current}/{prog.target}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-card rounded-[2rem] p-5 sm:p-7 border-4 border-card-border shadow-md mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-5">Best Scores by Game</h2>
            <div className="overflow-x-auto -mx-1 px-1">
              <div style={{ minWidth: Math.max(chartData.length * 84, 320) }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} barCategoryGap="25%" margin={{ top: 8, right: 8, left: -16, bottom: 48 }}>
                    <XAxis dataKey="name" interval={0} tickLine={false} axisLine={false}
                      height={56} tick={<WrapTick />} />
                    <YAxis domain={[0,100]} width={40} tick={{ fontSize:11, fontWeight:700 }} />
                    <Tooltip formatter={(v:number) => [`${v}%`,"Best"]} contentStyle={{ borderRadius:12, fontWeight:700 }} />
                    <Bar dataKey="best" radius={[8,8,0,0]}>
                      {chartData.map((_,idx) => <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Recent Games */}
        <div className="bg-card rounded-[2rem] p-7 border-4 border-card-border shadow-md">
          <h2 className="text-3xl font-black text-foreground mb-5">Recent Games</h2>
          <div className="flex flex-wrap gap-2 mb-5">
            {CATEGORY_FILTERS.map(f => (
              <button key={f.key} onClick={() => { sounds.click(); setFilter(f.key); }}
                className={`px-4 py-2 rounded-full text-sm font-black border-2 transition-all ${filter === f.key ? "bg-primary text-white border-primary shadow-md scale-105" : "bg-muted text-muted-foreground border-border hover:border-primary/50"}`}>
                {f.emoji} {f.label}
              </button>
            ))}
          </div>

          {filteredResults.length > 0 ? (
            <div className="space-y-3">
              {[...filteredResults].reverse().slice(0, 20).map(r => {
                const pct = Math.round((r.score / r.total) * 100);
                const time = formatTime(r.timeTakenSeconds);
                const hasHistory = (r.questionHistory?.length ?? 0) > 0 || !!r.writeName;
                return (
                  <motion.div key={r.id} whileHover={{ scale: hasHistory ? 1.01 : 1 }}
                    onClick={() => { if (hasHistory) { sounds.click(); setLocation(`/game-review/${r.id}`); } }}
                    className={`flex items-center justify-between bg-muted rounded-2xl px-5 py-4 gap-4 ${hasHistory ? "cursor-pointer hover:bg-primary/5 transition-colors" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-black text-foreground truncate">{r.gameName}</p>
                        {hasHistory && <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">Review →</span>}
                      </div>
                      <p className="text-sm font-bold text-muted-foreground capitalize">
                        {r.category} · Age {r.ageRange} · {new Date(r.playedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                        {time ? ` · ⏱️ ${time}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-lg font-black ${pct>=80?"text-green-600":pct>=50?"text-amber-600":"text-red-600"}`}>{r.score}/{r.total}</span>
                      <Stars count={r.stars} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-6xl mb-3">🔍</div>
              <p className="text-2xl font-black text-foreground">No games found</p>
              <p className="text-lg font-bold text-muted-foreground mt-1">
                {filter === "all" ? "Play some games to see them here!" : `No ${filter} games yet.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
