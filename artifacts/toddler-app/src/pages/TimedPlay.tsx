import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { useSoundContext } from "@/context/SoundContext";
import { speak } from "@/lib/speech";
import { sounds } from "@/lib/sounds";
import { buildMixedQuestions, BankQuestion, Category } from "@/lib/questionBank";
import { computeGamePoints, getEarnedMilestoneBadges, MILESTONE_BADGES } from "@/lib/points";
import { QuestionRecord } from "@/context/AppContext";
import Confetti from "@/components/Confetti";
import SpeakerButton from "@/components/SpeakerButton";

type Phase = "setup" | "playing" | "done";
const DURATIONS = [5, 10, 15, 30] as const;
const OPTION_COLOURS = ["bg-blue-500 hover:bg-blue-600","bg-orange-500 hover:bg-orange-600","bg-green-500 hover:bg-green-600","bg-purple-500 hover:bg-purple-600"];
const CORRECT_MSGS = ["Amazing! 🎉","Brilliant! ⭐","Superstar! 🌟","Correct! 🏆","Wonderful! ✨"];
const WRONG_MSGS = ["Almost! 💪","Keep going! 🌈","Good try! 💡"];
const CAT_EMOJI: Record<Category, string> = { maths:"🔢", animals:"🦁", reading:"📖", science:"🧪", colours:"🎨", health:"🥦" };

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

