import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const ITEMS: { emoji: string; name: string; answer: "Big" | "Small"; fact: string }[] = [
  { emoji: "🐘", name: "Elephant",    answer: "Big",   fact: "An elephant is one of the biggest animals on land!" },
  { emoji: "🐜", name: "Ant",         answer: "Small", fact: "Ants are tiny but very strong!" },
  { emoji: "🦋", name: "Butterfly",   answer: "Small", fact: "Butterflies are small and delicate." },
  { emoji: "🐳", name: "Whale",       answer: "Big",   fact: "The blue whale is the biggest animal on Earth!" },
  { emoji: "🐝", name: "Bee",         answer: "Small", fact: "Bees are small but very important for flowers." },
  { emoji: "🦁", name: "Lion",        answer: "Big",   fact: "Lions are big, powerful animals." },
  { emoji: "🐭", name: "Mouse",       answer: "Small", fact: "Mice are tiny animals." },
  { emoji: "🏔️", name: "Mountain",   answer: "Big",   fact: "Mountains are enormous!" },
  { emoji: "🍀", name: "Clover leaf", answer: "Small", fact: "A clover leaf is tiny!" },
  { emoji: "🌳", name: "Tree",        answer: "Big",   fact: "Trees can grow very tall." },
  { emoji: "🐛", name: "Caterpillar", answer: "Small", fact: "Caterpillars are small and wiggly." },
  { emoji: "🦒", name: "Giraffe",     answer: "Big",   fact: "Giraffes are the tallest animals alive!" },
  { emoji: "🐞", name: "Ladybird",    answer: "Small", fact: "A ladybird can fit on your fingertip." },
  { emoji: "🦏", name: "Rhino",       answer: "Big",   fact: "Rhinos are very big and heavy animals." },
];

export default function BigOrSmall() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(ITEMS).slice(0, 10).map((item, i) => ({
      id: `q${i}`,
      questionText: `Is a ${item.name} big or small?`,
      explanation: item.fact,
      prompt: (
        <div className="text-center">
          <div className="text-[10rem] leading-none mb-4">{item.emoji}</div>
          <p className="text-3xl font-black text-muted-foreground">Is a <strong className="text-foreground">{item.name}</strong> big or small?</p>
        </div>
      ),
      options: shuffle([
        { id: "big",  label: "🐘 Big",   labelText: "Big",    isCorrect: item.answer === "Big",   color: "bg-blue-500" },
        { id: "sml",  label: "🐜 Small", labelText: "Small",  isCorrect: item.answer === "Small", color: "bg-green-500" },
      ])
    }));
  }, []);

  return (
    <GameEngine gameId="big-or-small" gameName="Big or Small?" category="science"
      description="Is it big or small? Let's find out!"
      questions={questions} onExit={() => setLocation("/science")} />
  );
}
