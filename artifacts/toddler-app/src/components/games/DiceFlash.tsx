import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import { useSoundContext } from "@/context/SoundContext";
import { speak } from "@/lib/speech";
import { sounds } from "@/lib/sounds";
import { computeGamePoints } from "@/lib/points";
import Confetti from "@/components/Confetti";

type Phase = "intro" | "flash" | "think" | "feedback" | "score";
type AgeRange = "3-4" | "5-6" | "7-8";

interface Round { dice: number[]; total: number; showMs: number; askAddition: boolean; }

const DOT_POSITIONS: number[][] = [
  [],
  [4],
  [2, 6],
  [2, 4, 6],
  [0, 2, 6, 8],
  [0, 2, 4, 6, 8],
  [0, 2, 3, 5, 6, 8],
];

function DiceFace({ value, size = "lg" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const dots = DOT_POSITIONS[Math.max(1, Math.min(6, value))] ?? [];
  // Mobile-first: dice scale up at `sm:`. The large flash dice must shrink on
  // phones so two of them never overflow the question card.
  const sizeClass = size === "lg"
    ? "w-24 h-24 p-2 gap-1.5 sm:w-44 sm:h-44 sm:p-4 sm:gap-3"
    : size === "md" ? "w-32 h-32 p-3 gap-2" : "w-20 h-20 p-2 gap-1";
  const dotClass = size === "lg" ? "w-6 h-6 sm:w-10 sm:h-10" : size === "md" ? "w-7 h-7" : "w-4 h-4";
  return (
    <div className={`bg-white rounded-3xl border-4 border-gray-800 shadow-2xl grid grid-cols-3 ${sizeClass}`}>
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="flex items-center justify-center">
          {dots.includes(i) && <div className={`${dotClass} rounded-full bg-gray-900`} />}
        </div>
      ))}
    </div>
  );
}

const ROUND_COUNT = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Enumerate every distinct dice round available for an age range. Two-dice
// rounds are stored once per sorted pair so (a,b) and (b,a) aren't duplicates.
function buildPool(ageRange: AgeRange): Round[] {
  const pool: Round[] = [];
  if (ageRange === "3-4") {
    for (let v = 1; v <= 5; v++) pool.push({ dice: [v], total: v, showMs: 3000, askAddition: false });
  } else if (ageRange === "5-6") {
    for (let v = 1; v <= 6; v++) pool.push({ dice: [v], total: v, showMs: 2000, askAddition: false });
    for (let a = 1; a <= 5; a++) for (let b = a; b <= 5; b++) pool.push({ dice: [a, b], total: a + b, showMs: 2000, askAddition: false });
  } else {
    for (let a = 1; a <= 6; a++) for (let b = a; b <= 6; b++) pool.push({ dice: [a, b], total: a + b, showMs: 1500, askAddition: false });
  }
  return pool;
}

// Safe round generation: build the full pool, shuffle, take the first 10 unique
// rounds. If the pool is smaller than 10, refill from a fresh shuffle so we only
// repeat after the pool is exhausted. We prefer to avoid the same total twice in
// a row, but never block: every iteration consumes one item, so this always
// terminates in ROUND_COUNT steps.
function generateRounds(ageRange: AgeRange): Round[] {
  const pool = buildPool(ageRange);
  if (pool.length === 0) return [];

  const rounds: Round[] = [];
  let bag = shuffle(pool);

  while (rounds.length < ROUND_COUNT) {
    if (bag.length === 0) bag = shuffle(pool); // pool exhausted -> allow safe repeats
    const prevTotal = rounds.length > 0 ? rounds[rounds.length - 1].total : null;
    let idx = bag.findIndex((r) => r.total !== prevTotal);
    if (idx === -1) idx = 0; // only same-total options left (tiny pool) -> accept
    const [chosen] = bag.splice(idx, 1);
    rounds.push(chosen);
  }

  // Addition questions for the older group only kick in for the second half.
  return rounds.map((r, i) => (ageRange === "7-8" ? { ...r, askAddition: i >= ROUND_COUNT / 2 } : r));
}

