import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { QuestionRecord } from "@/context/AppContext";
import { useSoundContext } from "@/context/SoundContext";
import { speak, speakAnswer } from "@/lib/speech";
import { sounds } from "@/lib/sounds";
import { computeGamePoints, getEarnedMilestoneBadges, MILESTONE_BADGES } from "@/lib/points";
import Confetti from "@/components/Confetti";
import SpeakerButton from "@/components/SpeakerButton";

export interface QuestionOption {
  id: string;
  label: string | React.ReactNode;
  labelText?: string;
  isCorrect: boolean;
  color?: string;
}

export interface Question {
  id: string;
  prompt: string | React.ReactNode;
  questionText?: string;
  explanation?: string;
  options: QuestionOption[];
}

interface GameEngineProps {
  gameId: string;
  gameName: string;
  category: "maths" | "animals" | "reading" | "science" | "colours" | "health";
  description: string;
  questions: Question[];
  onExit: () => void;
}

const CORRECT_MESSAGES = ["Amazing Work! 🎉", "Fantastic! ⭐", "You're a Superstar! 🌟", "Brilliant! 🏆", "Wonderful! ✨", "Perfect! 🎯"];
const WRONG_MESSAGES = ["Almost there! 💪", "Keep trying! 🌈", "You've got this! 💡", "Good effort! 🤗"];
const SCORE_MESSAGES: Record<number, string> = { 3: "You're AMAZING! 🏆", 2: "Fantastic Work! 🌟", 1: "Great Effort! 💪" };
const OPTION_COLOURS = ["bg-blue-500 hover:bg-blue-600", "bg-orange-500 hover:bg-orange-600", "bg-green-500 hover:bg-green-600", "bg-purple-500 hover:bg-purple-600"];

export function getOptionText(opt: QuestionOption): string {
  if (opt.labelText) return opt.labelText;
  if (typeof opt.label === "string") return opt.label;
  return "?";
}

// What the voice should SAY for an option. Always the plain displayed text, read
// with standard English pronunciation (a letter is spoken as its name, "B" → "bee").
function speakOption(opt: QuestionOption): void {
  speak(getOptionText(opt));
}

// The text actually shown on the card (used to pick a font size). When the label
// is a string we measure it directly; otherwise we fall back to labelText.
function getOptionVisibleText(opt: QuestionOption): string {
  if (typeof opt.label === "string") return opt.label;
  if (opt.labelText) return opt.labelText;
  return "";
}

// Auto-shrink the answer text by length so long answers (e.g. "Omnivore — eats
// plants AND meat") wrap neatly inside the card instead of overflowing, while
// short answers (numbers, "Hot") stay big and bold.
function optionFontClass(text: string): string {
  const len = text.trim().length;
  if (len <= 3) return "text-5xl sm:text-7xl md:text-8xl";
  if (len <= 6) return "text-4xl sm:text-6xl md:text-7xl";
  if (len <= 11) return "text-2xl sm:text-4xl md:text-5xl";
  if (len <= 18) return "text-xl sm:text-3xl md:text-4xl";
  if (len <= 28) return "text-lg sm:text-2xl md:text-3xl";
  return "text-sm sm:text-xl md:text-2xl";
}

