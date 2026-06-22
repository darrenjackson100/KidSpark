import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const WORDS = [
  { word: "CAT", emoji: "🐱", answer: "A", opts: ["A","O","U","E"] },
  { word: "DOG", emoji: "🐶", answer: "O", opts: ["O","A","I","E"] },
  { word: "PIG", emoji: "🐷", answer: "I", opts: ["I","A","O","E"] },
  { word: "HAT", emoji: "🎩", answer: "A", opts: ["A","E","I","O"] },
  { word: "BUS", emoji: "🚌", answer: "U", opts: ["U","A","I","O"] },
  { word: "HEN", emoji: "🐔", answer: "E", opts: ["E","A","I","U"] },
  { word: "CUP", emoji: "☕", answer: "U", opts: ["U","A","I","E"] },
  { word: "LOG", emoji: "🪵", answer: "O", opts: ["O","A","I","U"] },
  { word: "SUN", emoji: "☀️", answer: "U", opts: ["U","A","O","E"] },
  { word: "BED", emoji: "🛏️", answer: "E", opts: ["E","A","I","O"] },
  { word: "HOP", emoji: "🐸", answer: "O", opts: ["O","A","I","U"] },
  { word: "PIN", emoji: "📌", answer: "I", opts: ["I","A","O","E"] },
  { word: "WET", emoji: "💧", answer: "E", opts: ["E","A","I","O"] },
  { word: "RUN", emoji: "🏃", answer: "U", opts: ["U","A","I","E"] },
  { word: "BAT", emoji: "🏏", answer: "A", opts: ["A","E","I","O"] },
  { word: "HIT", emoji: "💥", answer: "I", opts: ["I","A","O","E"] },
];

const COLORS = ["bg-blue-500","bg-orange-500","bg-green-500","bg-purple-500"];

export default function LetterFill() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(WORDS).slice(0, 10).map((item, i) => ({
      id: `q${i}`,
      questionText: `What is the missing letter? ${item.word[0]} blank ${item.word[2]}. The word is ${item.word.toLowerCase()}.`,
      prompt: (
        <div className="text-center">
          <div className="text-[8rem] leading-none mb-4">{item.emoji}</div>
          <div className="flex items-center justify-center gap-3 text-7xl font-black text-foreground tracking-widest">
            <span>{item.word[0]}</span>
            <span className="text-primary border-b-4 border-primary px-2">_</span>
            <span>{item.word[2]}</span>
          </div>
          <p className="text-2xl font-black text-muted-foreground mt-4">What is the missing letter?</p>
        </div>
      ),
      options: shuffle(item.opts.map((o, j) => ({
        id: j === 0 ? "c" : `w${j}`,
        label: o,
        isCorrect: o === item.answer,
        color: COLORS[j % COLORS.length],
      }))),
    }));
  }, []);

  return (
    <GameEngine gameId="letter-fill" gameName="Letter Fill" category="reading"
      description="Fill in the missing letter to complete the word!"
      questions={questions} onExit={() => setLocation("/reading")} />
  );
}
