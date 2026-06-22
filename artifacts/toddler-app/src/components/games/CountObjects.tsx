import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { buildUniqueQuestions } from "@/lib/dedup";
import { useAppContext } from "@/context/AppContext";

const OBJECT_EMOJIS = ["🍎", "⭐", "🌸", "🐟", "🍭", "🦋", "🎈", "🌻", "🍕", "🏆"];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function makeOptions(correct: number, min: number, max: number) {
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    if (n !== correct) wrong.add(n);
  }
  const colors = ["bg-blue-500", "bg-orange-500", "bg-green-500", "bg-purple-500"];
  return shuffle([
    { id: "c", label: String(correct), isCorrect: true, color: colors[0] },
    ...[...wrong].map((n, i) => ({ id: `w${i}`, label: String(n), isCorrect: false, color: colors[i + 1] }))
  ]);
}

export default function CountObjects() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "5-6";
  const max = ageRange === "3-4" ? 5 : ageRange === "5-6" ? 10 : 20;
  const min = 1;

  const questions: Question[] = useMemo(() => {
    return buildUniqueQuestions(10, (i) => {
      const count = Math.floor(Math.random() * max) + min;
      const emoji = OBJECT_EMOJIS[i % OBJECT_EMOJIS.length];
      return {
        id: `q${i}`,
        questionText: `Count the ${emoji} — How many are there?`,
        prompt: (
          <div className="text-center">
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2 max-w-md sm:max-w-xl mx-auto mb-4">
              {Array.from({ length: count }, (_, j) => (
                <span key={j} className="text-6xl sm:text-7xl leading-none">{emoji}</span>
              ))}
            </div>
            <p className="text-3xl font-black text-muted-foreground mt-4">How many?</p>
          </div>
        ),
        options: makeOptions(count, min, max)
      };
    });
  }, [max]);

  return (
    <GameEngine
      gameId="count-objects"
      gameName="Count the Objects"
      category="maths"
      description="Count the objects and pick the right number!"
      questions={questions}
      onExit={() => setLocation("/maths")}
    />
  );
}
