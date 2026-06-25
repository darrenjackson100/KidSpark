import React, { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";
import Confetti from "@/components/Confetti";

interface Card {
  id: number;
  pairId: number;
  content: string;
  flipped: boolean;
  matched: boolean;
}

const EASY_PAIRS = [
  ["🐶", "🐶"], ["🐱", "🐱"], ["🐸", "🐸"], ["🦋", "🦋"], ["⭐", "⭐"],
  ["🍎", "🍎"], ["🎈", "🎈"], ["🌸", "🌸"],
];
const MEDIUM_PAIRS = [
  ["1", "1️⃣"], ["2", "2️⃣"], ["3", "3️⃣"], ["4", "4️⃣"], ["5", "5️⃣"],
  ["🐶", "🐕"], ["🐱", "🐈"], ["🐥", "🐔"],
];
const HARD_PAIRS = [
  ["6", "🎲🎲🎲🎲🎲🎲"], ["7", "7️⃣"], ["8", "8️⃣"], ["9", "9️⃣"], ["10", "🔟"],
  ["🦁", "Lion"], ["🐘", "Elephant"], ["🦒", "Giraffe"],
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildDeck(pairs: string[][]): Card[] {
  const cards: Card[] = [];
  pairs.forEach((pair, pairId) => {
    cards.push({ id: pairId * 2, pairId, content: pair[0], flipped: false, matched: false });
    cards.push({ id: pairId * 2 + 1, pairId, content: pair[1], flipped: false, matched: false });
  });
  return shuffle(cards);
}

export default function MemoryCards() {
  const [location, setLocation] = useLocation();
  const backPath = location.startsWith("/memory") ? "/memory-hub" : "/maths";
  const { activeProfile, addGameResult } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "5-6";

  const pairCount = ageRange === "3-4" ? 4 : ageRange === "5-6" ? 6 : 8;
  const pairSource = ageRange === "3-4" ? EASY_PAIRS : ageRange === "5-6" ? MEDIUM_PAIRS : HARD_PAIRS;
  const selectedPairs = shuffle(pairSource).slice(0, pairCount);

  const [stage, setStage] = useState<"intro" | "playing" | "done">("intro");
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [locked, setLocked] = useState(false);
  const matchHistoryRef = useRef<Array<{questionId:string;questionText:string;childAnswerText:string;correctAnswerText:string;isCorrect:boolean}>>([]);

  const startGame = () => {
    sounds.pop();
    matchHistoryRef.current = [];
    setCards(buildDeck(selectedPairs));
    setFlippedIds([]);
    setMoves(0);
    setMatches(0);
    setStage("playing");
    setLocked(false);
  };

  const handleFlip = useCallback((cardId: number) => {
    if (locked) return;
    setCards(prev => {
      const card = prev.find(c => c.id === cardId);
      if (!card || card.flipped || card.matched) return prev;
      return prev.map(c => c.id === cardId ? { ...c, flipped: true } : c);
    });

    setFlippedIds(prev => {
      const next = [...prev, cardId];
      if (next.length === 2) {
        setLocked(true);
        setMoves(m => m + 1);
        const [a, b] = next;
        setCards(prevCards => {
          const cardA = prevCards.find(c => c.id === a)!;
          const cardB = prevCards.find(c => c.id === b)!;
          if (cardA.pairId === cardB.pairId) {
            sounds.correct();
            matchHistoryRef.current = [...matchHistoryRef.current, {
              questionId: `pair${cardA.pairId}`,
              questionText: `Find the matching pair: ${cardA.content}`,
              childAnswerText: `Matched: ${cardB.content}`,
              correctAnswerText: `${cardA.content} ↔ ${cardB.content}`,
              isCorrect: true,
            }];
            const newCards = prevCards.map(c =>
              c.id === a || c.id === b ? { ...c, matched: true } : c
            );
            const newMatches = newCards.filter(c => c.matched).length / 2;
            setMatches(newMatches);
            setTimeout(() => {
              setFlippedIds([]);
              setLocked(false);
              if (newMatches === pairCount) {
                sounds.celebrate();
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3500);
                if (activeProfile) {
                  const stars = moves <= pairCount + 2 ? 3 : moves <= pairCount + 6 ? 2 : 1;
                  addGameResult({
                    childId: activeProfile.id,
                    gameId: "memory-cards",
                    gameName: "Memory Cards",
                    category: "maths",
                    score: pairCount,
                    total: pairCount,
                    stars,
                    questionHistory: matchHistoryRef.current,
                  });
                }
                setStage("done");
              }
            }, 600);
            return newCards;
          } else {
            sounds.wrong();
            setTimeout(() => {
              setCards(c => c.map(card =>
                card.id === a || card.id === b ? { ...card, flipped: false } : card
              ));
              setFlippedIds([]);
              setLocked(false);
            }, 900);
            return prevCards;
          }
        });
        return [];
      }
      return next;
    });
    sounds.click();
  }, [locked, activeProfile, pairCount, moves, addGameResult]);

  if (stage === "intro") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full bg-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 text-center shadow-2xl border-4 border-card-border">
          <div className="text-7xl sm:text-9xl mb-6 sm:mb-8">🃏</div>
          <h1 className="text-3xl sm:text-6xl font-black text-foreground mb-4">Memory Cards</h1>
          <p className="text-lg sm:text-3xl font-bold text-muted-foreground mb-8 sm:mb-12">
            Flip cards to find matching pairs! Remember where they are!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { sounds.click(); setLocation(backPath); }}
              className="h-16 sm:h-20 px-10 rounded-full text-2xl font-black border-4 border-border bg-muted hover:bg-muted/80 transition-colors">
              ← Back
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="h-16 sm:h-20 px-10 sm:px-16 rounded-full text-3xl font-black bg-primary hover:bg-primary/90 text-white shadow-xl transition-colors">
              Start! 🚀
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (stage === "done") {
    const stars = moves <= pairCount + 2 ? 3 : moves <= pairCount + 6 ? 2 : 1;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Confetti active={showConfetti} />
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="max-w-2xl w-full bg-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 text-center shadow-2xl border-4 border-card-border">
          <div className="flex justify-center gap-4 mb-8">
            {[1, 2, 3].map(s => (
              <motion.div key={s} initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: s * 0.25, type: "spring", stiffness: 200 }}
                className={`text-6xl sm:text-8xl ${s <= stars ? "" : "opacity-20 grayscale"}`}>⭐</motion.div>
            ))}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground mb-4">
            {stars === 3 ? "Amazing Memory! 🏆" : stars === 2 ? "Great Job! 🌟" : "Well Done! 💪"}
          </h1>
          <p className="text-lg sm:text-3xl font-bold text-muted-foreground mb-4">All {pairCount} pairs found!</p>
          <p className="text-xl sm:text-2xl font-bold text-muted-foreground mb-10">You took {moves} moves</p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { sounds.click(); setLocation(backPath); }}
              className="h-16 sm:h-20 px-10 rounded-full text-2xl font-black border-4 border-border bg-muted hover:bg-muted/80 transition-colors">
              ← Back to Games
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="h-16 sm:h-20 px-12 rounded-full text-2xl font-black bg-secondary hover:bg-secondary/90 text-white shadow-lg transition-colors">
              Play Again 🔄
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  const cols = pairCount <= 4 ? 2 : pairCount <= 6 ? 3 : 4;

  return (
    <div className="min-h-screen bg-background p-3 sm:p-5">
      <div className="flex justify-between items-center gap-2 mb-6 max-w-3xl mx-auto">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { sounds.click(); setLocation(backPath); }}
          className="h-12 sm:h-16 px-4 sm:px-7 rounded-2xl border-4 border-border bg-muted hover:bg-muted/80 font-black text-base sm:text-xl transition-colors flex-shrink-0">
          ← Exit
        </motion.button>
        <div className="bg-card px-3 sm:px-8 py-2 sm:py-3 rounded-3xl border-4 border-card-border shadow-md text-center flex-shrink min-w-0">
          <p className="text-base sm:text-2xl font-black text-foreground whitespace-nowrap">{matches} / {pairCount} pairs</p>
          <p className="text-sm sm:text-base font-bold text-muted-foreground whitespace-nowrap">{moves} moves</p>
        </div>
      </div>

      <div className={`grid gap-3 sm:gap-4 max-w-3xl mx-auto`}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map(card => (
          <motion.button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            disabled={card.flipped || card.matched || locked}
            whileHover={!card.flipped && !card.matched ? { scale: 1.05 } : {}}
            whileTap={!card.flipped && !card.matched ? { scale: 0.95 } : {}}
            className={`aspect-square rounded-[2rem] shadow-xl text-3xl sm:text-5xl font-black border-4 transition-all flex items-center justify-center ${
              card.matched
                ? "bg-green-400 border-green-500 text-white"
                : card.flipped
                ? "bg-card border-primary text-foreground"
                : "bg-gradient-to-br from-blue-500 to-blue-700 border-blue-600 text-white"
            }`}
            data-testid={`card-memory-${card.id}`}
          >
            <AnimatePresence mode="wait">
              {card.flipped || card.matched ? (
                <motion.span key="front" initial={{ scale: 0, rotateY: 90 }} animate={{ scale: 1, rotateY: 0 }}>
                  {card.content}
                </motion.span>
              ) : (
                <motion.span key="back" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-4xl">
                  ?
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
