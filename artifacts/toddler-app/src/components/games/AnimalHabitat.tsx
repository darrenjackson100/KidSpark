import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const HABITATS = [
  { label: "Farm", color: "bg-[#f59e0b]" },
  { label: "Ocean", color: "bg-primary" },
  { label: "Jungle", color: "bg-accent" },
  { label: "Sky", color: "bg-[#a855f7]" },
];

const HABITAT_ANIMALS: { emoji: string; name: string; habitat: string }[] = [
  { emoji: "🐮", name: "Cow", habitat: "Farm" },
  { emoji: "🐷", name: "Pig", habitat: "Farm" },
  { emoji: "🐑", name: "Sheep", habitat: "Farm" },
  { emoji: "🐔", name: "Chicken", habitat: "Farm" },
  { emoji: "🐬", name: "Dolphin", habitat: "Ocean" },
  { emoji: "🦈", name: "Shark", habitat: "Ocean" },
  { emoji: "🐙", name: "Octopus", habitat: "Ocean" },
  { emoji: "🐠", name: "Fish", habitat: "Ocean" },
  { emoji: "🦁", name: "Lion", habitat: "Jungle" },
  { emoji: "🐯", name: "Tiger", habitat: "Jungle" },
  { emoji: "🐘", name: "Elephant", habitat: "Jungle" },
  { emoji: "🦒", name: "Giraffe", habitat: "Jungle" },
  { emoji: "🦅", name: "Eagle", habitat: "Sky" },
  { emoji: "🦆", name: "Duck", habitat: "Sky" },
  { emoji: "🦜", name: "Parrot", habitat: "Sky" },
];

export default function AnimalHabitat() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    const pool = shuffle(HABITAT_ANIMALS).slice(0, 10);
    return pool.map((animal, i) => {
      const correctHabitat = HABITATS.find(h => h.label === animal.habitat)!;
      const wrongHabitats = HABITATS.filter(h => h.label !== animal.habitat);
      return {
        id: `q${i}`,
        questionText: `Where does the ${animal.name} ${animal.emoji} live?`,
        prompt: (
          <div className="text-center">
            <div className="text-[8rem] leading-none mb-4">{animal.emoji}</div>
            <p className="text-3xl font-black text-muted-foreground">Where does the {animal.name} live?</p>
          </div>
        ),
        options: shuffle([
          { id: "c", label: correctHabitat.label, isCorrect: true, color: correctHabitat.color },
          ...wrongHabitats.map((h, j) => ({ id: `w${j}`, label: h.label, isCorrect: false, color: h.color }))
        ])
      };
    });
  }, []);

  return (
    <GameEngine
      gameId="animal-habitat"
      gameName="Where Do I Live?"
      category="animals"
      description="Find the right home for each animal!"
      questions={questions}
      onExit={() => setLocation("/animals")}
    />
  );
}
