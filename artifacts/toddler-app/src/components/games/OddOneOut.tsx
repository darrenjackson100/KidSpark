import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { buildUniqueQuestions } from "@/lib/dedup";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

interface AnimalOption {
  emoji: string;
  name: string;
}

const GROUPS: { category: string; animals: AnimalOption[] }[] = [
  {
    category: "Farm",
    animals: [
      { emoji: "🐮", name: "Cow" },
      { emoji: "🐷", name: "Pig" },
      { emoji: "🐑", name: "Sheep" },
      { emoji: "🐔", name: "Chicken" },
      { emoji: "🐴", name: "Horse" },
      { emoji: "🐄", name: "Cow" },
    ],
  },
  {
    category: "Ocean",
    animals: [
      { emoji: "🐬", name: "Dolphin" },
      { emoji: "🐳", name: "Whale" },
      { emoji: "🦈", name: "Shark" },
      { emoji: "🐙", name: "Octopus" },
      { emoji: "🐠", name: "Fish" },
      { emoji: "🦞", name: "Lobster" },
    ],
  },
{
    category: "Jungle",
    animals: [
      { emoji: "🐒", name: "Monkey" },
      { emoji: "🦍", name: "Gorilla" },
      { emoji: "🐯", name: "Tiger" },
      { emoji: "🐍", name: "Snake" },
      { emoji: "🐊", name: "Crocodile" },
      { emoji: "🐆", name: "Leopard" },
    ],
  },
  {
    category: "Sky",
    animals: [
      { emoji: "🦅", name: "Eagle" },
      { emoji: "🦆", name: "Duck" },
      { emoji: "🦜", name: "Parrot" },
      { emoji: "🦚", name: "Peacock" },
      { emoji: "🐦", name: "Bird" },
      { emoji: "🦋", name: "Butterfly" },
    ],
  },
  {
    category: "Bugs",
    animals: [
      { emoji: "🐝", name: "Bee" },
      { emoji: "🐞", name: "Ladybird" },
      { emoji: "🦋", name: "Butterfly" },
      { emoji: "🐜", name: "Ant" },
      { emoji: "🪲", name: "Beetle" },
      { emoji: "🦗", name: "Cricket" },
    ],
  }
];

export default function OddOneOut() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return buildUniqueQuestions(10, (i) => {
      const mainGroup = GROUPS[i % GROUPS.length];
      const oddGroup = GROUPS[(i + 1) % GROUPS.length];
      const three = shuffle(mainGroup.animals).slice(0, 3);
      const odd = shuffle(oddGroup.animals)[0];
      const all = shuffle([...three, odd]);
      const colors = ["bg-primary", "bg-secondary", "bg-accent", "bg-[#a855f7]"];

      return {
        id: `q${i}`,
        questionText: `Spot the odd one out! 3 animals belong together — which one doesn't fit?`,
        prompt: (
          <div className="text-center">
            <p className="text-3xl font-black text-muted-foreground mb-2">Spot the odd one out!</p>
            <p className="text-xl font-bold text-muted-foreground">3 animals belong together. Which one doesn't fit?</p>
          </div>
        ),
        options: all.map((animal, j) => ({
          id: `opt${j}`,
          label: animal.emoji,
          labelText: animal.name,
          isCorrect: animal === odd,
          color: colors[j % colors.length],
        })),
      };
    });
  }, []);

  return (
    <GameEngine
      gameId="odd-one-out"
      gameName="Odd One Out"
      category="animals"
      description="Find the animal that doesn't belong here!"
      questions={questions}
      onExit={() => setLocation("/animals")}
    />
  );
}
