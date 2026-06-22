import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { buildUniqueQuestions } from "@/lib/dedup";
import { useAppContext } from "@/context/AppContext";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const EMOJIS = ["⭐", "🎈", "🍕", "🏆", "🐣"];

function makeOptions(correct: number) {
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
    const n = Math.max(0, correct + offset);
    if (n !== correct) wrong.add(n);
  }
  const colors = ["bg-blue-500", "bg-orange-500", "bg-green-500", "bg-purple-500"];
  return shuffle([
    { id: "c", label: String(correct), isCorrect: true, color: colors[0] },
    ...[...wrong].map((n, i) => ({ id: `w${i}`, label: String(n), isCorrect: false, color: colors[i + 1] }))
  ]);
}

export default function Multiplication() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "7-8";
  const maxB = ageRange === "7-8" ? 10 : 5;
  const tables = ageRange === "7-8" ? [2, 3, 4, 5, 10] : [2, 5, 10];

  const questions: Question[] = useMemo(() => {
    return buildUniqueQuestions(10, (i) => {
      const a = tables[Math.floor(Math.random() * tables.length)];
      const b = Math.floor(Math.random() * maxB) + 1;
      const correct = a * b;
      const emoji = EMOJIS[i % EMOJIS.length];
      return {
        id: `q${i}`,
        prompt: (
          <div className="text-center flex flex-col items-center gap-4">
            <div className="flex gap-2 sm:gap-3 flex-wrap justify-center items-center max-w-lg sm:max-w-2xl">
              {Array.from({ length: a }, (_, gi) => (
                <div key={gi} className="flex flex-wrap gap-1 bg-blue-50 rounded-2xl p-2 border-2 border-blue-200 max-w-[120px] sm:max-w-[150px] justify-center">
                  {Array.from({ length: b }, (_, j) => (
                    <span key={j} className="text-3xl sm:text-4xl leading-none">{emoji}</span>
                  ))}
                </div>
              ))}
            </div>
            <p className="text-4xl font-black text-foreground mt-2">{a} × {b} = ?</p>
          </div>
        ),
        options: makeOptions(correct)
      };
    });
  }, [maxB, tables]);

  return (
    <GameEngine
      gameId="multiplication"
      gameName="Times Tables"
      category="maths"
      description="Groups of objects make multiplication fun!"
      questions={questions}
      onExit={() => setLocation("/maths")}
    />
  );
}
