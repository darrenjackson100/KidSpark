import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAppContext, ChildProfile } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";

const AGE_LABELS: Record<ChildProfile["ageRange"], string> = {
  "3-4": "3–4 Years",
  "5-6": "5–6 Years",
  "7-8": "7–8 Years",
};

const PROFILE_COLOURS = [
  "from-blue-400 to-blue-600",
  "from-orange-400 to-orange-600",
  "from-green-400 to-green-600",
  "from-purple-400 to-purple-600",
  "from-pink-400 to-pink-600",
  "from-teal-400 to-teal-600",
];

const BAR_COLORS = ["#3b82f6", "#f97316", "#22c55e", "#a855f7", "#ec4899", "#f59e0b"];

const BADGE_CRITERIA = [
  { id: "first-game", label: "First Game", emoji: "🎮", check: (r: any[]) => r.length >= 1 },
  { id: "maths-star", label: "Maths Star", emoji: "🔢", check: (r: any[]) => r.filter((g: any) => g.category === "maths").length >= 3 },
  { id: "animal-expert", label: "Animal Expert", emoji: "🦁", check: (r: any[]) => r.filter((g: any) => g.category === "animals").length >= 3 },
  { id: "perfect", label: "Perfect Score", emoji: "🏆", check: (r: any[]) => r.some((g: any) => g.score === g.total) },
  { id: "ten", label: "10 Games", emoji: "🌟", check: (r: any[]) => r.length >= 10 },
  { id: "daily", label: "Daily Challenger", emoji: "📅", check: (r: any[]) => r.some((g: any) => g.gameId === "daily-challenge") },
  { id: "memory", label: "Memory Master", emoji: "🃏", check: (r: any[]) => r.some((g: any) => g.gameId === "memory-cards") },
  { id: "speed", label: "Speed Champion", emoji: "⚡", check: (r: any[]) => r.some((g: any) => g.gameId === "timed-maths" && g.stars === 3) },
];

