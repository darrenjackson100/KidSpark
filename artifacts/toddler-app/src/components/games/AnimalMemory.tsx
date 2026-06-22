import React, { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext, QuestionRecord } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";
import Confetti from "@/components/Confetti";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const ANIMAL_PAIRS = [
  ["🐶","Dog"],["🐱","Cat"],["🐸","Frog"],["🦋","Butterfly"],["🐘","Elephant"],
  ["🦁","Lion"],["🐼","Panda"],["🦊","Fox"],["🐧","Penguin"],["🐮","Cow"],
  ["🦒","Giraffe"],["🐯","Tiger"],["🐻","Bear"],["🦄","Unicorn"],["🐨","Koala"],
  ["🦅","Eagle"],["🐳","Whale"],["🦜","Parrot"],["🐬","Dolphin"],["🦔","Hedgehog"],
];

interface Card { id: number; pairId: number; emoji: string; name: string; flipped: boolean; matched: boolean; }

function buildDeck(count: number): Card[] {
  const pairs = shuffle(ANIMAL_PAIRS).slice(0, count);
  const cards: Card[] = [];
  pairs.forEach(([emoji, name], pairId) => {
    cards.push({ id: pairId * 2,     pairId, emoji, name, flipped: false, matched: false });
    cards.push({ id: pairId * 2 + 1, pairId, emoji, name, flipped: false, matched: false });
  });
  return shuffle(cards);
}

export default function AnimalMemory() {
  const [, setLocation] = useLocation();
  const { activeProfile, addGameResult } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "5-6";
  const pairCount = ageRange === "3-4" ? 4 : ageRange === "5-6" ? 6 : 8;

  const [stage, setStage] = useState<"intro" | "playing" | "done">("intro");
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [locked, setLocked] = useState(false);
  const [matchLog, setMatchLog] = useState<{ name: string; moves: number; isFirst: boolean }[]>([]);
  const startTimeRef = React.useRef(Date.now());

  const startGame = () => {
    sounds.pop();
    setCards(buildDeck(pairCount));
    setFlippedIds([]);
    setMoves(0);
    setMatches(0);
    setMatchLog([]);
    setLocked(false);
    startTimeRef.current = Date.now();
    setStage("playing");
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
            const newCards = prevCards.map(c => c.id === a || c.id === b ? { ...c, matched: true } : c);
            const newMatchCount = newCards.filter(c => c.matched).length / 2;
            setMatches(newMatchCount);
            setMatchLog(log => [...log, { name: cardA.name, moves: moves + 1, isFirst: log.every(l => l.name !== cardA.name) }]);
            setTimeout(() => {
              setFlippedIds([]);
              setLocked(false);
              if (newMatchCount === pairCount) {
                sounds.celebrate();
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3500);

                const totalMoves = moves + 1;
                const stars = totalMoves <= pairCount + 2 ? 3 : totalMoves <= pairCount * 2 ? 2 : 1;
                const timeTakenSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

                const questionHistory: QuestionRecord[] = newCards
                  .filter((c, idx, arr) => c.matched && arr.findIndex(x => x.pairId === c.pairId) === idx)
                  .map((c, i) => ({
                    questionId: `q${i}`,
                    questionText: `Find the matching pair for: ${c.emoji} ${c.name}`,
                    childAnswerText: `${c.emoji} ${c.name} (matched!)`,
                    correctAnswerText: `${c.emoji} ${c.name}`,
                    isCorrect: true,
                    explanation: `A matching pair means finding two cards with the same ${c.name}!`,
                  }));

                if (activeProfile) {
                  addGameResult({
                    childId: activeProfile.id,
                    gameId: "animal-memory",
                    gameName: "Animal Memory",
                    category: "animals",
                    score: pairCount, total: pairCount, stars,
                    timeTakenSeconds,
                    questionHistory,
                  });
                }
                setStage("done");
              }
            }, 700);
            return newCards;
          } else {
            sounds.wrong();
            setTimeout(() => {
              setCards(c => c.map(card => card.id === a || card.id === b ? { ...card, flipped: false } : card));
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

  if (stage === "intro") return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl w-full bg-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 text-center shadow-2xl border-4 border-card-border">
        <div className="text-7xl sm:text-9xl mb-6 sm:mb-8">🐾</div>
        <h1 className="text-3xl sm:text-6xl font-black text-foreground mb-4">Animal Memory</h1>
        <p className="text-xl sm:text-2xl font-bold text-muted-foreground mb-4">
          Flip cards to find matching animal pairs! 🐶🐶
        </p>
        <p className="text-lg sm:text-xl font-bold text-muted-foreground mb-8 sm:mb-12">
          {pairCount} pairs to find · Remember where they are!
        </p>
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

  if (stage === "done") {
    const stars = moves <= pairCount + 2 ? 3 : moves <= pairCount * 2 ? 2 : 1;
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
            {stars === 3 ? "Amazing Memory! 🏆" : stars === 2 ? "Great Job! 🌟" : "Well Done! 💪"}
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-muted-foreground mb-2">All {pairCount} pairs found!</p>
          <p className="text-lg sm:text-xl font-bold text-muted-foreground mb-10">You took {moves} moves</p>
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

  const cols = pairCount <= 4 ? 4 : pairCount <= 6 ? 4 : 4;
  const totalCards = pairCount * 2;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="flex justify-between items-center gap-2 mb-5 max-w-3xl mx-auto">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { sounds.click(); setLocation("/memory-hub"); }}
          className="h-12 sm:h-14 px-4 sm:px-6 rounded-2xl border-4 border-border bg-muted hover:bg-muted/80 font-black text-base sm:text-lg transition-colors flex-shrink-0"
          data-testid="button-exit-game">
          ← Exit
        </motion.button>
        <div className="bg-card px-3 sm:px-6 py-2 sm:py-3 rounded-3xl border-4 border-card-border shadow-md text-center flex-shrink min-w-0">
          <p className="text-base sm:text-xl font-black text-foreground whitespace-nowrap">{matches} / {pairCount} pairs 🐾</p>
          <p className="text-sm font-bold text-muted-foreground whitespace-nowrap">{moves} moves</p>
        </div>
      </div>

      <div className="grid gap-2 sm:gap-3 max-w-3xl mx-auto"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cards.map(card => (
          <motion.button key={card.id}
            onClick={() => handleFlip(card.id)}
            disabled={card.flipped || card.matched || locked}
            whileHover={!card.flipped && !card.matched ? { scale: 1.06 } : {}}
            whileTap={!card.flipped && !card.matched ? { scale: 0.94 } : {}}
            className={`aspect-square rounded-[1.5rem] shadow-lg text-2xl sm:text-4xl md:text-5xl font-black border-4 flex items-center justify-center transition-all ${
              card.matched
                ? "bg-green-100 border-green-400"
                : card.flipped
                ? "bg-card border-primary"
                : "bg-gradient-to-br from-orange-400 to-orange-600 border-orange-500 text-white"
            }`}
            data-testid={`card-memory-${card.id}`}>
            <AnimatePresence mode="wait">
              {card.flipped || card.matched ? (
                <motion.span key="front" initial={{ scale: 0, rotateY: 90 }} animate={{ scale: 1, rotateY: 0 }}>
                  {card.emoji}
                </motion.span>
              ) : (
                <motion.span key="back" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-white text-4xl font-black">
                  🐾
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