export default function TimedPlay() {
  const [, setLocation] = useLocation();
  const { activeProfile, gameResults, addGameResult } = useAppContext();
  const { ttsEnabled } = useSoundContext();
  const ageRange = (activeProfile?.ageRange ?? "5-6") as "3-4"|"5-6"|"7-8";

  const [phase, setPhase] = useState<Phase>("setup");
  const [durationMin, setDurationMin] = useState(5);
  const [timeLeft, setTimeLeft] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [displayCorrect, setDisplayCorrect] = useState(0);
  const [displayTotal, setDisplayTotal] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newBadges, setNewBadges] = useState<typeof MILESTONE_BADGES>([]);
  const [summaryData, setSummaryData] = useState<{ score: number; total: number; pts: number; catEntries: { cat: Category; pct: number; correct: number; total: number }[] } | null>(null);

  const correctCountRef = useRef(0);
  const totalAnsweredRef = useRef(0);
  const recordsRef = useRef<QuestionRecord[]>([]);
  const endTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);

  const questions: BankQuestion[] = useMemo(
    () => buildMixedQuestions(ageRange, 300),
    [ageRange]
  );

  useEffect(() => {
    if (phase !== "playing") return;
    finishedRef.current = false;
    endTimeRef.current = Date.now() + durationMin * 60000;
    setTimeLeft(durationMin * 60);
    timerRef.current = setInterval(() => {
      const rem = Math.round((endTimeRef.current - Date.now()) / 1000);
      if (rem <= 0) {
        clearInterval(timerRef.current!);
        setTimeLeft(0);
        finishPlay();
      } else {
        setTimeLeft(rem);
      }
    }, 500);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  function startPlay() {
    sounds.pop();
    recordsRef.current = [];
    correctCountRef.current = 0;
    totalAnsweredRef.current = 0;
    finishedRef.current = false;
    setQIdx(0);
    setDisplayCorrect(0);
    setDisplayTotal(0);
    setFeedback(null);
    setNewBadges([]);
    setSummaryData(null);
    setPhase("playing");
  }

  function handleAnswer(opt: { label: string; isCorrect: boolean }) {
    if (feedback !== null) return;
    const q = questions[qIdx % questions.length];
    const isCorrect = opt.isCorrect;
    const correctOpt = q.options.find(o => o.isCorrect);

    recordsRef.current.push({
      questionId: `timed_${qIdx}`,
      questionText: q.questionText,
      childAnswerText: opt.label,
      correctAnswerText: correctOpt?.label ?? "?",
      isCorrect,
    });

    totalAnsweredRef.current++;
    if (isCorrect) correctCountRef.current++;
    setDisplayTotal(totalAnsweredRef.current);
    setDisplayCorrect(correctCountRef.current);

    if (isCorrect) { sounds.correct(); if (ttsEnabled) speak(opt.label + "! Correct!"); }
    else { sounds.wrong(); if (ttsEnabled) speak("The answer is " + (correctOpt?.label ?? "")); }

    setFeedback(isCorrect ? "correct" : "wrong");
    setFeedbackMsg(isCorrect ? CORRECT_MSGS[Math.floor(Math.random() * CORRECT_MSGS.length)] : WRONG_MSGS[Math.floor(Math.random() * WRONG_MSGS.length)]);

    setTimeout(() => {
      setFeedback(null);
      setQIdx(i => i + 1);
    }, 900);
  }

  function finishPlay() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearInterval(timerRef.current!);

    const score = correctCountRef.current;
    const total = totalAnsweredRef.current;
    const pct = total > 0 ? score / total : 0;
    const stars = pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : 1;
    const pts = computeGamePoints({ score, total, stars, gameId: "timed-play" });

    // Category breakdown
    const catCounts: Record<string, { correct: number; total: number }> = {};
    recordsRef.current.forEach((rec, i) => {
      const cat = questions[i % questions.length]?.category ?? "maths";
      if (!catCounts[cat]) catCounts[cat] = { correct: 0, total: 0 };
      catCounts[cat].total++;
      if (rec.isCorrect) catCounts[cat].correct++;
    });
    const catEntries = Object.entries(catCounts).map(([c, v]) => ({
      cat: c as Category, pct: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0, ...v,
    }));

    setSummaryData({ score, total, pts, catEntries });

    const prevBadges = getEarnedMilestoneBadges(gameResults.filter(r => r.childId === activeProfile?.id));

    if (activeProfile && total > 0) {
      addGameResult({
        childId: activeProfile.id,
        gameId: "timed-play",
        gameName: `${durationMin} Min Play`,
        category: "maths",
        score, total, stars,
        timeTakenSeconds: durationMin * 60,
        questionHistory: recordsRef.current,
      });
    }

    const myPrev = gameResults.filter(r => r.childId === activeProfile?.id);
    const approxTotal = myPrev.reduce((s, r) => s + r.total, 0) + total;
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

    if (stars === 3 || brandNew.length > 0) { sounds.celebrate(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000); }
    else sounds.correct();

    setPhase("done");
  }

  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full bg-card rounded-[3rem] p-6 sm:p-12 text-center shadow-2xl border-4 border-card-border">
          <div className="text-7xl sm:text-9xl mb-4 sm:mb-5">⏱️</div>
          <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-3">Timed Play</h1>
          <p className="text-lg sm:text-2xl font-bold text-muted-foreground mb-8 sm:mb-10">
            How long do you want to play? Answer as many questions as you can!
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10">
            {DURATIONS.map(d => (
              <motion.button key={d} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setDurationMin(d)}
                className={`h-20 sm:h-24 rounded-[2rem] text-2xl sm:text-3xl font-black border-4 transition-all shadow-md ${durationMin === d ? "bg-primary text-white border-primary shadow-xl scale-105" : "bg-muted text-foreground border-border hover:bg-muted/80"}`}>
                {d} min
              </motion.button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { sounds.click(); setLocation("/home"); }}
              className="h-16 sm:h-20 px-8 sm:px-10 rounded-full text-xl sm:text-2xl font-black border-4 border-border bg-muted hover:bg-muted/80 text-foreground">
              ← Back
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startPlay}
              className="h-16 sm:h-20 px-12 sm:px-16 rounded-full text-2xl sm:text-3xl font-black bg-primary hover:bg-primary/90 text-white shadow-xl"
              data-testid="button-start-timed">
              Play! 🚀
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === "done" && summaryData) {
    const { score, total, pts, catEntries } = summaryData;
    const incorrect = total - score;
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
    const stars = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;
    const sorted = [...catEntries].sort((a, b) => b.pct - a.pct);
    const best = sorted[0];
    const needsPractice = sorted[sorted.length - 1];

    return (
      <div className="min-h-screen bg-background p-4 sm:p-5 md:p-10 overflow-y-auto">
        <Confetti active={showConfetti} />
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-[3rem] p-6 sm:p-10 shadow-2xl border-4 border-card-border mb-6 text-center">
            <div className="flex justify-center gap-2 sm:gap-3 mb-4">
              {[1,2,3].map(s => (
                <motion.div key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: s * 0.2, type: "spring" }}
                  className={`text-5xl sm:text-6xl ${s <= stars ? "" : "opacity-20 grayscale"}`}>⭐</motion.div>
              ))}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-2">Time's Up! 🎉</h1>
            <p className="text-xl sm:text-2xl font-bold text-muted-foreground mb-5">You played for {durationMin} minutes!</p>
            <div className="bg-amber-50 border-4 border-amber-200 rounded-2xl px-6 sm:px-8 py-3 sm:py-4 inline-block">
              <p className="text-3xl sm:text-4xl font-black text-amber-800">+{pts} points earned! 💰</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { label:"Answered", val:total,       emoji:"📝", bg:"bg-blue-50 border-blue-200 text-blue-800"   },
              { label:"Correct",  val:score,        emoji:"✅", bg:"bg-green-50 border-green-200 text-green-800"},
              { label:"Incorrect",val:incorrect,    emoji:"❌", bg:"bg-red-50 border-red-200 text-red-800"      },
              { label:"Accuracy", val:accuracy+"%", emoji:"🎯", bg:"bg-purple-50 border-purple-200 text-purple-800"},
            ].map(s => (
              <div key={s.label} className={`rounded-[1.5rem] border-4 p-3 sm:p-4 text-center ${s.bg}`}>
                <div className="text-2xl sm:text-3xl mb-1">{s.emoji}</div>
                <div className="text-2xl sm:text-3xl font-black">{s.val}</div>
                <div className="text-xs sm:text-sm font-bold opacity-80">{s.label}</div>
              </div>
            ))}
          </div>

          {catEntries.length > 0 && (
            <div className="bg-card rounded-[2rem] border-4 border-card-border p-4 sm:p-6 mb-6 shadow-md">
              <h2 className="text-xl sm:text-2xl font-black text-foreground mb-4">Categories Played</h2>
              <div className="space-y-3">
                {sorted.map(ce => (
                  <div key={ce.cat} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl w-6 sm:w-8 flex-shrink-0">{CAT_EMOJI[ce.cat]}</span>
                    <span className="font-black text-foreground capitalize w-16 sm:w-24 text-sm sm:text-base flex-shrink-0 truncate">{ce.cat}</span>
                    <div className="flex-1 min-w-0 h-4 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${ce.pct}%` }} />
                    </div>
                    <span className="font-black text-muted-foreground w-10 sm:w-12 text-right text-xs sm:text-sm flex-shrink-0">{ce.correct}/{ce.total}</span>
                  </div>
                ))}
              </div>
              {best && <p className="text-lg font-bold text-green-700 mt-4">🌟 Best: <strong className="capitalize">{best.cat}</strong> ({best.pct}%)</p>}
              {needsPractice && needsPractice.cat !== best?.cat && needsPractice.pct < 70 && (
                <p className="text-lg font-bold text-orange-700 mt-1">📚 Needs Practice: <strong className="capitalize">{needsPractice.cat}</strong> ({needsPractice.pct}%)</p>
              )}
            </div>
          )}

          {newBadges.length > 0 && (
            <div className="bg-yellow-50 border-4 border-yellow-300 rounded-[2rem] p-6 mb-6">
              <h2 className="text-2xl font-black text-yellow-800 mb-4">🏆 New Badges Earned!</h2>
              <div className="flex flex-wrap gap-3">
                {newBadges.map(b => (
                  <div key={b.id} className="bg-white border-2 border-yellow-300 rounded-2xl px-4 py-3 text-center shadow-sm">
                    <div className="text-4xl mb-1">{b.emoji}</div>
                    <div className="text-sm font-black text-yellow-800">{b.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-5">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { sounds.click(); setLocation("/home"); }}
              className="flex-1 h-16 rounded-2xl text-xl font-black border-4 border-border bg-muted hover:bg-muted/80 text-foreground">
              ← Home
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setPhase("setup")}
              className="flex-1 h-16 rounded-2xl text-xl font-black bg-primary text-white shadow-lg"
              data-testid="button-play-again">
              Play Again ⏱️
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // Playing phase
  const q = questions[qIdx % questions.length];
  const timePct = (timeLeft / (durationMin * 60)) * 100;
  const timerUrgent = timeLeft <= 30;

  return (
    <div className="min-h-screen bg-background flex flex-col p-4">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 max-w-3xl mx-auto w-full">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { sounds.click(); finishPlay(); }}
          className="h-12 sm:h-14 px-3 sm:px-5 rounded-2xl border-4 border-border bg-muted hover:bg-muted/80 font-black text-base sm:text-lg flex-shrink-0">
          ✋ Stop
        </motion.button>
        <div className="flex-1 min-w-0 bg-card rounded-2xl border-4 border-card-border px-3 sm:px-4 py-2 shadow-sm">
          <div className="flex justify-between items-center mb-1 gap-2">
            <span className={`text-xl sm:text-2xl font-black ${timerUrgent ? "text-red-600 animate-pulse" : "text-foreground"}`}>⏱️ {formatTime(timeLeft)}</span>
            <span className="text-lg sm:text-xl font-black text-primary whitespace-nowrap">✓ {displayCorrect}/{displayTotal}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${timerUrgent ? "bg-red-500" : "bg-primary"}`} style={{ width: `${timePct}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center max-w-3xl mx-auto w-full gap-4">
        <div className="bg-card w-full rounded-[3rem] p-5 sm:p-8 md:p-10 shadow-xl border-4 border-card-border flex flex-col items-center justify-center min-h-[200px] sm:min-h-[260px] text-center relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={qIdx} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }}
              className="text-4xl sm:text-5xl md:text-7xl font-black text-foreground w-full break-words">
              {q.prompt}
            </motion.div>
          </AnimatePresence>
          <SpeakerButton text={q.questionText} label="Hear question" size="lg" className="mt-4" />
          <AnimatePresence>
            {feedback && (
              <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
                className={`absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl font-black text-white rounded-[3rem] px-4 text-center ${feedback === "correct" ? "bg-green-500" : "bg-red-500"}`}>
                {feedbackMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
          {q.options.map((opt, i) => (
            <div key={i} className="relative">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                onClick={() => handleAnswer(opt)}
                disabled={feedback !== null}
                className={`w-full h-28 sm:h-32 md:h-40 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl text-2xl sm:text-3xl md:text-4xl font-black text-white transition-all px-2 break-words ${OPTION_COLOURS[i % OPTION_COLOURS.length]}`}>
                {opt.label}
              </motion.button>
              {ttsEnabled && (
                <button type="button" aria-label={`Hear: ${opt.label}`}
                  onClick={(e) => { e.stopPropagation(); speak(opt.label); }}
                  className="absolute top-2 right-2 w-12 h-12 rounded-full bg-white/30 hover:bg-white/50 border border-white/40 flex items-center justify-center text-white text-2xl active:scale-90 select-none">
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
