import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const SOUND_ANIMALS = [
  { emoji: "🐯", sound: "ROAR" }, { emoji: "🐮", sound: "MOO" }, { emoji: "🐸", sound: "RIBBIT" },
  { emoji: "🐥", sound: "CHEEP" }, { emoji: "🐶", sound: "WOOF" }, { emoji: "🐱", sound: "MEOW" },
  { emoji: "🐑", sound: "BAA" }, { emoji: "🐴", sound: "NEIGH" }, { emoji: "🐷", sound: "OINK" },
  { emoji: "🦆", sound: "QUACK" }, { emoji: "🦁", sound: "ROAR" }, { emoji: "🐍", sound: "HISS" },
];

export default function AnimalSounds() {
  const [, setLocation] = useLocation();
  const colors = ["bg-primary", "bg-secondary", "bg-accent", "bg-[#a855f7]"];

  const questions: Question[] = useMemo(() => {
    const pool = shuffle(SOUND_ANIMALS).slice(0, 10);
    return pool.map((animal, i) => {
      const wrongPool = SOUND_ANIMALS.filter(a => a.emoji !== animal.emoji);
      const wrongs = shuffle(wrongPool).slice(0, 3);
      return {
        id: `q${i}`,
        questionText: `Which animal says "${animal.sound}"?`,
        prompt: (
          <div className="text-center">
            <p className="text-4xl font-black text-primary mb-4">"{animal.sound}!"</p>
            <p className="text-3xl font-black text-muted-foreground">Which animal says this?</p>
          </div>
        ),
        options: shuffle([
          { id: "c", label: animal.emoji, isCorrect: true, color: colors[0] },
          ...wrongs.map((w, j) => ({ id: `w${j}`, label: w.emoji, isCorrect: false, color: colors[j + 1] }))
        ])
      };
    });
  }, []);

  return (
    <GameEngine
      gameId="animal-sounds"
      gameName="Animal Sounds"
      category="animals"
      description="Hear the sound and pick the right animal!"
      questions={questions}
      onExit={() => setLocation("/animals")}
    />
  );
}
