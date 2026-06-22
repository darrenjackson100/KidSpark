import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAppContext, ChildProfile, GameResult } from "@/context/AppContext";
import { THEMES } from "@/lib/themes";
import { sounds } from "@/lib/sounds";

const CAT_EMOJI: Record<string, string> = { maths:"🔢", animals:"🦁", reading:"📖", science:"🧪", colours:"🎨", health:"🥦" };
const CAT_LABEL: Record<string, string> = { maths:"Maths", animals:"Animals", reading:"Reading", science:"Science", colours:"Colours", health:"Health" };
const CAT_COLOR: Record<string, string> = {
  maths:   "bg-blue-50 text-blue-800 border-blue-200",
  animals: "bg-orange-50 text-orange-800 border-orange-200",
  reading: "bg-green-50 text-green-800 border-green-200",
  science: "bg-teal-50 text-teal-800 border-teal-200",
  colours: "bg-pink-50 text-pink-800 border-pink-200",
  health:  "bg-emerald-50 text-emerald-800 border-emerald-200",
};

function formatRelative(iso?: string): string {
  if (!iso) return "Never played";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function countSimpleBadges(profile: ChildProfile, results: GameResult[]): number {
  const u = new Set(results.map(r => r.gameId)).size;
  return [
    results.length >= 1, results.length >= 5, results.length >= 10,
    results.length >= 25, results.length >= 50,
    u >= 5, u >= 10,
    results.some(r => r.score === r.total),
    results.filter(r => r.category === "maths").length >= 3,
    results.filter(r => r.category === "animals").length >= 3,
    results.filter(r => r.category === "reading").length >= 1,
    results.filter(r => r.category === "science").length >= 1,
    results.filter(r => r.category === "health").length >= 1,
    results.some(r => r.stars === 3),
    results.reduce((a, r) => a + r.stars, 0) >= 50,
    (profile.streakDays ?? 0) >= 3,
    (profile.streakDays ?? 0) >= 7,
    (profile.streakDays ?? 0) >= 30,
  ].filter(Boolean).length;
}

interface ProfileStats {
  totalGames: number; avgScore: number; bestScore: number; latestScore: number;
  totalStars: number; uniqueGames: number; perfectGames: number;
  strongest: string | null; weakest: string | null;
  badges: number; catCounts: Record<string, number>;
}

function computeStats(profile: ChildProfile, results: GameResult[]): ProfileStats | null {
  if (results.length === 0) return null;
  const pcts = results.map(r => Math.round((r.score / r.total) * 100));
  const avgScore = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  const bestScore = Math.max(...pcts);
  const latestScore = pcts[pcts.length - 1];
  const totalStars = results.reduce((a, r) => a + r.stars, 0);
  const uniqueGames = new Set(results.map(r => r.gameId)).size;
  const perfectGames = results.filter(r => r.score === r.total).length;

  const catCounts: Record<string, number> = {};
  const catScores: Record<string, number[]> = {};
  results.forEach(r => {
    catCounts[r.category] = (catCounts[r.category] ?? 0) + 1;
    if (!catScores[r.category]) catScores[r.category] = [];
    catScores[r.category].push(r.score / r.total);
  });

  const catEntries = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  const strongest = catEntries[0]?.[0] ?? null;
  const catAvgs = Object.entries(catScores).map(([cat, scores]) => ({
    cat, avg: scores.reduce((a, b) => a + b, 0) / scores.length,
  })).sort((a, b) => a.avg - b.avg);
  const weakest = catAvgs.length > 1 ? catAvgs[0]?.cat ?? null : null;

  const badges = countSimpleBadges(profile, results);
  return { totalGames: results.length, avgScore, bestScore, latestScore, totalStars, uniqueGames, perfectGames, strongest, weakest, badges, catCounts };
}

function ScorePill({ pct }: { pct: number }) {
  const color = pct >= 80 ? "bg-green-100 text-green-800 border-green-300" : pct >= 50 ? "bg-yellow-100 text-yellow-800 border-yellow-300" : "bg-red-100 text-red-800 border-red-300";
  return <span className={`px-3 py-1 rounded-full border-2 text-sm font-black ${color}`}>{pct}%</span>;
}

export default function Class() {
  const [, setLocation] = useLocation();
  const { profiles, activeProfile, gameResults, rewardPurchases, setActiveProfile } = useAppContext();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!activeProfile) { setLocation("/"); return null; }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-5 md:p-10">
      <div className="max-w-5xl mx-auto">

        <header className="flex items-center gap-3 sm:gap-5 mb-6 sm:mb-8 bg-card rounded-[2rem] p-4 sm:p-6 border-4 border-card-border shadow-md">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.click(); setLocation("/home"); }}
            className="h-12 sm:h-16 px-4 sm:px-6 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground font-black text-base sm:text-xl border-4 border-border transition-colors flex-shrink-0">
            ← Back
          </motion.button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-foreground leading-tight">Class 👨‍🎓</h1>
            <p className="text-base sm:text-xl font-bold text-muted-foreground">{profiles.length} {profiles.length === 1 ? "child" : "children"} on this device</p>
          </div>
        </header>

        {profiles.length === 0 ? (
          <div className="bg-card rounded-[2.5rem] border-4 border-card-border p-16 text-center">
            <div className="text-8xl mb-5">👤</div>
            <h2 className="text-3xl font-black text-foreground mb-3">No children yet</h2>
            <p className="text-xl font-bold text-muted-foreground mb-6">Create a profile to get started!</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { sounds.click(); setLocation("/"); }}
              className="h-14 px-10 rounded-2xl bg-primary text-white font-black text-xl">
              + Add Child
            </motion.button>
          </div>
        ) : (
          <div className="space-y-6">
            {profiles.map((profile, i) => {
              const results = gameResults.filter(r => r.childId === profile.id);
              const stats = computeStats(profile, results);
              const theme = THEMES[profile.theme ?? "default"] ?? THEMES.default;
              const isActive = profile.id === activeProfile.id;
              const isExpanded = expandedId === profile.id;

              return (
                <motion.div key={profile.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, type: "spring" }}
                  className={`bg-card rounded-[2.5rem] overflow-hidden shadow-xl border-4 ${isActive ? "border-primary" : "border-card-border"}`}>

                  {isActive && (
                    <div className="bg-primary/90 text-white text-center text-sm font-black py-2 tracking-wide">
                      ✦ Currently Active Profile
                    </div>
                  )}

                  <div className="p-6 md:p-8">

                    {/* Profile header row */}
                    <div className="flex items-start gap-5 mb-6">
                      <div className={`w-24 h-24 rounded-[1.5rem] overflow-hidden bg-gradient-to-br ${theme.gradientFrom} ${theme.gradientTo} flex items-center justify-center text-5xl shadow-lg flex-shrink-0`}>
                        {profile.avatarPhoto
                          ? <img src={profile.avatarPhoto} alt={`${profile.name}'s photo`} className="w-full h-full object-cover" />
                          : (profile.avatarEmoji ?? "🎓")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <h2 className="text-3xl font-black text-foreground">{profile.name}</h2>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="bg-primary/10 text-primary border-2 border-primary/20 text-sm font-black px-3 py-1 rounded-full">
                                Ages {profile.ageRange}
                              </span>
                              {profile.gender && (
                                <span className="bg-muted border-2 border-border text-muted-foreground text-sm font-bold px-3 py-1 rounded-full capitalize">
                                  {profile.gender === "girl" ? "👧 Girl" : profile.gender === "boy" ? "👦 Boy" : "🌈 Neutral"}
                                </span>
                              )}
                              <span className="bg-muted border-2 border-border text-muted-foreground text-sm font-bold px-3 py-1 rounded-full">
                                {profile.mode === "teacher" ? "🏫 Teacher" : "👨‍👧 Parent"}
                              </span>
                              <span className="text-sm font-bold text-muted-foreground flex items-center gap-1">
                                📅 {formatRelative(profile.lastPlayedAt)}
                              </span>
                            </div>
                          </div>
                          {!isActive && (
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              onClick={() => { sounds.pop(); setActiveProfile(profile.id); setLocation("/home"); }}
                              className="flex-shrink-0 h-11 px-5 rounded-2xl bg-primary text-white font-black text-sm shadow-md">
                              Switch →
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>

                    {stats ? (
                      <>
                        {/* Stats grid */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
                          {[
                            { label:"Games Played", value: stats.totalGames,       emoji:"🎮", bg:"bg-blue-50 border-blue-200 text-blue-800" },
                            { label:"Avg Score",    value: `${stats.avgScore}%`,   emoji:"📊", bg:"bg-indigo-50 border-indigo-200 text-indigo-800" },
                            { label:"Best Score",   value: `${stats.bestScore}%`,  emoji:"🏆", bg:"bg-yellow-50 border-yellow-200 text-yellow-800" },
                            { label:"Latest",       value: `${stats.latestScore}%`,emoji:"🎯", bg:"bg-green-50 border-green-200 text-green-800" },
                            { label:"Day Streak",   value: `${profile.streakDays ?? 0}🔥`, emoji:"🔥", bg:"bg-orange-50 border-orange-200 text-orange-800" },
                            { label:"Badges",       value: stats.badges,           emoji:"🏅", bg:"bg-purple-50 border-purple-200 text-purple-800" },
                          ].map((s, j) => (
                            <div key={j} className={`rounded-2xl border-4 p-3 text-center ${s.bg}`}>
                              <div className="text-2xl mb-1">{s.emoji}</div>
                              <div className="text-xl font-black leading-tight">{s.value}</div>
                              <div className="text-xs font-bold opacity-70 mt-0.5 leading-tight">{s.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Stars + summary */}
                        <div className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-4 border-yellow-200 rounded-2xl px-5 py-4 mb-5">
                          <span className="text-4xl">⭐</span>
                          <div>
                            <p className="text-2xl font-black text-yellow-800">{stats.totalStars} total stars earned</p>
                            <p className="text-sm font-bold text-yellow-700">
                              {stats.uniqueGames} different games tried · {stats.perfectGames} perfect score{stats.perfectGames !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        {/* Strength / weakness + category breakdown */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          {stats.strongest && (
                            <div className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 font-black text-sm ${CAT_COLOR[stats.strongest] ?? "bg-gray-100 text-gray-800 border-gray-300"}`}>
                              {CAT_EMOJI[stats.strongest] ?? "📚"} 💪 Strongest: {CAT_LABEL[stats.strongest] ?? stats.strongest}
                            </div>
                          )}
                          {stats.weakest && stats.weakest !== stats.strongest && (
                            <div className="flex items-center gap-1.5 px-4 py-2 rounded-full border-2 font-black text-sm bg-red-50 text-red-800 border-red-200">
                              {CAT_EMOJI[stats.weakest] ?? "📚"} ⚠️ Needs practice: {CAT_LABEL[stats.weakest] ?? stats.weakest}
                            </div>
                          )}
                          {Object.entries(stats.catCounts).map(([cat, count]) => (
                            <div key={cat} className={`px-3 py-1 rounded-full border-2 text-xs font-black ${CAT_COLOR[cat] ?? "bg-gray-100 text-gray-800 border-gray-300"}`}>
                              {CAT_EMOJI[cat] ?? "📚"} {CAT_LABEL[cat] ?? cat} ×{count}
                            </div>
                          ))}
                        </div>

                        {/* Score bar */}
                        <div className="bg-muted rounded-2xl px-5 py-4 mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-black text-foreground">Average score</span>
                            <ScorePill pct={stats.avgScore} />
                          </div>
                          <div className="h-3 bg-background rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${stats.avgScore}%` }}
                              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                              className={`h-full rounded-full bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo}`} />
                          </div>
                        </div>

                        {/* Recent games toggle */}
                        <button onClick={() => { sounds.click(); setExpandedId(isExpanded ? null : profile.id); }}
                          className="w-full flex items-center justify-between bg-muted hover:bg-muted/80 rounded-2xl px-5 py-3 text-left transition-colors">
                          <span className="font-black text-foreground">Recent Games ({results.length})</span>
                          <span className="text-muted-foreground font-black">{isExpanded ? "▲ Hide" : "▼ Show"}</span>
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                            {[...results].reverse().slice(0, 12).map(r => {
                              const pct = Math.round((r.score / r.total) * 100);
                              const hasHistory = (r.questionHistory?.length ?? 0) > 0;
                              return (
                                <div key={r.id}
                                  onClick={() => { if (hasHistory) { sounds.click(); setActiveProfile(profile.id); setLocation(`/game-review/${r.id}`); } }}
                                  className={`flex items-center justify-between bg-muted/60 rounded-xl px-4 py-3 gap-3 ${hasHistory ? "cursor-pointer hover:bg-primary/5 transition-colors" : ""}`}>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-black text-foreground text-sm truncate">{r.gameName}</p>
                                    <p className="text-xs font-bold text-muted-foreground capitalize">
                                      {CAT_EMOJI[r.category] ?? "📚"} {r.category} · {new Date(r.playedAt).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <ScorePill pct={pct} />
                                    <span className="text-sm">{"⭐".repeat(r.stars)}{"☆".repeat(3 - r.stars)}</span>
                                    {hasHistory && <span className="text-xs font-black text-primary">→</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {isExpanded && (profile.pointsEnabled ?? false) && (() => {
                          const purchases = rewardPurchases
                            .filter(p => p.childId === profile.id)
                            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                          if (purchases.length === 0) return null;
                          return (
                            <div className="mt-4">
                              <p className="font-black text-foreground mb-2">🎁 Reward History ({purchases.length})</p>
                              <div className="space-y-2 max-h-80 overflow-y-auto">
                                {purchases.map(p => {
                                  const s = p.status === "approved"
                                    ? { label: "Approved ✅", cls: "bg-green-100 text-green-700 border-green-300" }
                                    : p.status === "pending"
                                    ? { label: "Waiting ⏳", cls: "bg-amber-100 text-amber-700 border-amber-300" }
                                    : p.status === "rejected"
                                    ? { label: "Denied ✖", cls: "bg-red-100 text-red-600 border-red-300" }
                                    : { label: "Cancelled 🚫", cls: "bg-gray-100 text-gray-500 border-gray-300" };
                                  const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
                                  return (
                                    <div key={p.id} className="flex items-center gap-3 bg-muted/60 rounded-xl px-4 py-3"
                                      data-testid={`class-reward-${p.id}`}>
                                      <span className="text-2xl flex-shrink-0">{p.rewardEmoji}</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-black text-foreground text-sm truncate">{p.rewardName}</p>
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
                          );
                        })()}
                      </>
                    ) : (
                      <div className="bg-muted/50 rounded-2xl p-10 text-center">
                        <div className="text-6xl mb-4">🚀</div>
                        <p className="text-2xl font-black text-foreground">No games played yet!</p>
                        <p className="text-base font-bold text-muted-foreground mt-2">
                          {isActive ? "Go play some games to see your progress here!" : "Switch to this profile to start learning"}
                        </p>
                        {!isActive && (
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => { sounds.pop(); setActiveProfile(profile.id); setLocation("/home"); }}
                            className="mt-5 h-12 px-8 rounded-2xl bg-primary text-white font-black text-base shadow-md">
                            Switch & Play →
                          </motion.button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
