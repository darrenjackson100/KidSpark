import React, { useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext, QuestionRecord } from "@/context/AppContext";
import { useSoundContext } from "@/context/SoundContext";
import { speak, speakAnswer } from "@/lib/speech";
import { sounds } from "@/lib/sounds";
import { CVC_WORDS, CvcWord, PHONEMES } from "@/lib/phonics";
import SpeakerButton from "@/components/SpeakerButton";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

interface Tile { key: string; letter: string; used: boolean; }

// Two extra random single letters to make the choice less trivial.
function buildTiles(word: CvcWord): Tile[] {
  const extras = shuffle(
    PHONEMES.filter(p => p.displayLetter.length === 1 && !word.letters.includes(p.displayLetter)),
  ).slice(0, 2).map(p => p.displayLetter);
  return shuffle([...word.letters, ...extras]).map((letter, i) => ({ key: `${letter}-${i}`, letter, used: false }));
}

export default function BuildTheWord() {
  const [, setLocation] = useLocation();
  const { activeProfile, addGameResult } = useAppContext();
  const { ttsEnabled } = useSoundContext();

  const words = useMemo(() => shuffle(CVC_WORDS).slice(0, 6), []);
  const recordsRef = useRef<QuestionRecord[]>([]);
  const startRef = useRef<number>(Date.now());

  const [index, setIndex] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>(() => buildTiles(words[0]));
  const [filled, setFilled] = useState<string[]>([]);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const word = words[index];

  const evaluate = (assembled: string[]) => {
    const guess = assembled.join("");
    const isCorrect = guess === word.word;
    if (isCorrect) { sounds.correct(); setScore(s => s + 1); }
    else sounds.wrong();
    setResult(isCorrect ? "correct" : "wrong");

    if (ttsEnabled) {
      if (isCorrect) speakAnswer(`${word.word}! Well done!`);
      else speakAnswer(`This spells ${guess}. The word is ${word.word}.`);
    }

    recordsRef.current = [...recordsRef.current, {
      questionId: word.word,
      questionText: `Build the word: ${word.word}`,
      childAnswerText: guess,
      correctAnswerText: word.word,
      isCorrect,
      explanation: `The word is ${word.word} (${word.letters.join("-")}).`,
    }];
  };

  // Any tile can be tapped — wrong choices are allowed. We speak the letter
  // normally (standard English letter name), drop it into the next slot, and
  // evaluate once full.
  const tapTile = (tile: Tile) => {
    if (tile.used || result) return;
    if (ttsEnabled) speak(tile.letter.toUpperCase());
    sounds.pop();
    const nf = [...filled, tile.letter];
    setFilled(nf);
    setTiles(ts => ts.map(t => (t.key === tile.key ? { ...t, used: true } : t)));
    if (nf.length === word.letters.length) evaluate(nf);
  };

  // Let a child take the last tile back if they change their mind (before full).
  const undo = () => {
    if (result || filled.length === 0) return;
    sounds.click();
    const last = filled[filled.length - 1];
    setFilled(f => f.slice(0, -1));
    setTiles(ts => {
      const idx = [...ts].reverse().findIndex(t => t.used && t.letter === last);
      if (idx === -1) return ts;
      const realIdx = ts.length - 1 - idx;
      return ts.map((t, i) => (i === realIdx ? { ...t, used: false } : t));
    });
  };

  const next = () => {
    sounds.pop();
    if (index < words.length - 1) {
      const ni = index + 1;
      setIndex(ni);
      setTiles(buildTiles(words[ni]));
      setFilled([]);
      setResult(null);
    } else {
      finish();
    }
  };

  const finish = () => {
    if (activeProfile) {
      addGameResult({
        childId: activeProfile.id,
        gameId: "phonics-build-word",
        gameName: "Build the Word",
        category: "reading",
        score,
        total: words.length,
        stars: score >= words.length * 0.8 ? 3 : score >= words.length * 0.5 ? 2 : 1,
        timeTakenSeconds: Math.round((Date.now() - startRef.current) / 1000),
        questionHistory: recordsRef.current,
      });
    }
    sounds.celebrate();
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl w-full bg-card rounded-[3rem] p-8 sm:p-12 shadow-2xl border-4 border-card-border">
          <div className="text-8xl mb-4">🏆</div>
          <h1 className="text-4xl font-black text-foreground mb-3">Great Reading!</h1>
          <p className="text-2xl font-bold text-muted-foreground mb-8">You built {score} of {words.length} words!</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.click(); setLocation("/reading"); }}
            className="h-16 px-8 rounded-full text-xl font-black border-4 border-border bg-muted hover:bg-muted/80 text-foreground transition-colors">
            ← Back to Games
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 sm:p-6">
      <div className="flex justify-between items-center gap-2 mb-6 max-w-2xl w-full">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { sounds.click(); setLocation("/reading"); }}
          className="h-12 sm:h-16 px-4 sm:px-6 rounded-2xl border-4 border-border bg-muted hover:bg-muted/80 font-black text-base sm:text-xl text-muted-foreground transition-colors flex-shrink-0">
          ← Back
        </motion.button>
        <div className="bg-card px-3 sm:px-8 py-2 sm:py-4 rounded-3xl border-4 border-card-border shadow-md">
          <span className="text-base sm:text-2xl font-black text-muted-foreground whitespace-nowrap">{index + 1} / {words.length}</span>
        </div>
      </div>

      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl w-full bg-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 text-center shadow-2xl border-4 border-card-border">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-1">Build the Word</h1>
        <p className="text-lg font-bold text-muted-foreground mb-4">Listen, then tap the letters to build it!</p>

        <div className="text-7xl sm:text-8xl mb-3">{word.emoji}</div>
        <div className="mb-6 flex justify-center">
          <SpeakerButton text={`Spell the word ${word.word}`} label="Hear the word" size="lg" />
        </div>

        {/* Answer slots */}
        <div className="flex justify-center gap-3 mb-7">
          {word.letters.map((l, i) => {
            const placed = filled[i];
            const slotCorrect = result && placed === word.letters[i];
            return (
              <div key={i}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-4 flex items-center justify-center text-4xl sm:text-5xl font-black transition-colors ${
                  placed
                    ? result
                      ? slotCorrect
                        ? "border-green-500 bg-green-500/10 text-green-600"
                        : "border-red-400 bg-red-400/10 text-red-500"
                      : "border-primary bg-primary/10 text-primary"
                    : "border-dashed border-muted-foreground/50 text-transparent"
                }`}
                data-testid={`slot-${i}`}>
                {placed ?? "_"}
              </div>
            );
          })}
        </div>

        {result ? (
          <>
            <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }}
              className={`text-3xl font-black mb-2 ${result === "correct" ? "text-accent" : "text-red-500"}`}>
              {result === "correct" ? `${word.word}! 🎉` : "Good try! 💪"}
            </motion.p>
            <p className="text-lg font-bold text-muted-foreground mb-5">
              The word is <span className="text-foreground font-black">{word.word}</span> ({word.letters.join("-")})
            </p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={next}
              className="h-16 px-10 rounded-full text-2xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg transition-colors"
              data-testid="button-next-word">
              {index < words.length - 1 ? "Next Word →" : "All Done! 🎉"}
            </motion.button>
          </>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              <AnimatePresence>
                {tiles.map(tile => (
                  <motion.button key={tile.key}
                    whileHover={{ scale: tile.used ? 1 : 1.08 }} whileTap={{ scale: tile.used ? 1 : 0.92 }}
                    onClick={() => tapTile(tile)} disabled={tile.used}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl text-4xl sm:text-5xl font-black shadow-md transition-colors ${
                      tile.used ? "bg-muted text-muted-foreground/30 border-4 border-border" : "bg-secondary hover:bg-secondary/90 text-white"
                    }`}
                    data-testid={`tile-${tile.letter}`}>
                    {tile.letter}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
            {filled.length > 0 && (
              <button type="button" onClick={undo}
                className="h-12 px-6 rounded-full text-base font-black border-4 border-border bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                data-testid="button-undo">
                ↩ Undo
              </button>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
