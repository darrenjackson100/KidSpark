import React, { useMemo, useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { useSoundContext } from "@/context/SoundContext";
import { speak } from "@/lib/speech";
import { sounds } from "@/lib/sounds";
import { buildCategoryQuestions, BankQuestion, Category } from "@/lib/questionBank";
import { computeGamePoints, getEarnedMilestoneBadges, MILESTONE_BADGES } from "@/lib/points";
import Confetti from "@/components/Confetti";
import SpeakerButton from "@/components/SpeakerButton";

type AgeRange = "3-4" | "5-6" | "7-8";

interface DCRecord { questionId: string; questionText: string; childAnswerText: string; correctAnswerText: string; isCorrect: boolean; }

// The four categories the daily challenge cycles through, in order. The child
// must finish one category (5 questions) before the next unlocks.
const DAILY_CATEGORIES: { category: Category; label: string; emoji: string; color: string }[] = [
  { category: "maths",   label: "Maths",           emoji: "🔢", color: "from-blue-500 to-blue-700" },
  { category: "reading", label: "Reading & Words", emoji: "📖", color: "from-green-500 to-green-700" },
  { category: "animals", label: "Animals",         emoji: "🦁", color: "from-orange-500 to-orange-700" },
  { category: "health",  label: "Health & Food",   emoji: "🥦", color: "from-emerald-500 to-emerald-700" },
];
const PER_CATEGORY = 5;
const TOTAL_Q = DAILY_CATEGORIES.length * PER_CATEGORY;

// Seeded PRNG for consistent daily questions
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
function dayOfYear() {
  const now = new Date();
  return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
}

// Returns one array of 5 questions per category, in DAILY_CATEGORIES order.
function buildDailyCategoryQuestions(ageRange: AgeRange): BankQuestion[][] {
  const seed = dayOfYear() * 31 + (ageRange === "3-4" ? 1 : ageRange === "5-6" ? 2 : 3);
  const rng = seededRng(seed);
  return DAILY_CATEGORIES.map(c => buildCategoryQuestions(ageRange, c.category, PER_CATEGORY, rng));
}

const OPTION_COLORS = ["bg-blue-500 hover:bg-blue-600", "bg-orange-500 hover:bg-orange-600", "bg-green-500 hover:bg-green-600", "bg-purple-500 hover:bg-purple-600"];
const CORRECT_MSGS = ["Amazing! 🎉", "Brilliant! ⭐", "Superstar! 🌟", "Perfect! 🏆", "Wonderful! ✨"];
const WRONG_MSGS = ["Almost! 💪", "Keep going! 🌈", "You've got this! 💡"];

export default function DailyChallenge() {
  const [, setLocation] = useLocation();
  const { activeProfile, gameResults, addGameResult } = useAppContext();
  const { ttsEnabled } = useSoundContext();
  const ageRange = (activeProfile?.ageRange ?? "5-6") as AgeRange;

  const catQuestions = useMemo(() => buildDailyCategoryQuestions(ageRange), [ageRange]);
  const questionHistoryRef = useRef<DCRecord[]>([]);
  const catScoresRef = useRef<number[]>(DAILY_CATEGORIES.map(() => 0));

  const [stage, setStage] = useState<"intro" | "playing" | "catdone" | "done">("intro");
  const [catIdx, setCatIdx] = useState(0);
  const [qInCat, setQInCat] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [finalScores, setFinalScores] = useState<number[]>(DAILY_CATEGORIES.map(() => 0));
  const [showConfetti, setShowConfetti] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [newBadges, setNewBadges] = useState<typeof MILESTONE_BADGES>([]);

  const startGame = () => {
    sounds.pop();
    questionHistoryRef.current = [];
    catScoresRef.current = DAILY_CATEGORIES.map(() => 0);
    setCatIdx(0);
    setQInCat(0);
    setFeedback(null);
    setStage("playing");
  };

  const finish = () => {
    const scores = catScoresRef.current;
    const fs = scores.reduce((a, b) => a + b, 0);
    const pct = fs / TOTAL_Q;
    const stars = pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : 1;
    const pts = computeGamePoints({ score: fs, total: TOTAL_Q, stars, gameId: "daily-challenge" });
    setPointsEarned(pts);

    if (activeProfile) {
      const myPrev = gameResults.filter(r => r.childId === activeProfile.id);
      const prevBadges = getEarnedMilestoneBadges(myPrev);
      addGameResult({
        childId: activeProfile.id,
        gameId: "daily-challenge", gameName: "Daily Challenge", category: "maths",
        score: fs, total: TOTAL_Q, stars,
        questionHistory: questionHistoryRef.current,
      });
      const approxTotal = myPrev.reduce((s, r) => s + r.total, 0) + TOTAL_Q;
      const approxGames = myPrev.length + 1;
      const approxPts = myPrev.reduce((s, r) => s + computeGamePoints({ score: r.score, total: r.total, stars: r.stars, gameId: r.gameId }), 0) + pts;
      const brandNew = MILESTONE_BADGES.filter(b => {
        if (prevBadges.some(pb => pb.id === b.id)) return false;
        if (b.requiredQuestions !== undefined && approxTotal < b.requiredQuestions) return false;
        if (b.requiredGames !== undefined && approxGames < b.requiredGames) return false;
        if (b.requiredPoints !== undefined && approxPts < b.requiredPoints) return false;
        return true;
      });
      setNewBadges(brandNew);
      if (stars === 3 || brandNew.length > 0) { sounds.celebrate(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3500); }
      else sounds.correct();
    }

    setFinalScores([...scores]);
    setStage("done");
  };

  const handleAnswer = (opt: { label: string; isCorrect: boolean }) => {
    if (feedback !== null) return;
    const q = catQuestions[catIdx][qInCat];
    const correctLabel = q.options.find(o => o.isCorrect)?.label ?? "";
    const isCorrect = opt.isCorrect;

    questionHistoryRef.current = [...questionHistoryRef.current, {
      questionId: `${DAILY_CATEGORIES[catIdx].category}-${qInCat}`, questionText: q.questionText,
      childAnswerText: opt.label, correctAnswerText: correctLabel, isCorrect,
    }];

    if (isCorrect) {
      catScoresRef.current[catIdx] += 1;
      sounds.correct();
      if (ttsEnabled) speak(opt.label + "! Correct!");
      setFeedback("correct");
      setFeedbackMsg(CORRECT_MSGS[Math.floor(Math.random() * CORRECT_MSGS.length)]);
    } else {
      sounds.wrong();
      if (ttsEnabled) speak("The correct answer is " + correctLabel);
      setFeedback("wrong");
      setFeedbackMsg(WRONG_MSGS[Math.floor(Math.random() * WRONG_MSGS.length)]);
    }

    setTimeout(() => {
      setFeedback(null);
      if (qInCat < PER_CATEGORY - 1) {
        setQInCat(i => i + 1);
      } else if (catIdx < DAILY_CATEGORIES.length - 1) {
        setStage("catdone");
      } else {
        finish();
      }
    }, 1400);
  };

  const nextCategory = () => {
    sounds.pop();
    setCatIdx(i => i + 1);
    setQInCat(0);
    setFeedback(null);
    setStage("playing");
  };

  // ─── Intro ────────────────────────────────────────────────────────────────
  if (stage === "intro") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full bg-card rounded-[3rem] p-6 sm:p-12 text-center shadow-2xl border-4 border-card-border">
          <div className="text-7xl sm:text-9xl mb-4 sm:mb-6">📅</div>
          <h1 className="text-4xl sm:text-6xl font-black text-foreground mb-3">Daily Challenge</h1>
          <p className="text-lg sm:text-2xl font-bold text-muted-foreground mb-2">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className="text-base sm:text-xl font-bold text-muted-foreground mb-6">
            20 questions — 5 from each of 4 subjects!
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
            {DAILY_CATEGORIES.map(c => (
              <div key={c.category} className={`flex items-center gap-2 rounded-2xl px-3 sm:px-4 py-2 text-white font-black text-sm sm:text-base bg-gradient-to-r ${c.color} shadow-md`}>
                <span className="text-xl sm:text-2xl">{c.emoji}</span>{c.label}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { sounds.click(); setLocation("/home"); }}
              className="h-16 sm:h-20 px-8 sm:px-10 rounded-full text-xl sm:text-2xl font-black border-4 border-border bg-muted hover:bg-muted/80 transition-colors">
              ← Back
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startGame}
              className="h-16 sm:h-20 px-12 sm:px-16 rounded-full text-2xl sm:text-3xl font-black bg-gradient-to-r from-primary to-purple-600 text-white shadow-xl transition-colors">
              Play! 🚀
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Between-category transition ────────────────────────────────────────────
  if (stage === "catdone") {
    const done = DAILY_CATEGORIES[catIdx];
    const next = DAILY_CATEGORIES[catIdx + 1];
    const got = catScoresRef.current[catIdx];
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <Confetti active={got === PER_CATEGORY} />
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.5 }}
          className="max-w-xl w-full bg-card rounded-[3rem] p-6 sm:p-10 text-center shadow-2xl border-4 border-card-border">
          <motion.div animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.8 }}
            className="text-7xl sm:text-8xl mb-4">{done.emoji}</motion.div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-2">{done.label} complete! ✅</h1>
          <p className="text-2xl sm:text-3xl font-black text-secondary mb-6">{got} out of {PER_CATEGORY} correct</p>
          <div className="bg-muted/60 rounded-2xl p-4 mb-6">
            <p className="text-base sm:text-lg font-bold text-muted-foreground mb-1">Next subject:</p>
            <div className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-black text-foreground">
              <span className="text-3xl">{next.emoji}</span>{next.label}
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={nextCategory}
            className="h-16 sm:h-20 px-12 sm:px-16 rounded-full text-2xl sm:text-3xl font-black bg-gradient-to-r from-primary to-purple-600 text-white shadow-xl transition-colors"
            data-testid="button-next-category">
            Keep going! →
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ─── End screen ─────────────────────────────────────────────────────────────
  if (stage === "done") {
    const fs = finalScores.reduce((a, b) => a + b, 0);
    const stars = fs / TOTAL_Q >= 0.8 ? 3 : fs / TOTAL_Q >= 0.5 ? 2 : 1;
    const maxScore = Math.max(...finalScores);
    const minScore = Math.min(...finalScores);
    const strongestIdx = finalScores.indexOf(maxScore);
    const needsIdx = finalScores.indexOf(minScore);
    const showStrengths = maxScore !== minScore; // only meaningful when scores differ
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <Confetti active={showConfetti} />
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.5 }}
          className="max-w-2xl w-full bg-card rounded-[3rem] p-6 sm:p-10 text-center shadow-2xl border-4 border-card-border">
          <div className="flex justify-center gap-2 sm:gap-4 mb-4 sm:mb-5">
            {[1, 2, 3].map(s => (
              <motion.div key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: s * 0.25, type: "spring" }}
                className={`text-5xl sm:text-7xl ${s <= stars ? "" : "opacity-20 grayscale"}`}>⭐</motion.div>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-2 leading-tight">Daily Challenge Done! 📅</h1>
          <p className="text-2xl sm:text-3xl font-bold text-muted-foreground mb-4">{fs} out of {TOTAL_Q}</p>

          {/* Score by category */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {DAILY_CATEGORIES.map((c, i) => (
              <div key={c.category} className="rounded-2xl border-4 border-card-border bg-muted/40 p-3 flex items-center gap-3"
                data-testid={`cat-result-${c.category}`}>
                <span className="text-3xl flex-shrink-0">{c.emoji}</span>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-black text-foreground truncate">{c.label}</p>
                  <p className="text-lg font-black text-secondary">{finalScores[i]} / {PER_CATEGORY}</p>
                </div>
              </div>
            ))}
          </div>

          {showStrengths && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-2xl border-4 border-green-200 bg-green-50 p-3" data-testid="strongest-category">
                <p className="text-xs font-black text-green-700 mb-1">💪 Strongest</p>
                <p className="text-base font-black text-green-800">{DAILY_CATEGORIES[strongestIdx].emoji} {DAILY_CATEGORIES[strongestIdx].label}</p>
              </div>
              <div className="rounded-2xl border-4 border-amber-200 bg-amber-50 p-3" data-testid="needs-practice-category">
                <p className="text-xs font-black text-amber-700 mb-1">🌱 Needs practice</p>
                <p className="text-base font-black text-amber-800">{DAILY_CATEGORIES[needsIdx].emoji} {DAILY_CATEGORIES[needsIdx].label}</p>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border-4 border-amber-200 rounded-2xl px-5 sm:px-6 py-3 inline-block mb-5">
            <p className="text-2xl sm:text-3xl font-black text-amber-800">+{pointsEarned} points earned! 💰</p>
          </div>

          {newBadges.length > 0 && (
            <div className="bg-yellow-50 border-4 border-yellow-300 rounded-2xl p-4 mb-5">
              <p className="text-xl font-black text-yellow-800 mb-3">🏆 New Badge{newBadges.length > 1 ? "s" : ""} Earned!</p>
              <div className="flex gap-4 justify-center flex-wrap">
                {newBadges.map(b => (
                  <div key={b.id} className="text-center">
                    <div className="text-5xl mb-1">{b.emoji}</div>
                    <div className="text-sm font-black text-yellow-800">{b.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-lg sm:text-xl font-bold text-accent mb-6">Come back tomorrow for a new challenge!</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.click(); setLocation("/home"); }}
            className="h-16 sm:h-20 px-10 sm:px-12 rounded-full text-xl sm:text-2xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg transition-colors">
            ← Home
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ─── Playing ────────────────────────────────────────────────────────────────
  const cat = DAILY_CATEGORIES[catIdx];
  const q = catQuestions[catIdx][qInCat];
  const overallNum = catIdx * PER_CATEGORY + qInCat + 1;
  const catPct = (qInCat / PER_CATEGORY) * 100;
  const overallPct = ((catIdx * PER_CATEGORY + qInCat) / TOTAL_Q) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 sm:p-5">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-center gap-3 mb-3 sm:mb-4">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.click(); setLocation("/home"); }}
            className="h-12 sm:h-16 px-4 sm:px-7 rounded-2xl border-4 border-border bg-muted hover:bg-muted/80 font-black text-base sm:text-xl transition-colors flex-shrink-0">
            ← Exit
          </motion.button>
          <div className={`px-4 sm:px-6 py-2 sm:py-3 rounded-3xl shadow-md text-white bg-gradient-to-r ${cat.color} flex items-center gap-2`}>
            <span className="text-xl sm:text-2xl">{cat.emoji}</span>
            <p className="text-base sm:text-xl font-black whitespace-nowrap">{cat.label}</p>
          </div>
          <div className="bg-card border-4 border-card-border px-3 sm:px-5 py-1.5 sm:py-2 rounded-2xl shadow-sm flex-shrink-0">
            <p className="text-sm sm:text-lg font-black text-foreground whitespace-nowrap">{overallNum}/{TOTAL_Q}</p>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-2 mb-4 sm:mb-6">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs sm:text-sm font-black text-muted-foreground">{cat.label} · question {qInCat + 1} of {PER_CATEGORY}</span>
            </div>
            <div className="h-3 sm:h-4 bg-muted rounded-full overflow-hidden">
              <motion.div animate={{ width: `${catPct}%` }} transition={{ duration: 0.4 }}
                className={`h-full rounded-full bg-gradient-to-r ${cat.color}`} data-testid="category-progress" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs sm:text-sm font-black text-muted-foreground">Overall progress</span>
              <span className="text-xs sm:text-sm font-black text-muted-foreground">{overallNum} / {TOTAL_Q}</span>
            </div>
            <div className="h-3 sm:h-4 bg-muted rounded-full overflow-hidden">
              <motion.div animate={{ width: `${overallPct}%` }} transition={{ duration: 0.4 }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-purple-600" data-testid="overall-progress" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center max-w-5xl mx-auto w-full">
        <div className="bg-card w-full rounded-[3rem] p-5 sm:p-10 mb-4 sm:mb-6 shadow-xl border-4 border-card-border min-h-[200px] sm:min-h-[280px] flex flex-col items-center justify-center relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={`${catIdx}-${qInCat}`} initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -80, opacity: 0 }}
              className="text-4xl sm:text-6xl font-black text-foreground w-full text-center break-words">
              {q.prompt}
            </motion.div>
          </AnimatePresence>
          <SpeakerButton text={q.questionText} label="Hear question" size="lg" className="mt-4" />
          <AnimatePresence>
            {feedback && (
              <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
                className={`absolute inset-0 flex items-center justify-center text-3xl sm:text-5xl font-black text-white rounded-[3rem] px-4 text-center ${feedback === "correct" ? "bg-green-500" : "bg-red-500"}`}>
                {feedbackMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 w-full">
          {q.options.map((opt, idx) => (
            <div key={idx} className="relative">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => handleAnswer(opt)}
                disabled={feedback !== null}
                className={`w-full h-28 sm:h-36 md:h-44 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl text-3xl sm:text-4xl md:text-5xl font-black text-white transition-all px-2 break-words ${OPTION_COLORS[idx % OPTION_COLORS.length]}`}>
                {opt.label}
              </motion.button>
              {ttsEnabled && (
                <button type="button" aria-label={`Hear: ${opt.label}`}
                  onClick={(e) => { e.stopPropagation(); speak(opt.label); }}
                  className="absolute top-2 right-2 w-12 h-12 rounded-full bg-white/30 hover:bg-white/50 border border-white/40 flex items-center justify-center text-white text-2xl transition-all active:scale-90 select-none">
                  🔈
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
