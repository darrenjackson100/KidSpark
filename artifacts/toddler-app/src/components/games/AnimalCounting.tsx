import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { buildUniqueQuestions } from "@/lib/dedup";
import { useAppContext } from "@/context/AppContext";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const ANIMALS = [
  { emoji: "🐶", name: "dogs" },
  { emoji: "🐱", name: "cats" },
  { emoji: "🐸", name: "frogs" },
  { emoji: "🐥", name: "chicks" },
  { emoji: "🦋", name: "butterflies" },
  { emoji: "🐠", name: "fish" },
  { emoji: "🐰", name: "rabbits" },
  { emoji: "🐮", name: "cows" },
  { emoji: "🐧", name: "penguins" },
  { emoji: "🐢", name: "turtles" },
];

function makeOptions(correct: number, max: number) {
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const n = Math.floor(Math.random() * max) + 1;
    if (n !== correct) wrong.add(n);
  }
  const colors = ["bg-blue-500", "bg-orange-500", "bg-green-500", "bg-purple-500"];
  return shuffle([
    { id: "c", label: String(correct), isCorrect: true, color: colors[0] },
    ...[...wrong].map((n, i) => ({ id: `w${i}`, label: String(n), isCorrect: false, color: colors[i + 1] }))
  ]);
}

export default function AnimalCounting() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "5-6";
  const max = ageRange === "3-4" ? 5 : ageRange === "5-6" ? 10 : 15;

  const questions: Question[] = useMemo(() => {
    return buildUniqueQuestions(10, (i) => {
      const count = Math.floor(Math.random() * max) + 1;
      const animal = ANIMALS[i % ANIMALS.length];
      return {
        id: `q${i}`,
        questionText: `How many ${animal.name} are there? Count the animals!`,
        prompt: (
          <div className="text-center">
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2 max-w-md sm:max-w-xl mx-auto mb-4">
              {Array.from({ length: count }, (_, j) => (
                <span key={j} className="text-6xl sm:text-7xl leading-none">{animal.emoji}</span>
              ))}
            </div>
            <p className="text-3xl font-black text-muted-foreground">How many animals?</p>
          </div>
        ),
        options: makeOptions(count, max)
      };
    });
  }, [max]);

  return (
    <GameEngine
      gameId="animal-counting"
      gameName="Animal Counting"
      category="animals"
      description="Count the animals and pick the right number!"
      questions={questions}
      onExit={() => setLocation("/animals")}
    />
  );
}
