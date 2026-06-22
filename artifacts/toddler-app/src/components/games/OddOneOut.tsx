import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { buildUniqueQuestions } from "@/lib/dedup";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const GROUPS: { category: string; animals: string[] }[] = [
  { category: "Farm", animals: ["🐮", "🐷", "🐑", "🐔", "🐴", "🐄"] },
  { category: "Ocean", animals: ["🐬", "🐳", "🦈", "🐙", "🐠", "🦞"] },
  { category: "Jungle", animals: ["🦁", "🐯", "🐘", "🦒", "🦍", "🦊"] },
  { category: "Sky", animals: ["🦅", "🦆", "🦜", "🦚", "🐦", "🦋"] },
  { category: "Arctic", animals: ["🐧", "🐻‍❄️", "🦭", "🦊", "🐺"] },
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
        options: all.map((emoji, j) => ({
          id: `opt${j}`,
          label: emoji,
          isCorrect: emoji === odd,
          color: colors[j % colors.length]
        }))
      };
    });
  }, []);

  return (
    <GameEngine
      gameId="odd-one-out"
      gameName="Odd One Out"
      category="animals"
      description="Find the animal that doesn't belong!"
      questions={questions}
      onExit={() => setLocation("/animals")}
    />
  );
}
