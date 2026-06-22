import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { buildUniqueQuestions } from "@/lib/dedup";
import { useAppContext } from "@/context/AppContext";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function MissingNumber() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "5-6";
  const max = ageRange === "3-4" ? 8 : ageRange === "5-6" ? 15 : 30;

  const questions: Question[] = useMemo(() => {
    return buildUniqueQuestions(10, (i) => {
      const start = Math.floor(Math.random() * (max - 4)) + 1;
      const seq = [start, start + 1, start + 2, start + 3, start + 4];
      const missingIdx = Math.floor(Math.random() * 5);
      const correct = seq[missingIdx];
      const wrong = new Set<number>();
      while (wrong.size < 3) {
        const n = Math.floor(Math.random() * (max + 2)) + 1;
        if (n !== correct) wrong.add(n);
      }
      const colors = ["bg-blue-500", "bg-orange-500", "bg-green-500", "bg-purple-500"];
      const display = seq.map((n, j) => j === missingIdx ? "?" : String(n));
      return {
        id: `q${i}`,
        questionText: `What number is missing? ${display.join(", ")}`,
        prompt: (
          <div className="text-center">
            <p className="text-3xl font-black text-muted-foreground mb-6">What number is missing?</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {display.map((d, j) => (
                <React.Fragment key={j}>
                  <span className={`text-6xl font-black ${d === "?" ? "text-primary" : "text-foreground"}`}>{d}</span>
                  {j < display.length - 1 && <span className="text-4xl text-muted-foreground self-center">,</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        ),
        options: shuffle([
          { id: "c", label: String(correct), isCorrect: true, color: colors[0] },
          ...[...wrong].map((n, j) => ({ id: `w${j}`, label: String(n), isCorrect: false, color: colors[j + 1] }))
        ])
      };
    });
  }, [max]);

  return (
    <GameEngine
      gameId="missing-number"
      gameName="Missing Number"
      category="maths"
      description="Find the missing number in the sequence!"
      questions={questions}
      onExit={() => setLocation("/maths")}
    />
  );
}
