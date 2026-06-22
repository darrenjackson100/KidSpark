import React from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { useAppContext, GameResult } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";
import SpeakerButton from "@/components/SpeakerButton";

function formatTime(secs?: number) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60), s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function Stars({ count }: { count: number }) {
  return <span className="flex gap-1">{[1, 2, 3].map(s => <span key={s} className={`text-3xl ${s <= count ? "" : "opacity-20 grayscale"}`}>⭐</span>)}</span>;
}

const CATEGORY_EMOJI: Record<string, string> = {
  maths: "🔢", animals: "🦁", reading: "📖", science: "🧪", colours: "🎨"
};

function getBadgeForResult(r: GameResult): string | null {
  const pct = r.score / r.total;
  if (pct === 1) return "🏆 Perfect Score";
  if (r.stars === 3) return "⭐ Three Stars";
  if (r.gameId === "daily-challenge") return "📅 Daily Learner";
  if (r.gameId === "memory-cards") return "🃏 Memory Master";
  if (r.gameId === "timed-maths" && r.stars === 3) return "⚡ Fast Thinker";
  return null;
}

export default function GameReview() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { gameResults } = useAppContext();

  const result = gameResults.find(r => r.id === params.id);

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card rounded-[2rem] p-12 text-center border-4 border-card-border shadow-md max-w-lg">
          <div className="text-7xl mb-4">🔍</div>
          <h1 className="text-4xl font-black text-foreground mb-3">Game not found</h1>
          <button onClick={() => { sounds.click(); setLocation("/progress"); }}
            className="mt-6 h-14 px-8 rounded-2xl bg-primary text-white font-black text-xl">
            ← Back to Progress
          </button>
        </div>
      </div>
    );
  }

  const badge = getBadgeForResult(result);
  const pct = Math.round((result.score / result.total) * 100);
  const history = result.questionHistory ?? [];

  return (
    <div className="min-h-screen bg-background p-5 md:p-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <header className="flex items-center gap-5 mb-8 bg-card rounded-[2rem] p-6 border-4 border-card-border shadow-md">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.click(); setLocation("/progress"); }}
            className="h-14 px-5 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground font-black text-lg border-4 border-border transition-colors flex-shrink-0">
            ← Progress
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-black text-foreground truncate">{result.gameName}</h1>
            <p className="text-base font-bold text-muted-foreground mt-1">{formatDate(result.playedAt)}</p>
          </div>
        </header>

        {/* Summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-[1.5rem] border-4 border-card-border p-5 text-center shadow-md">
            <div className="text-4xl mb-1">{CATEGORY_EMOJI[result.category] ?? "🎮"}</div>
            <div className="text-lg font-black text-foreground capitalize">{result.category}</div>
            <div className="text-sm font-bold text-muted-foreground">Subject</div>
          </div>
          <div className={`rounded-[1.5rem] border-4 p-5 text-center shadow-md ${pct >= 80 ? "bg-green-50 border-green-200" : pct >= 50 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
            <div className="text-4xl font-black mb-1">{result.score}/{result.total}</div>
            <div className={`text-2xl font-black ${pct >= 80 ? "text-green-700" : pct >= 50 ? "text-yellow-700" : "text-red-700"}`}>{pct}%</div>
            <div className="text-sm font-bold text-muted-foreground">Score</div>
          </div>
          <div className="bg-card rounded-[1.5rem] border-4 border-card-border p-5 text-center shadow-md flex flex-col items-center justify-center">
            <Stars count={result.stars} />
            <div className="text-sm font-bold text-muted-foreground mt-2">Stars</div>
          </div>
          <div className="bg-card rounded-[1.5rem] border-4 border-card-border p-5 text-center shadow-md">
            <div className="text-3xl font-black text-foreground mb-1">{formatTime(result.timeTakenSeconds)}</div>
            <div className="text-sm font-bold text-muted-foreground">Time Taken</div>
            {result.ageRange && <div className="text-xs font-bold text-muted-foreground mt-1">Age {result.ageRange}</div>}
          </div>
        </div>

        {badge && (
          <div className="bg-yellow-50 border-4 border-yellow-200 rounded-[1.5rem] p-4 mb-8 text-center">
            <p className="text-2xl font-black text-yellow-800">Badge Earned: {badge}</p>
          </div>
        )}

        {/* "Write My Name" handwriting review */}
        {result.writeName ? (
          <div className="bg-card rounded-[2rem] p-7 border-4 border-card-border shadow-md">
            <h2 className="text-3xl font-black text-foreground mb-2">✏️ Handwriting Practice</h2>
            <p className="text-lg font-bold text-muted-foreground mb-6">
              {result.writeName.name} practised writing their name
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className={`rounded-[1.5rem] border-4 p-5 text-center ${result.writeName.traced ? "bg-green-50 border-green-200" : "bg-muted border-border"}`}>
                <div className="text-4xl mb-1">{result.writeName.traced ? "✅" : "⬜"}</div>
                <div className="text-lg font-black text-foreground">Traced the name</div>
              </div>
              <div className={`rounded-[1.5rem] border-4 p-5 text-center ${result.writeName.freeWrote ? "bg-green-50 border-green-200" : "bg-muted border-border"}`}>
                <div className="text-4xl mb-1">{result.writeName.freeWrote ? "✅" : "⬜"}</div>
                <div className="text-lg font-black text-foreground">Wrote it alone</div>
              </div>
              <div className="rounded-[1.5rem] border-4 border-amber-200 bg-amber-50 p-5 text-center">
                <div className="text-4xl font-black text-amber-700 mb-1">+{result.score}</div>
                <div className="text-lg font-black text-amber-800">Points earned</div>
              </div>
            </div>
            {result.writeName.image ? (
              <div>
                <p className="text-base font-black text-muted-foreground mb-2">Their free writing:</p>
                <img src={result.writeName.image} alt={`${result.writeName.name}'s handwriting`}
                  className="w-full max-w-xl rounded-2xl border-4 border-card-border bg-white"
                  data-testid="img-write-name" />
              </div>
            ) : (
              <p className="text-base font-bold text-muted-foreground">No free-writing was saved for this attempt.</p>
            )}
          </div>
        ) : history.length > 0 ? (
          <div className="bg-card rounded-[2rem] p-7 border-4 border-card-border shadow-md">
            <h2 className="text-3xl font-black text-foreground mb-6">
              Question by Question Review
              <span className="ml-3 text-xl font-bold text-muted-foreground">({history.filter(q => q.isCorrect).length} correct, {history.filter(q => !q.isCorrect).length} incorrect)</span>
            </h2>
            <div className="space-y-5">
              {history.map((q, i) => (
                <motion.div key={q.questionId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-[1.5rem] border-4 p-5 ${q.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black flex-shrink-0 ${q.isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                      {q.isCorrect ? "✓" : "✗"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-muted-foreground mb-1">Question {i + 1}</p>
                      <div className="flex items-start gap-2 mb-3">
                        <p className="text-xl font-black text-foreground flex-1">{q.questionText}</p>
                        <SpeakerButton text={q.questionText} label="Hear question" size="sm" />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 text-base font-bold">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${q.isCorrect ? "bg-green-200 text-green-900" : "bg-red-200 text-red-900"}`}>
                          <span className="text-lg">{q.isCorrect ? "✅" : "❌"}</span>
                          <span>Child answered: <strong>{q.childAnswerText}</strong></span>
                          <SpeakerButton text={q.childAnswerText} label={`Hear child's answer: ${q.childAnswerText}`} size="xs" />
                        </div>
                        {!q.isCorrect && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-100 text-green-900">
                            <span className="text-lg">✅</span>
                            <span>Correct answer: <strong>{q.correctAnswerText}</strong></span>
                            <SpeakerButton text={`The correct answer is ${q.correctAnswerText}`} label={`Hear correct answer: ${q.correctAnswerText}`} size="xs" />
                          </div>
                        )}
                      </div>
                      {q.explanation && (
                        <div className="mt-3 bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2">
                          <p className="text-base font-bold text-blue-800 flex-1">💡 {q.explanation}</p>
                          <SpeakerButton text={q.explanation} label="Hear explanation" size="xs" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-[2rem] p-10 border-4 border-card-border shadow-md text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-2xl font-black text-foreground">No detailed question history for this game</p>
            <p className="text-lg font-bold text-muted-foreground mt-2">Play again to see a full question-by-question review!</p>
          </div>
        )}
      </div>
    </div>
  );
}
