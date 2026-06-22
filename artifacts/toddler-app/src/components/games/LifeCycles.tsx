import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const QUESTIONS: { prompt: React.ReactNode; questionText: string; answer: string; opts: string[] }[] = [
  { prompt: <><div className="text-7xl mb-2">🥚 → ? → 🐔</div><p className="text-3xl font-black">What does a chicken egg hatch into first?</p></>, questionText: "What does a chicken egg hatch into first?", answer: "A chick",   opts: ["A chick","A frog","A butterfly","A fish"] },
  { prompt: <><div className="text-7xl mb-2">🥚 → 🐛 → ? → 🦋</div><p className="text-3xl font-black">What stage comes before a butterfly?</p></>, questionText: "What stage comes before a butterfly?", answer: "Chrysalis",  opts: ["Chrysalis","Tadpole","Caterpillar","Egg"] },
  { prompt: <><div className="text-7xl mb-2">🌱 → ? → 🌳</div><p className="text-3xl font-black">What grows from a seed before becoming a tree?</p></>, questionText: "What grows from a seed before becoming a tree?", answer: "A seedling", opts: ["A seedling","A flower","A mushroom","A leaf"] },
  { prompt: <><div className="text-7xl mb-2">🥚 → ? → 🐸</div><p className="text-3xl font-black">What does a frog's egg hatch into?</p></>, questionText: "What does a frog's egg hatch into?", answer: "A tadpole",  opts: ["A tadpole","A chick","A larva","A pupa"] },
  { prompt: <><div className="text-7xl mb-2">🐣</div><p className="text-3xl font-black">What do we call a baby bird just hatching from an egg?</p></>, questionText: "What do we call a baby bird just hatching from an egg?", answer: "A hatchling",opts: ["A hatchling","A tadpole","A larva","A cub"] },
  { prompt: <><div className="text-7xl mb-2">🌸 → 🍎</div><p className="text-3xl font-black">What does an apple blossom grow into?</p></>, questionText: "What does an apple blossom grow into?", answer: "An apple",   opts: ["An apple","A leaf","A seed","A root"] },
  { prompt: <><div className="text-7xl mb-2">🦁</div><p className="text-3xl font-black">What do we call a baby lion?</p></>, questionText: "What do we call a baby lion?", answer: "A cub",      opts: ["A cub","A pup","A foal","A lamb"] },
  { prompt: <><div className="text-7xl mb-2">🐟 → 🐬</div><p className="text-3xl font-black">What do we call a baby dolphin?</p></>, questionText: "What do we call a baby dolphin?", answer: "A calf",     opts: ["A calf","A pup","A foal","A kit"] },
];
const COLORS = ["bg-blue-500","bg-orange-500","bg-green-500","bg-purple-500"];

export default function LifeCycles() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(QUESTIONS).slice(0, 8).map((q, i) => ({
      id: `q${i}`,
      questionText: q.questionText,
      prompt: <div className="text-center">{q.prompt}</div>,
      options: shuffle(q.opts.map((o, j) => ({
        id: o === q.answer ? "c" : `w${j}`,
        label: o,
        isCorrect: o === q.answer,
        color: COLORS[j % COLORS.length]
      })))
    }));
  }, []);

  return (
    <GameEngine gameId="life-cycles" gameName="Life Cycles" category="science"
      description="Learn how living things grow and change!"
      questions={questions} onExit={() => setLocation("/science")} />
  );
}