export default function GameEngine({ gameId, gameName, category, description, questions, onExit }: GameEngineProps) {
  const { activeProfile, gameResults, addGameResult } = useAppContext();
  const { ttsEnabled } = useSoundContext();
  const [gameState, setGameState] = useState<"intro" | "playing" | "score">("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [finalScore, setFinalScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [newMilestoneBadges, setNewMilestoneBadges] = useState<typeof MILESTONE_BADGES>([]);

  const questionRecordsRef = useRef<QuestionRecord[]>([]);
  const startTimeRef = useRef<number>(0);

  const startGame = () => {
    sounds.pop();
    questionRecordsRef.current = [];
    startTimeRef.current = Date.now();
    setGameState("playing");
    setCurrentQuestionIndex(0);
    setScore(0);
    setFeedback(null);
    setNewMilestoneBadges([]);
  };

  const handleAnswer = (option: QuestionOption) => {
    if (feedback !== null) return;
    const isCorrect = option.isCorrect;
    const currentQuestion = questions[currentQuestionIndex];

    const correctOpt = currentQuestion.options.find(o => o.isCorrect);
    const record: QuestionRecord = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.questionText ?? `Question ${currentQuestionIndex + 1}`,
      childAnswerText: getOptionText(option),
      correctAnswerText: correctOpt ? getOptionText(correctOpt) : "?",
      isCorrect,
      explanation: currentQuestion.explanation,
    };
    questionRecordsRef.current = [...questionRecordsRef.current, record];

    if (isCorrect) {
      sounds.correct();
      if (ttsEnabled && correctOpt) {
        speakAnswer(getOptionText(correctOpt) + "! Correct!");
      }
      setScore(s => s + 1);
      setFeedback("correct");
      setFeedbackMsg(CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]);
    } else {
      sounds.wrong();
      if (ttsEnabled && correctOpt) {
        speakAnswer("The correct answer is " + getOptionText(correctOpt));
      }
      setFeedback("wrong");
      setFeedbackMsg(WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)]);
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
      } else {
        const fs = score + (isCorrect ? 1 : 0);
        setFinalScore(fs);
        finishGame(fs);
      }
    }, 1400);
  };

  const finishGame = (fs: number) => {
    const pct = fs / questions.length;
    const stars = pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : 1;
    const timeTakenSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    const pts = computeGamePoints({ score: fs, total: questions.length, stars, gameId });
    setPointsEarned(pts);

    if (activeProfile) {
      const myPrev = gameResults.filter(r => r.childId === activeProfile.id);
      const prevBadges = getEarnedMilestoneBadges(myPrev);

      addGameResult({
        childId: activeProfile.id,
        gameId, gameName, category,
        score: fs, total: questions.length, stars,
        timeTakenSeconds,
        questionHistory: questionRecordsRef.current,
      });

      const approxTotal = myPrev.reduce((s, r) => s + r.total, 0) + questions.length;
      const approxGames = myPrev.length + 1;
      const approxPts = myPrev.reduce((s, r) => s + computeGamePoints({ score: r.score, total: r.total, stars: r.stars, gameId: r.gameId }), 0) + pts;
      const brandNew = MILESTONE_BADGES.filter(b => {
        if (prevBadges.some(pb => pb.id === b.id)) return false;
        if (b.requiredQuestions !== undefined && approxTotal < b.requiredQuestions) return false;
        if (b.requiredGames !== undefined && approxGames < b.requiredGames) return false;
        if (b.requiredPoints !== undefined && approxPts < b.requiredPoints) return false;
        return true;
      });
      setNewMilestoneBadges(brandNew);
    }

    setGameState("score");
    if (stars === 3) { sounds.celebrate(); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3500); }
    else sounds.correct();
  };

  if (gameState === "intro") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full bg-card rounded-[3rem] p-6 sm:p-12 text-center shadow-2xl border-4 border-card-border">
          <div className="text-7xl sm:text-9xl mb-5 sm:mb-8">🎮</div>
          <h1 className="text-4xl sm:text-6xl font-black text-foreground mb-3 sm:mb-4 leading-tight">{gameName}</h1>
          <p className="text-xl sm:text-3xl font-bold text-muted-foreground mb-8 sm:mb-12">{description}</p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { sounds.click(); onExit(); }}
              className="h-16 sm:h-20 px-8 sm:px-10 rounded-full text-xl sm:text-2xl font-black border-4 border-border bg-muted hover:bg-muted/80 text-foreground transition-colors">
              ← Back
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="h-16 sm:h-20 px-12 sm:px-16 rounded-full text-2xl sm:text-3xl font-black bg-primary hover:bg-primary/90 text-white shadow-xl transition-colors"
              data-testid="button-start-game">
              Start! 🚀
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState === "score") {
    const pct = finalScore / questions.length;
    const stars = pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : 1;
    const timeSecs = Math.round((Date.now() - startTimeRef.current) / 1000);
    const mins = Math.floor(timeSecs / 60);
    const secs = timeSecs % 60;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6">
        <Confetti active={showConfetti} />
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.5 }}
          className="max-w-2xl w-full bg-card rounded-[3rem] p-6 sm:p-10 text-center shadow-2xl border-4 border-card-border">
          <div className="flex justify-center gap-2 sm:gap-4 mb-5 sm:mb-6">
            {[1, 2, 3].map(s => (
              <motion.div key={s} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: s * 0.25, type: "spring", stiffness: 200 }}
                className={`text-6xl sm:text-8xl ${s <= stars ? "" : "opacity-20 grayscale"}`}>⭐</motion.div>
            ))}
          </div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
            className="text-4xl sm:text-5xl font-black text-foreground mb-3 leading-tight">{SCORE_MESSAGES[stars]}</motion.h1>
          <p className="text-3xl sm:text-4xl font-bold text-muted-foreground mb-2">{finalScore} out of {questions.length}</p>
          {timeSecs > 0 && (
            <p className="text-lg font-bold text-muted-foreground mb-3">
              ⏱️ {mins > 0 ? `${mins}m ` : ""}{secs}s
            </p>
          )}
          <div className="bg-amber-50 border-4 border-amber-200 rounded-2xl px-5 sm:px-6 py-3 inline-block mb-4">
            <p className="text-2xl sm:text-3xl font-black text-amber-800">+{pointsEarned} points earned! 💰</p>
          </div>
          {newMilestoneBadges.length > 0 && (
            <div className="bg-yellow-50 border-4 border-yellow-300 rounded-2xl p-4 mb-4">
              <p className="text-xl font-black text-yellow-800 mb-3">🏆 New Badge{newMilestoneBadges.length > 1 ? "s" : ""} Earned!</p>
              <div className="flex gap-4 justify-center flex-wrap">
                {newMilestoneBadges.map(b => (
                  <div key={b.id} className="text-center">
                    <div className="text-5xl mb-1">{b.emoji}</div>
                    <div className="text-sm font-black text-yellow-800">{b.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center mt-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { sounds.click(); onExit(); }}
              className="h-14 sm:h-16 px-8 sm:px-10 rounded-full text-lg sm:text-xl font-black border-4 border-border bg-muted hover:bg-muted/80 text-foreground transition-colors"
              data-testid="button-back-to-games">
              ← Back to Games
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="h-14 sm:h-16 px-10 sm:px-12 rounded-full text-lg sm:text-xl font-black bg-secondary hover:bg-secondary/90 text-white shadow-lg transition-colors"
              data-testid="button-play-again">
              Play Again 🔄
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  return (
    <div className="min-h-screen bg-background flex flex-col p-4 sm:p-5">
      <div className="flex justify-between items-center gap-3 mb-4 sm:mb-6 max-w-5xl mx-auto w-full">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { sounds.click(); onExit(); }}
          className="h-12 sm:h-16 px-4 sm:px-7 rounded-2xl border-4 border-border bg-muted hover:bg-muted/80 text-foreground font-black text-base sm:text-xl transition-colors flex-shrink-0"
          data-testid="button-exit-game">
          ← Exit
        </motion.button>
        <div className="bg-card px-4 sm:px-8 py-2 sm:py-4 rounded-3xl border-4 border-card-border shadow-md">
          <div className="hidden sm:flex gap-2 items-center justify-center flex-wrap max-w-md">
            {Array.from({ length: questions.length }, (_, i) => (
              <div key={i} className={`h-3 w-3 rounded-full transition-colors ${i < currentQuestionIndex ? "bg-accent" : i === currentQuestionIndex ? "bg-primary scale-125" : "bg-muted"}`} />
            ))}
          </div>
          <p className="text-base font-black text-muted-foreground text-center sm:mt-1 whitespace-nowrap">{currentQuestionIndex + 1} / {questions.length}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center max-w-5xl mx-auto w-full">
        <div className="bg-card w-full rounded-[3rem] p-5 sm:p-10 mb-4 sm:mb-6 shadow-xl border-4 border-card-border flex flex-col items-center justify-center min-h-[200px] sm:min-h-[280px] text-center relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={currentQuestion.id} initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -80, opacity: 0 }}
              className="text-5xl sm:text-6xl md:text-8xl font-black text-foreground break-words max-w-full">
              {currentQuestion.prompt}
            </motion.div>
          </AnimatePresence>
          {currentQuestion.questionText && (
            <SpeakerButton text={currentQuestion.questionText} label="Hear question" size="lg" className="mt-4" />
          )}
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
          {currentQuestion.options.map((option, idx) => (
            <div key={option.id} className="relative">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => handleAnswer(option)}
                disabled={feedback !== null}
                className={`w-full min-h-[8rem] sm:min-h-[11rem] md:min-h-[13rem] rounded-[2rem] sm:rounded-[2.5rem] shadow-xl ${optionFontClass(getOptionVisibleText(option))} font-black text-white transition-all px-4 py-4 break-words hyphens-auto flex items-center justify-center text-center leading-tight overflow-hidden ${OPTION_COLOURS[idx % OPTION_COLOURS.length]}`}
                data-testid={`button-option-${idx}`}>
                {option.label}
              </motion.button>
              {ttsEnabled && (
                <button type="button" aria-label={`Hear: ${getOptionText(option)}`}
                  onClick={(e) => { e.stopPropagation(); speakOption(option); }}
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
