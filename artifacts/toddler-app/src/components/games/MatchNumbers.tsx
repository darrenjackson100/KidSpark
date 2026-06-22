import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { buildUniqueQuestions } from "@/lib/dedup";
import { useAppContext } from "@/context/AppContext";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const EMOJI = "🍎";

export default function MatchNumbers() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "3-4";
  const max = ageRange === "3-4" ? 5 : ageRange === "5-6" ? 8 : 12;

  const questions: Question[] = useMemo(() => {
    return buildUniqueQuestions(10, (i) => {
      const correct = Math.floor(Math.random() * max) + 1;
      const wrongs = new Set<number>();
      while (wrongs.size < 3) {
        const n = Math.floor(Math.random() * max) + 1;
        if (n !== correct) wrongs.add(n);
      }
      const colors = ["bg-blue-500", "bg-orange-500", "bg-green-500", "bg-purple-500"];
      const options = shuffle([
        {
          id: "c", isCorrect: true, color: colors[0], labelText: `${correct} objects`,
          label: <span className="text-4xl sm:text-5xl leading-tight break-all">{Array.from({ length: correct }, () => EMOJI).join("")}</span>
        },
        ...[...wrongs].map((n, j) => ({
          id: `w${j}`, isCorrect: false, color: colors[j + 1], labelText: `${n} objects`,
          label: <span className="text-4xl sm:text-5xl leading-tight break-all">{Array.from({ length: n }, () => EMOJI).join("")}</span>
        }))
      ]);
      return {
        id: `q${i}`,
        questionText: `Find ${correct} objects — which group has exactly ${correct}?`,
        prompt: (
          <div className="text-center">
            <p className="text-3xl font-black text-muted-foreground mb-4">Find</p>
            <span className="text-[9rem] font-black text-foreground leading-none">{correct}</span>
            <p className="text-3xl font-black text-muted-foreground mt-2">objects</p>
          </div>
        ),
        options
      };
    });
  }, [max]);

  return (
    <GameEngine
      gameId="match-numbers"
      gameName="Match Numbers"
      category="maths"
      description="See the number and find the matching group!"
      questions={questions}
      onExit={() => setLocation("/maths")}
    />
  );
}
