import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";
import Confetti from "@/components/Confetti";

interface TimedQuestion {
  id: string;
  text: string;
  options: { label: string; isCorrect: boolean }[];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function genAddQ(max: number): TimedQuestion {
  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * max) + 1;
  const correct = a + b;
  const wrong = new Set<number>();
  while (wrong.size < 3) { const n = Math.floor(Math.random() * (max * 2 + 1)); if (n !== correct) wrong.add(n); }
  return {
    id: Math.random().toString(36).slice(2),
    text: `${a} + ${b} = ?`,
    options: shuffle([{ label: String(correct), isCorrect: true }, ...[...wrong].map(n => ({ label: String(n), isCorrect: false }))])
  };
}

function genSubQ(max: number): TimedQuestion {
  const a = Math.floor(Math.random() * max) + 2;
  const b = Math.floor(Math.random() * a);
  const correct = a - b;
  const wrong = new Set<number>();
  while (wrong.size < 3) { const n = Math.max(0, Math.floor(Math.random() * (max + 1))); if (n !== correct) wrong.add(n); }
  return {
    id: Math.random().toString(36).slice(2),
    text: `${a} − ${b} = ?`,
    options: shuffle([{ label: String(correct), isCorrect: true }, ...[...wrong].map(n => ({ label: String(n), isCorrect: false }))])
  };
}

function genBigQ(max: number): TimedQuestion {
  let a = Math.floor(Math.random() * max) + 1, b = Math.floor(Math.random() * max) + 1;
  while (a === b) b = Math.floor(Math.random() * max) + 1;
  const bigger = Math.max(a, b);
  const smaller = Math.min(a, b);
  return {
    id: Math.random().toString(36).slice(2),
    text: `Which is bigger: ${a} or ${b}?`,
    options: shuffle([{ label: String(bigger), isCorrect: true }, { label: String(smaller), isCorrect: false },
      { label: String(bigger + 1), isCorrect: false }, { label: String(bigger - 1), isCorrect: false }])
  };
}

const OPTION_COLOURS = ["bg-blue-500 hover:bg-blue-600", "bg-orange-500 hover:bg-orange-600", "bg-green-500 hover:bg-green-600", "bg-purple-500 hover:bg-purple-600"];
const TIME_LIMIT = 60;

