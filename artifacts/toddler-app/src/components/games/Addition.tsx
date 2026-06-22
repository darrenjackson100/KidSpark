import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { buildUniqueQuestions } from "@/lib/dedup";
import { useAppContext } from "@/context/AppContext";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const EMOJIS = ["🍎", "🌟", "🎈", "🍭", "🐥"];

function makeOptions(correct: number, max: number) {
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const n = Math.floor(Math.random() * (max + 1));
    if (n !== correct) wrong.add(n);
  }
  const colors = ["bg-blue-500", "bg-orange-500", "bg-green-500", "bg-purple-500"];
  return shuffle([
    { id: "c", label: String(correct), isCorrect: true, color: colors[0] },
    ...[...wrong].map((n, i) => ({ id: `w${i}`, label: String(n), isCorrect: false, color: colors[i + 1] }))
  ]);
}

export default function Addition() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "5-6";
  const maxA = ageRange === "3-4" ? 3 : ageRange === "5-6" ? 5 : 9;
  const maxB = ageRange === "3-4" ? 3 : ageRange === "5-6" ? 5 : 9;

  const questions: Question[] = useMemo(() => {
    return buildUniqueQuestions(10, (i) => {
      const a = Math.floor(Math.random() * maxA) + 1;
      const b = Math.floor(Math.random() * maxB) + 1;
      const correct = a + b;
      const emoji = EMOJIS[i % EMOJIS.length];
      return {
        id: `q${i}`,
        questionText: `${a} + ${b} = ?`,
        prompt: (
          <div className="text-center flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <div className="flex gap-1 flex-wrap justify-center max-w-[200px] sm:max-w-[260px]">
                {Array.from({ length: a }, (_, j) => <span key={j} className="text-5xl sm:text-6xl leading-none">{emoji}</span>)}
              </div>
              <span className="text-6xl font-black text-foreground">+</span>
              <div className="flex gap-1 flex-wrap justify-center max-w-[200px] sm:max-w-[260px]">
                {Array.from({ length: b }, (_, j) => <span key={j} className="text-5xl sm:text-6xl leading-none">{emoji}</span>)}
              </div>
              <span className="text-6xl font-black text-foreground">=</span>
              <span className="text-6xl font-black text-primary">?</span>
            </div>
            <p className="text-3xl font-black text-muted-foreground">{a} + {b} = ?</p>
          </div>
        ),
        options: makeOptions(correct, maxA + maxB)
      };
    });
  }, [maxA, maxB]);

  return (
    <GameEngine
      gameId="addition"
      gameName="Adding Up"
      category="maths"
      description="Count the pictures and add them together!"
      questions={questions}
      onExit={() => setLocation("/maths")}
    />
  );
}
