import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { buildUniqueQuestions } from "@/lib/dedup";
import { useAppContext } from "@/context/AppContext";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function WhichSmaller() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "5-6";
  const max = ageRange === "3-4" ? 10 : ageRange === "5-6" ? 20 : 50;

  const questions: Question[] = useMemo(() => {
    return buildUniqueQuestions(10, (i) => {
      let a = Math.floor(Math.random() * max) + 1;
      let b = Math.floor(Math.random() * max) + 1;
      while (a === b) b = Math.floor(Math.random() * max) + 1;
      const smaller = Math.min(a, b);
      const bigger = Math.max(a, b);
      return {
        id: `q${i}`,
        questionText: `Which number is smaller: ${a} or ${b}?`,
        prompt: (
          <div className="text-center">
            <p className="text-3xl font-black text-muted-foreground mb-6">Which number is SMALLER?</p>
            <div className="flex gap-10 justify-center">
              <span className="text-9xl font-black text-primary">{a}</span>
              <span className="text-6xl font-black text-muted-foreground self-center">or</span>
              <span className="text-9xl font-black text-secondary">{b}</span>
            </div>
          </div>
        ),
        options: shuffle([
          { id: "smaller", label: String(smaller), isCorrect: true, color: "bg-green-500" },
          { id: "bigger", label: String(bigger), isCorrect: false, color: "bg-red-500" }
        ])
      };
    });
  }, [max]);

  return (
    <GameEngine
      gameId="which-smaller"
      gameName="Which is Smaller?"
      category="maths"
      description="Look at the two numbers and pick the smaller one!"
      questions={questions}
      onExit={() => setLocation("/maths")}
    />
  );
}