export default function Classroom() {
  const [, setLocation] = useLocation();
  const { profiles, gameResults, notes } = useAppContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedProfile = profiles.find(p => p.id === selectedId);
  const myResults = selectedProfile ? gameResults.filter(r => r.childId === selectedProfile.id) : [];
  const myNotes = selectedProfile ? notes.filter(n => n.childId === selectedProfile.id) : [];

  const byGame: Record<string, { name: string; best: number; plays: number }> = {};
  myResults.forEach(r => {
    const pct = Math.round((r.score / r.total) * 100);
    if (!byGame[r.gameId]) byGame[r.gameId] = { name: r.gameName, best: pct, plays: 1 };
    else { byGame[r.gameId].plays++; if (pct > byGame[r.gameId].best) byGame[r.gameId].best = pct; }
  });
  const chartData = Object.values(byGame).map(g => ({ name: g.name.split(" ").slice(0, 2).join(" "), score: g.best, plays: g.plays }));
  const earnedBadges = BADGE_CRITERIA.filter(b => b.check(myResults));
  const totalStars = myResults.reduce((a, r) => a + r.stars, 0);

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
            <h1 className="text-4xl md:text-5xl font-black text-foreground">Classroom View</h1>
            <p className="text-xl font-bold text-muted-foreground">{profiles.length} child{profiles.length !== 1 ? "ren" : ""} registered</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student List */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-black text-foreground mb-4">Students</h2>
            <div className="space-y-3">
              {profiles.length === 0 && (
                <div className="bg-card rounded-[1.5rem] p-8 border-4 border-card-border text-center">
                  <p className="text-2xl font-bold text-muted-foreground">No students yet.</p>
                  <p className="text-lg text-muted-foreground mt-2">Add children from the profile screen.</p>
                </div>
              )}
              {profiles.map((profile, idx) => {
                const results = gameResults.filter(r => r.childId === profile.id);
                const stars = results.reduce((a, r) => a + r.stars, 0);
                const isSelected = selectedId === profile.id;
                return (
                  <motion.div
                    key={profile.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { sounds.click(); setSelectedId(isSelected ? null : profile.id); }}
                    className={`cursor-pointer rounded-[1.5rem] p-5 border-4 transition-all ${
                      isSelected ? "border-primary bg-primary/5" : "border-card-border bg-card hover:border-primary/50"
                    } shadow-md`}
                    data-testid={`card-student-${profile.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${PROFILE_COLOURS[idx % PROFILE_COLOURS.length]} flex items-center justify-center text-2xl font-black text-white flex-shrink-0`}>
                        {profile.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xl font-black text-foreground truncate">{profile.name}</p>
                        <p className="text-sm font-bold text-muted-foreground">{AGE_LABELS[profile.ageRange]} · {profile.mode}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm font-bold text-foreground">🎮 {results.length}</span>
                          <span className="text-sm font-bold text-foreground">⭐ {stars}</span>
                          {profile.streakDays && profile.streakDays > 1 && (
                            <span className="text-sm font-bold text-orange-600">🔥 {profile.streakDays}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-2">
            {!selectedProfile ? (
              <div className="bg-card rounded-[2rem] p-12 border-4 border-card-border shadow-md text-center h-full flex flex-col items-center justify-center">
                <div className="text-8xl mb-6">👆</div>
                <h2 className="text-4xl font-black text-foreground mb-3">Select a student</h2>
                <p className="text-2xl font-bold text-muted-foreground">Tap a name on the left to see their progress</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Games", value: myResults.length, emoji: "🎮", bg: "bg-blue-50 border-blue-200 text-blue-700" },
                    { label: "Stars", value: totalStars, emoji: "⭐", bg: "bg-yellow-50 border-yellow-200 text-yellow-700" },
                    { label: "Badges", value: earnedBadges.length, emoji: "🏆", bg: "bg-green-50 border-green-200 text-green-700" },
                    { label: "Notes", value: myNotes.length, emoji: "📝", bg: "bg-purple-50 border-purple-200 text-purple-700" },
                  ].map((s, i) => (
                    <div key={i} className={`rounded-[1.5rem] p-5 border-4 text-center ${s.bg}`}>
                      <div className="text-3xl mb-1">{s.emoji}</div>
                      <div className="text-4xl font-black">{s.value}</div>
                      <div className="text-sm font-bold opacity-80">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Badges */}
                {earnedBadges.length > 0 && (
                  <div className="bg-card rounded-[1.5rem] p-6 border-4 border-card-border shadow-md">
                    <h3 className="text-2xl font-black text-foreground mb-4">Badges</h3>
                    <div className="flex flex-wrap gap-3">
                      {earnedBadges.map(b => (
                        <span key={b.id} className="bg-yellow-50 border-4 border-yellow-200 rounded-2xl px-4 py-2 flex items-center gap-2 text-lg font-black text-foreground">
                          {b.emoji} {b.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chart */}
                {chartData.length > 0 && (
                  <div className="bg-card rounded-[1.5rem] p-6 border-4 border-card-border shadow-md">
                    <h3 className="text-2xl font-black text-foreground mb-4">Best Scores by Game</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData} barCategoryGap="30%">
                        <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fontWeight: 700 }} />
                        <Tooltip formatter={(v: number) => [`${v}%`, "Best"]} contentStyle={{ borderRadius: 12, fontWeight: 700 }} />
                        <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                          {chartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Recent results */}
                {myResults.length > 0 && (
                  <div className="bg-card rounded-[1.5rem] p-6 border-4 border-card-border shadow-md">
                    <h3 className="text-2xl font-black text-foreground mb-4">Recent Activity</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {[...myResults].reverse().slice(0, 8).map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-muted rounded-2xl px-5 py-3 gap-3">
                          <div>
                            <p className="text-lg font-black text-foreground">{r.gameName}</p>
                            <p className="text-sm font-bold text-muted-foreground">{new Date(r.playedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-lg font-black text-foreground">{r.score}/{r.total}</span>
                            <span className="text-lg">{Array.from({ length: r.stars }, () => "⭐").join("")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent notes */}
                {myNotes.length > 0 && (
                  <div className="bg-card rounded-[1.5rem] p-6 border-4 border-card-border shadow-md">
                    <h3 className="text-2xl font-black text-foreground mb-4">Latest Notes</h3>
                    <div className="space-y-3">
                      {[...myNotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3).map(note => (
                        <div key={note.id} className="bg-muted rounded-2xl p-4">
                          <p className="text-lg font-black text-foreground">{note.title}</p>
                          <p className="text-base font-semibold text-muted-foreground mt-1 line-clamp-2">{note.body}</p>
                          <p className="text-xs font-bold text-muted-foreground mt-2">{new Date(note.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {myResults.length === 0 && myNotes.length === 0 && (
                  <div className="bg-card rounded-[1.5rem] p-10 border-4 border-card-border shadow-md text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-2xl font-black text-foreground">No activity yet</p>
                    <p className="text-lg font-bold text-muted-foreground mt-1">This student hasn't played any games yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
