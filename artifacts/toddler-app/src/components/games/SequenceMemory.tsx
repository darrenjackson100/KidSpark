import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext, QuestionRecord } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";
import Confetti from "@/components/Confetti";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const ITEM_POOL = [
  "🐱","🐶","🐸","🦋","🌟","🍎","🎈","🌸","🐘","🦁",
  "🚀","⭐","🎨","🍀","🦄","🌈","🎯","🐧","🦊","🐻",
  "🍉","🎸","🌙","🦒","🔮","🎪","🐳","🦅","🍓","🌺",
];

type Phase = "intro" | "showing" | "recall" | "feedback" | "done";

interface RoundResult {
  sequence: string[];
  childAnswer: string[];
  isCorrect: boolean;
}

const ROUNDS = 5;

function getSeqLen(ageRange: string, round: number): number {
  const base = ageRange === "3-4" ? 3 : ageRange === "5-6" ? 3 : 4;
  return base + Math.floor(round / 2);
}

export default function SequenceMemory() {
  const [, setLocation] = useLocation();
  const { activeProfile, addGameResult } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "5-6";

  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [childAnswer, setChildAnswer] = useState<string[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [poolItems, setPoolItems] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const startTimeRef = useRef(Date.now());

  const startRound = useCallback((r: number) => {
    const len = getSeqLen(ageRange, r);
    const seq = shuffle(ITEM_POOL).slice(0, len);
    const pool = shuffle([...seq, ...shuffle(ITEM_POOL.filter(x => !seq.includes(x))).slice(0, 4)]).slice(0, Math.min(seq.length + 4, 12));
    setSequence(seq);
    setPoolItems(pool);
    setChildAnswer([]);
    setCountdown(3);
    setPhase("showing");
  }, [ageRange]);

  const startGame = () => {
    sounds.pop();
    setRound(0);
    setRoundResults([]);
    startTimeRef.current = Date.now();
    startRound(0);
  };

  // Countdown while showing
  useEffect(() => {
    if (phase !== "showing") return;
    if (countdown <= 0) { setPhase("recall"); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  const handleTap = (item: string) => {
    if (phase !== "recall") return;
    const newAnswer = [...childAnswer, item];
    sounds.click();
    setChildAnswer(newAnswer);

    if (newAnswer.length === sequence.length) {
      const correct = newAnswer.every((x, i) => x === sequence[i]);
      setLastCorrect(correct);
      if (correct) sounds.correct(); else sounds.wrong();
      const result: RoundResult = { sequence: [...sequence], childAnswer: newAnswer, isCorrect: correct };
      const newResults = [...roundResults, result];
      setRoundResults(newResults);
      setPhase("feedback");

      setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= ROUNDS) {
          const score = newResults.filter(r => r.isCorrect).length;
          const stars = score >= 4 ? 3 : score >= 3 ? 2 : 1;
          const timeTakenSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
          const questionHistory: QuestionRecord[] = newResults.map((r, i) => ({
            questionId: `q${i}`,
            questionText: `Round ${i + 1}: Remember the sequence in order — ${r.sequence.join(", ")}`,
            childAnswerText: r.childAnswer.join(", "),
            correctAnswerText: r.sequence.join(", "),
            isCorrect: r.isCorrect,
            explanation: r.isCorrect
              ? `Great job! You remembered the sequence correctly: ${r.sequence.join(", ")}`
              : `The correct order was: ${r.sequence.join(", ")}. You answered: ${r.childAnswer.join(", ")}`,
          }));
          if (activeProfile) {
            addGameResult({
              childId: activeProfile.id,
              gameId: "sequence-memory",
              gameName: "Sequence Memory",
              category: "maths",
              score, total: ROUNDS, stars,
              timeTakenSeconds,
              questionHistory,
            });
          }
          if (stars === 3) { sounds.celebrate(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3500); }
          setPhase("done");
        } else {
          setRound(nextRound);
          startRound(nextRound);
        }
      }, 1500);
    }
  };

  const undo = () => {
    if (childAnswer.length > 0) {
      sounds.click();
      setChildAnswer(a => a.slice(0, -1));
    }
  };

  if (phase === "intro") return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl w-full bg-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 text-center shadow-2xl border-4 border-card-border">
        <div className="text-7xl sm:text-9xl mb-6 sm:mb-8">🔢</div>
        <h1 className="text-3xl sm:text-6xl font-black text-foreground mb-4">Sequence Memory</h1>
        <p className="text-xl sm:text-2xl font-bold text-muted-foreground mb-4">Watch the sequence of pictures — then tap them back in the <strong>same order</strong>!</p>
        <p className="text-lg sm:text-xl font-bold text-muted-foreground mb-8 sm:mb-12">{ROUNDS} rounds · Gets harder each round</p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.click(); setLocation("/memory-hub"); }}
            className="h-16 sm:h-20 px-10 rounded-full text-2xl font-black border-4 border-border bg-muted hover:bg-muted/80 transition-colors">
            ← Back
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="h-16 sm:h-20 px-10 sm:px-16 rounded-full text-3xl font-black bg-primary hover:bg-primary/90 text-white shadow-xl transition-colors"
            data-testid="button-start-game">
            Start! 🚀
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  if (phase === "done") {
    const score = roundResults.filter(r => r.isCorrect).length;
    const stars = score >= 4 ? 3 : score >= 3 ? 2 : 1;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Confetti active={showConfetti} />
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.5 }}
          className="max-w-2xl w-full bg-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 text-center shadow-2xl border-4 border-card-border">
          <div className="flex justify-center gap-4 mb-8">
            {[1,2,3].map(s => (
              <motion.div key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: s * 0.25, type: "spring" }}
                className={`text-6xl sm:text-8xl ${s <= stars ? "" : "opacity-20 grayscale"}`}>⭐</motion.div>
            ))}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground mb-4">
            {stars === 3 ? "Amazing Memory! 🏆" : stars === 2 ? "Great Job! 🌟" : "Good Effort! 💪"}
          </h1>
          <p className="text-lg sm:text-3xl font-bold text-muted-foreground mb-10">{score} of {ROUNDS} rounds correct</p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { sounds.click(); setLocation("/memory-hub"); }}
              className="h-16 sm:h-20 px-10 rounded-full text-2xl font-black border-4 border-border bg-muted hover:bg-muted/80 transition-colors"
              data-testid="button-back-to-games">
              ← Back to Games
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="h-16 sm:h-20 px-12 rounded-full text-2xl font-black bg-secondary hover:bg-secondary/90 text-white shadow-lg transition-colors"
              data-testid="button-play-again">
              Play Again 🔄
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-5 flex flex-col">
      <div className="flex justify-between items-center gap-2 mb-6 max-w-3xl mx-auto w-full">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { sounds.click(); setLocation("/memory-hub"); }}
          className="h-12 sm:h-16 px-4 sm:px-7 rounded-2xl border-4 border-border bg-muted hover:bg-muted/80 font-black text-base sm:text-xl transition-colors flex-shrink-0"
          data-testid="button-exit-game">
          ← Exit
        </motion.button>
        <div className="bg-card px-3 sm:px-8 py-2 sm:py-3 rounded-3xl border-4 border-card-border shadow-md text-center flex-shrink min-w-0">
          <p className="text-base sm:text-xl font-black text-foreground whitespace-nowrap">Round {round + 1} of {ROUNDS}</p>
          <p className="text-sm font-bold text-muted-foreground whitespace-nowrap">{sequence.length} items to remember</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {roundResults.map((r,i) => <span key={i} className={`text-2xl ${r.isCorrect ? "" : "grayscale opacity-50"}`}>⭐</span>)}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center max-w-3xl mx-auto w-full gap-6">

        {/* Sequence display area */}
        <div className="bg-card w-full rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 shadow-xl border-4 border-card-border flex flex-col items-center gap-4 min-h-[200px] justify-center">
          <AnimatePresence mode="wait">
            {phase === "showing" && (
              <motion.div key="showing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                <p className="text-2xl font-black text-muted-foreground">Remember this sequence! ⏳ {countdown}s</p>
                <div className="flex gap-4 flex-wrap justify-center">
                  {sequence.map((item, i) => (
                    <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.12 }}
                      className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 border-4 border-primary rounded-2xl flex items-center justify-center text-3xl sm:text-5xl shadow-md">
                      {item}
                    </motion.div>
                  ))}
                </div>
                <div className="w-48 h-3 bg-muted rounded-full overflow-hidden mt-2">
                  <motion.div className="h-full bg-primary rounded-full" initial={{ width: "100%" }}
                    animate={{ width: "0%" }} transition={{ duration: 3, ease: "linear" }} />
                </div>
              </motion.div>
            )}

            {(phase === "recall" || phase === "feedback") && (
              <motion.div key="recall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 w-full">
                <p className="text-2xl font-black text-muted-foreground">
                  {phase === "feedback"
                    ? (lastCorrect ? "✅ Correct! Well done!" : "❌ Not quite — see the correct order below")
                    : `Tap the ${sequence.length} items in the correct order!`}
                </p>

                {/* Child's answer so far */}
                <div className="flex gap-3 flex-wrap justify-center min-h-[80px] items-center">
                  {sequence.map((_, i) => (
                    <div key={i} className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl border-4 flex items-center justify-center text-2xl sm:text-4xl transition-all ${
                      i < childAnswer.length
                        ? phase === "feedback"
                          ? childAnswer[i] === sequence[i] ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"
                          : "border-primary bg-primary/10"
                        : "border-dashed border-muted-foreground/40 bg-muted"
                    }`}>
                      {i < childAnswer.length ? childAnswer[i] : <span className="text-xl font-black text-muted-foreground">{i+1}</span>}
                    </div>
                  ))}
                </div>

                {phase === "feedback" && !lastCorrect && (
                  <div className="flex gap-2 items-center bg-green-50 border-2 border-green-200 rounded-2xl px-5 py-3">
                    <span className="text-sm font-bold text-green-800">Correct order: </span>
                    {sequence.map((item, i) => <span key={i} className="text-2xl">{item}</span>)}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tap grid */}
        {phase === "recall" && (
          <div className="w-full">
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
              {poolItems.map((item, i) => (
                <motion.button key={`${item}-${i}`} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                  onClick={() => handleTap(item)}
                  className="h-16 sm:h-24 rounded-[1.5rem] bg-card border-4 border-card-border shadow-md text-3xl sm:text-5xl flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-all">
                  {item}
                </motion.button>
              ))}
            </div>
            {childAnswer.length > 0 && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={undo}
                className="w-full h-14 rounded-2xl border-4 border-border bg-muted hover:bg-muted/80 text-lg font-black text-muted-foreground transition-colors">
                ↩ Undo last tap
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
