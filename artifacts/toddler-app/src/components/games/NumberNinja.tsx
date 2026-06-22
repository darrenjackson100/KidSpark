import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { useAppContext } from "@/context/AppContext";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

function makeQuestions(ageRange: string): Question[] {
  const qs: { text: string; answer: number; explanation: string }[] = [];

  if (ageRange === "5-6") {
    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10 - a; b++) {
        qs.push({ text: `${a} + ${b}`, answer: a + b, explanation: `${a} + ${b} = ${a + b}` });
      }
    }
    for (let a = 2; a <= 10; a++) {
      for (let b = 1; b < a; b++) {
        qs.push({ text: `${a} − ${b}`, answer: a - b, explanation: `${a} − ${b} = ${a - b}` });
      }
    }
  } else {
    for (let a = 5; a <= 50; a += 3) {
      for (let b = 5; b <= 50 - a; b += 4) {
        qs.push({ text: `${a} + ${b}`, answer: a + b, explanation: `${a} + ${b} = ${a + b}` });
      }
    }
    for (let a = 20; a <= 60; a += 7) {
      for (let b = 5; b < a; b += 6) {
        qs.push({ text: `${a} − ${b}`, answer: a - b, explanation: `${a} − ${b} = ${a - b}` });
      }
    }
    for (let t = 2; t <= 12; t++) {
      for (let m = 1; m <= 12; m++) {
        qs.push({ text: `${t} × ${m}`, answer: t * m, explanation: `${t} × ${m} = ${t * m}` });
      }
    }
  }

  return shuffle(qs).slice(0, 15).map((q, i) => {
    const wrong = shuffle(
      [-3,-2,-1,1,2,3,4,5].map(d => q.answer + d).filter(n => n > 0 && n !== q.answer)
    ).slice(0, 3);
    return {
      id: `q${i}`,
      questionText: `${q.text} = ?`,
      explanation: q.explanation,
      prompt: (
        <div className="text-center">
          <div className="text-7xl font-black text-foreground tracking-wider mb-4">
            {q.text} = <span className="text-primary">?</span>
          </div>
          <p className="text-2xl font-bold text-muted-foreground">What is the answer?</p>
        </div>
      ),
      options: shuffle([
        { id: "c", label: String(q.answer), labelText: String(q.answer), isCorrect: true, color: "bg-green-500" },
        ...wrong.map((n, j) => ({ id: `w${j}`, label: String(n), labelText: String(n), isCorrect: false, color: ["bg-blue-500","bg-orange-500","bg-purple-500"][j] }))
      ])
    };
  });
}

export default function NumberNinja() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();
  const questions = useMemo(() => makeQuestions(activeProfile?.ageRange ?? "5-6"), [activeProfile?.ageRange]);

  return (
    <GameEngine gameId="number-ninja" gameName="Number Ninja ⚡" category="maths"
      description="Quick-fire mental maths — how fast can you go?"
      questions={questions} onExit={() => setLocation("/maths")} />
  );
}