export default function TimedMaths() {
  const [, setLocation] = useLocation();
  const { activeProfile, addGameResult } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "7-8";
  const maxNum = ageRange === "3-4" ? 5 : ageRange === "5-6" ? 10 : 20;

  const [stage, setStage] = useState<"intro" | "playing" | "done">("intro");
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [current, setCurrent] = useState<TimedQuestion | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const genQuestion = () => {
    const fns = ageRange === "7-8" ? [genAddQ, genSubQ, genBigQ] : ageRange === "5-6" ? [genAddQ, genBigQ] : [genAddQ];
    const fn = fns[Math.floor(Math.random() * fns.length)];
    setCurrent(fn(maxNum));
  };

  const startGame = () => {
    sounds.pop();
    setScore(0);
    setTotal(0);
    setTimeLeft(TIME_LIMIT);
    setFeedback(null);
    setStage("playing");
    genQuestion();
  };

  useEffect(() => {
    if (stage !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setStage("done");
          sounds.celebrate();
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3500);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stage]);

  useEffect(() => {
    if (stage === "done" && activeProfile) {
      const stars = score >= 12 ? 3 : score >= 6 ? 2 : 1;
      addGameResult({ childId: activeProfile.id, gameId: "timed-maths", gameName: "Timed Maths", category: "maths", score, total, stars });
    }
  }, [stage]);

  const handleAnswer = (isCorrect: boolean) => {
    if (feedback !== null) return;
    setTotal(t => t + 1);
    if (isCorrect) { sounds.correct(); setScore(s => s + 1); setFeedback("correct"); }
    else { sounds.wrong(); setFeedback("wrong"); }
    setTimeout(() => { setFeedback(null); genQuestion(); }, 700);
  };

  if (stage === "intro") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full bg-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 text-center shadow-2xl border-4 border-card-border">
          <div className="text-7xl sm:text-9xl mb-6 sm:mb-8">⏱️</div>
          <h1 className="text-3xl sm:text-6xl font-black text-foreground mb-4">Timed Maths</h1>
          <p className="text-lg sm:text-3xl font-bold text-muted-foreground mb-4">Answer as many as you can in {TIME_LIMIT} seconds!</p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mt-10">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { sounds.click(); setLocation("/maths"); }}
              className="h-16 sm:h-20 px-10 rounded-full text-2xl font-black border-4 border-border bg-muted hover:bg-muted/80 transition-colors">
              ← Back
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startGame}
              className="h-16 sm:h-20 px-10 sm:px-16 rounded-full text-3xl font-black bg-primary hover:bg-primary/90 text-white shadow-xl transition-colors">
              Start! 🚀
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (stage === "done") {
    const stars = score >= 12 ? 3 : score >= 6 ? 2 : 1;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Confetti active={showConfetti} />
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="max-w-2xl w-full bg-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 text-center shadow-2xl border-4 border-card-border">
          <div className="flex justify-center gap-4 mb-8">
            {[1, 2, 3].map(s => (
              <motion.div key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: s * 0.25, type: "spring" }}
                className={`text-6xl sm:text-8xl ${s <= stars ? "" : "opacity-20 grayscale"}`}>⭐</motion.div>
            ))}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground mb-4">Time's Up! ⏱️</h1>
          <p className="text-2xl sm:text-4xl font-bold text-muted-foreground mb-2">{score} correct out of {total}</p>
          <p className="text-xl sm:text-2xl font-bold text-muted-foreground mb-10">
            {stars === 3 ? "Speed Champion! 🏆" : stars === 2 ? "Great Speed! 🌟" : "Keep Practising! 💪"}
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { sounds.click(); setLocation("/maths"); }}
              className="h-16 sm:h-20 px-10 rounded-full text-2xl font-black border-4 border-border bg-muted hover:bg-muted/80 transition-colors">
              ← Back to Games
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startGame}
              className="h-16 sm:h-20 px-12 rounded-full text-2xl font-black bg-secondary hover:bg-secondary/90 text-white shadow-lg transition-colors">
              Try Again 🔄
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const timerPct = (timeLeft / TIME_LIMIT) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col p-5">
      <div className="max-w-3xl mx-auto w-full mb-6">
        <div className="flex justify-between items-center gap-2 mb-4">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.click(); clearInterval(timerRef.current!); setLocation("/maths"); }}
            className="h-12 sm:h-16 px-4 sm:px-7 rounded-2xl border-4 border-border bg-muted hover:bg-muted/80 font-black text-base sm:text-xl transition-colors flex-shrink-0">
            ← Exit
          </motion.button>
          <div className="bg-card px-3 sm:px-8 py-2 sm:py-3 rounded-3xl border-4 border-card-border shadow-md text-center flex-shrink min-w-0">
            <p className="text-base sm:text-2xl font-black text-foreground whitespace-nowrap">{score} correct</p>
          </div>
        </div>
        <div className="h-6 bg-muted rounded-full overflow-hidden border-2 border-border">
          <motion.div
            animate={{ width: `${timerPct}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full rounded-full ${timeLeft > 20 ? "bg-green-500" : timeLeft > 10 ? "bg-yellow-500" : "bg-red-500"}`}
          />
        </div>
        <p className="text-center text-2xl font-black text-muted-foreground mt-2">{timeLeft}s</p>
      </div>

      <div className="flex-1 flex flex-col items-center max-w-3xl mx-auto w-full">
        <div className="bg-card w-full rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-10 mb-6 shadow-xl border-4 border-card-border min-h-[200px] flex items-center justify-center relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p key={current?.id} initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -80, opacity: 0 }}
              className="text-3xl sm:text-6xl md:text-8xl font-black text-foreground text-center px-2">
              {current?.text}
            </motion.p>
          </AnimatePresence>
          <AnimatePresence>
            {feedback && (
              <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
                className={`absolute inset-0 flex items-center justify-center text-3xl sm:text-5xl font-black text-white rounded-[2rem] sm:rounded-[3rem] ${feedback === "correct" ? "bg-green-500" : "bg-red-500"}`}>
                {feedback === "correct" ? "✓ Correct!" : "✗ Not quite!"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 w-full">
          {current?.options.map((opt, idx) => (
            <motion.button key={idx} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => handleAnswer(opt.isCorrect)}
              disabled={feedback !== null}
              className={`h-24 sm:h-32 rounded-[2.5rem] shadow-xl text-2xl sm:text-4xl font-black text-white transition-all ${OPTION_COLOURS[idx % OPTION_COLOURS.length]}`}>
              {opt.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