// Always returns exactly 4 distinct answer options including the correct total.
// Bounded loops only — never spins even when `total` is 1.
function makeChoices(total: number, max = 12): string[] {
  const choices = new Set<number>([total]);
  const candidates: number[] = [];
  for (let d = -3; d <= 3; d++) {
    const n = total + d;
    if (n >= 1 && n <= max + 2 && n !== total) candidates.push(n);
  }
  for (const c of shuffle(candidates)) {
    if (choices.size >= 4) break;
    choices.add(c);
  }
  // Fallback padding in case the near-range didn't yield enough distinct values.
  for (let n = 1; choices.size < 4 && n <= max + 6; n++) {
    if (n !== total) choices.add(n);
  }
  return shuffle([...choices]).map(String);
}

const OPTION_COLOURS = ["bg-blue-500 hover:bg-blue-600","bg-orange-500 hover:bg-orange-600","bg-green-500 hover:bg-green-600","bg-purple-500 hover:bg-purple-600"];
const CORRECT_MSGS = ["Amazing! 🎉","Brilliant! ⭐","Superstar! 🌟","Perfect! 🏆","Wonderful! ✨"];
const WRONG_MSGS = ["Almost! 💪","Keep going! 🌈","Good try! 💡"];

export default function DiceFlash() {
  const [, setLocation] = useLocation();
  const { activeProfile, addGameResult } = useAppContext();
  const { ttsEnabled } = useSoundContext();
  const ageRange = (activeProfile?.ageRange ?? "5-6") as AgeRange;

  const [phase, setPhase] = useState<Phase>("intro");
  const [roundIdx, setRoundIdx] = useState(0);
  const [flashPct, setFlashPct] = useState(100);
  const [chosen, setChosen] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [records, setRecords] = useState<{ q: string; child: string; answer: string; ok: boolean }[]>([]);

  const rounds = useMemo(() => generateRounds(ageRange), [ageRange]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentRound = rounds[roundIdx];

  useEffect(() => {
    if (phase !== "flash") return;
    const start = Date.now();
    const dur = currentRound.showMs;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / dur) * 100);
      setFlashPct(pct);
      if (elapsed >= dur) {
        clearInterval(timerRef.current!);
        setPhase("think");
      }
    }, 50);
    return () => clearInterval(timerRef.current!);
  }, [phase, roundIdx]);

  function startGame() {
    sounds.pop();
    setScore(0);
    setRecords([]);
    setRoundIdx(0);
    setFlashPct(100);
    setPhase("flash");
  }

  function handleAnswer(choice: string) {
    if (phase !== "think") return;
    const isCorrect = choice === String(currentRound.total);
    setChosen(choice);
    const qText = currentRound.askAddition
      ? `${currentRound.dice[0]} + ${currentRound.dice[1]} = ?`
      : `How many dots? (${currentRound.dice.join(" + ")} = ${currentRound.total})`;

    setRecords(prev => [...prev, { q: qText, child: choice, answer: String(currentRound.total), ok: isCorrect }]);

    if (isCorrect) {
      sounds.correct();
      if (ttsEnabled) speak(choice + "! Correct!");
      setScore(s => s + 1);
      setFeedbackMsg(CORRECT_MSGS[Math.floor(Math.random() * CORRECT_MSGS.length)]);
    } else {
      sounds.wrong();
      if (ttsEnabled) speak("The answer was " + String(currentRound.total));
      setFeedbackMsg(WRONG_MSGS[Math.floor(Math.random() * WRONG_MSGS.length)]);
    }
    setCorrect(isCorrect);
    setPhase("feedback");

    setTimeout(() => {
      if (roundIdx < rounds.length - 1) {
        setRoundIdx(i => i + 1);
        setFlashPct(100);
        setChosen(null);
        setPhase("flash");
      } else {
        const fs = score + (isCorrect ? 1 : 0);
        const pct = fs / rounds.length;
        const stars = pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : 1;
        if (activeProfile) {
          addGameResult({
            childId: activeProfile.id,
            gameId: "dice-flash",
            gameName: "Dice Flash Challenge",
            category: "maths",
            score: fs,
            total: rounds.length,
            stars,
            questionHistory: records.map((r, i) => ({
              questionId: `df${i}`,
              questionText: r.q,
              childAnswerText: r.child,
              correctAnswerText: r.answer,
              isCorrect: r.ok,
            })),
          });
        }
        if (stars === 3) { sounds.celebrate(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3500); }
        else sounds.correct();
        setScore(fs);
        setPhase("score");
      }
    }, 1400);
  }

  const choices = useMemo(() => makeChoices(currentRound.total, 12), [roundIdx]);

  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full bg-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 text-center shadow-2xl border-4 border-card-border">
          <div className="text-7xl sm:text-9xl mb-4 sm:mb-6">🎲</div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground mb-3">Dice Flash Challenge</h1>
          <p className="text-lg sm:text-2xl font-bold text-muted-foreground mb-6 sm:mb-8">
            Watch the dice carefully, then remember how many dots you saw!
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-8 sm:mb-10">
            {ageRange === "3-4" && <div className="bg-blue-50 text-blue-800 border-2 border-blue-200 rounded-2xl px-4 py-2 font-bold text-sm sm:text-base">1 die · Up to 5 dots · 3 sec</div>}
            {ageRange === "5-6" && <div className="bg-blue-50 text-blue-800 border-2 border-blue-200 rounded-2xl px-4 py-2 font-bold text-sm sm:text-base">1–2 dice · Up to 12 dots · 2 sec</div>}
            {ageRange === "7-8" && <div className="bg-blue-50 text-blue-800 border-2 border-blue-200 rounded-2xl px-4 py-2 font-bold text-sm sm:text-base">2 dice · Addition questions · 1.5 sec</div>}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { sounds.click(); setLocation("/maths"); }}
              className="h-16 sm:h-20 px-8 sm:px-10 rounded-full text-xl sm:text-2xl font-black border-4 border-border bg-muted hover:bg-muted/80 text-foreground transition-colors">
              ← Back
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startGame}
              className="h-16 sm:h-20 px-10 sm:px-16 rounded-full text-2xl sm:text-3xl font-black bg-primary hover:bg-primary/90 text-white shadow-xl"
              data-testid="button-start-game">
              Start! 🚀
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === "score") {
    const pct = Math.round((score / rounds.length) * 100);
    const stars = pct >= 80 ? 3 : pct >= 50 ? 2 : 1;
    const pts = computeGamePoints({ score, total: rounds.length, stars, gameId: "dice-flash" });
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <Confetti active={showConfetti} />
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.5 }}
          className="max-w-2xl w-full bg-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 text-center shadow-2xl border-4 border-card-border">
          <div className="flex justify-center gap-3 sm:gap-4 mb-5 sm:mb-6">
            {[1,2,3].map(s => (
              <motion.div key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: s * 0.25, type: "spring" }}
                className={`text-5xl sm:text-7xl ${s <= stars ? "" : "opacity-20 grayscale"}`}>⭐</motion.div>
            ))}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground mb-3">
            {stars === 3 ? "Outstanding! 🏆" : stars === 2 ? "Fantastic! 🌟" : "Great Effort! 💪"}
          </h1>
          <p className="text-2xl sm:text-4xl font-bold text-muted-foreground mb-4">{score} out of {rounds.length}</p>
          <div className="bg-amber-50 border-4 border-amber-200 rounded-2xl px-5 sm:px-6 py-3 sm:py-4 mb-6 sm:mb-8 inline-block">
            <p className="text-2xl sm:text-3xl font-black text-amber-800">+{pts} points earned! 💰</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { sounds.click(); setLocation("/maths"); }}
              className="h-16 px-8 sm:px-10 rounded-full text-lg sm:text-xl font-black border-4 border-border bg-muted hover:bg-muted/80 text-foreground">
              ← Back to Games
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startGame}
              className="h-16 px-8 sm:px-10 rounded-full text-lg sm:text-xl font-black bg-secondary text-white shadow-lg"
              data-testid="button-play-again">
              Play Again 🔄
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const questionText = currentRound.askAddition
    ? `${currentRound.dice[0]} + ${currentRound.dice[1]} = ?`
    : "How many dots did you see?";

  return (
    <div className="min-h-screen bg-background flex flex-col p-3 sm:p-5">
      <div className="flex justify-between items-center gap-2 mb-4 max-w-3xl mx-auto w-full">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { sounds.click(); setLocation("/maths"); }}
          className="h-12 sm:h-14 px-4 sm:px-6 rounded-2xl border-4 border-border bg-muted hover:bg-muted/80 font-black text-base sm:text-xl flex-shrink-0">
          ← Exit
        </motion.button>
        <div className="bg-card px-3 sm:px-6 py-2 sm:py-3 rounded-2xl border-4 border-card-border shadow-sm flex items-center gap-2 sm:gap-4 flex-shrink min-w-0">
          <span className="text-base sm:text-xl font-black text-foreground whitespace-nowrap">🎲 {roundIdx + 1}/{rounds.length}</span>
          <span className="text-base sm:text-xl font-black text-primary whitespace-nowrap">✓ {score}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full gap-4 sm:gap-6">
        {/* Dice area */}
        <div className="bg-card w-full rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-10 shadow-xl border-4 border-card-border flex flex-col items-center justify-center min-h-[240px] sm:min-h-[320px] relative overflow-hidden">
          <AnimatePresence mode="wait">
            {phase === "flash" && (
              <motion.div key="dice" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.2, opacity: 0 }}
                className="flex flex-wrap gap-3 sm:gap-6 items-center justify-center max-w-full">
                {currentRound.dice.map((v, i) => <DiceFace key={i} value={v} size="lg" />)}
                {currentRound.askAddition && currentRound.dice.length > 1 && (
                  <span className="text-4xl sm:text-6xl font-black text-muted-foreground mx-1 sm:mx-2">+</span>
                )}
              </motion.div>
            )}
            {(phase === "think" || phase === "feedback") && (
              <motion.div key="thinking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-center px-2">
                <div className="text-6xl sm:text-8xl mb-3 sm:mb-4">🤔</div>
                <p className="text-2xl sm:text-4xl font-black text-foreground">{questionText}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Flash progress bar */}
          {phase === "flash" && (
            <div className="absolute bottom-0 left-0 right-0 h-3 bg-muted rounded-b-[2rem] sm:rounded-b-[3rem] overflow-hidden">
              <div className="h-full bg-primary transition-all duration-100 rounded-b-[2rem] sm:rounded-b-[3rem]" style={{ width: `${flashPct}%` }} />
            </div>
          )}
          {/* Feedback overlay */}
          <AnimatePresence>
            {phase === "feedback" && (
              <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
                className={`absolute inset-0 flex items-center justify-center text-center px-3 text-3xl sm:text-5xl font-black text-white rounded-[2rem] sm:rounded-[3rem] ${correct ? "bg-green-500" : "bg-red-500"}`}>
                {feedbackMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Answer buttons */}
        {phase === "think" && (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 w-full">
            {choices.map((c, i) => (
              <motion.button key={c} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => handleAnswer(c)}
                className={`h-24 sm:h-36 md:h-44 rounded-[1.75rem] sm:rounded-[2.5rem] shadow-xl text-4xl sm:text-5xl md:text-6xl font-black text-white transition-all ${OPTION_COLOURS[i % OPTION_COLOURS.length]}`}>
                {c}
              </motion.button>
            ))}
          </div>
        )}

        {phase === "flash" && (
          <p className="text-xl sm:text-3xl font-black text-muted-foreground animate-pulse text-center">👀 Watch carefully!</p>
        )}
      </div>
    </div>
  );
}
