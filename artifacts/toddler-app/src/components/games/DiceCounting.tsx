import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { buildUniqueQuestions } from "@/lib/dedup";
import { useAppContext } from "@/context/AppContext";

function DiceFace({ value }: { value: number }) {
  const dots: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
  };
  const positions = dots[value] || dots[1];
  return (
    <div className="inline-block">
      <svg width="150" height="150" viewBox="0 0 100 100">
        <rect x="5" y="5" width="90" height="90" rx="20" ry="20" fill="white" stroke="#e2e8f0" strokeWidth="3"/>
        {positions.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="9" fill="#1e293b" />
        ))}
      </svg>
    </div>
  );
}

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

export default function DiceCounting() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "5-6";
  const max = ageRange === "3-4" ? 4 : ageRange === "5-6" ? 5 : 6;

  const questions: Question[] = useMemo(() => {
    return buildUniqueQuestions(10, (i) => {
      const val = Math.floor(Math.random() * max) + 1;
      return {
        id: `q${i}`,
        questionText: `How many dots on the dice? Count the dots!`,
        prompt: <DiceFace value={val} />,
        options: makeOptions(val, 1, max)
      };
    });
  }, [max]);

  return (
    <GameEngine
      gameId="dice-counting"
      gameName="Dice Counting"
      category="maths"
      description="Look at the dice and pick the right number!"
      questions={questions}
      onExit={() => setLocation("/maths")}
    />
  );
}
