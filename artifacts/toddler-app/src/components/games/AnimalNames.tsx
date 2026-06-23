import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const ANIMALS = [
  { emoji: "🐶", name: "Dog" }, { emoji: "🐱", name: "Cat" }, { emoji: "🐭", name: "Mouse" },
  { emoji: "🐰", name: "Rabbit" }, { emoji: "🦊", name: "Fox" }, { emoji: "🐻", name: "Bear" },
  { emoji: "🐼", name: "Panda" }, { emoji: "🐨", name: "Koala" }, { emoji: "🐯", name: "Tiger" },
  { emoji: "🦁", name: "Lion" }, { emoji: "🐮", name: "Cow" }, { emoji: "🐷", name: "Pig" },
  { emoji: "🐸", name: "Frog" }, { emoji: "🐙", name: "Octopus" }, { emoji: "🦋", name: "Butterfly" },
  { emoji: "🐧", name: "Penguin" }, { emoji: "🐦", name: "Bird" }, { emoji: "🐬", name: "Dolphin" },
  { emoji: "🦒", name: "Giraffe" }, { emoji: "🐘", name: "Elephant" },
];

export default function AnimalNames() {
  const [, setLocation] = useLocation();
  const colors = ["bg-primary", "bg-secondary", "bg-accent", "bg-[#a855f7]"];

  const questions: Question[] = useMemo(() => {
    const pool = shuffle(ANIMALS);
    return pool.slice(0, 10).map((animal, i) => {
      const wrongPool = ANIMALS.filter(a => a.name !== animal.name);
      const wrongs = shuffle(wrongPool).slice(0, 3);
      return {
        id: `q${i}`,
        questionText: "What animal is this?",
        prompt: (
          <div className="text-center">
            <div className="text-[10rem] leading-none mb-4">{animal.emoji}</div>
            <p className="text-3xl font-black text-muted-foreground">What animal is this?</p>
          </div>
        ),
        options: shuffle([
          { id: "c", label: animal.name, isCorrect: true, color: colors[0] },
          ...wrongs.map((w, j) => ({ id: `w${j}`, label: w.name, isCorrect: false, color: colors[j + 1] }))
        ])
      };
    });
  }, []);

  return (
    <GameEngine
      gameId="animal-names"
      gameName="Animal Names"
      category="animals"
      description="See the animal and pick its name!"
      questions={questions}
      onExit={() => setLocation("/animals")}
    />
  );
}
