import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const OBJECTS: { emoji: string; name: string; answer: "Sink" | "Float"; fact: string }[] = [
  { emoji: "🪨", name: "Rock",          answer: "Sink",  fact: "Rocks sink because they are heavy and dense — the water can't support their weight." },
  { emoji: "🏐", name: "Beach ball",    answer: "Float", fact: "A beach ball floats because it is full of air — making it much less dense than water." },
  { emoji: "🔩", name: "Metal screw",   answer: "Sink",  fact: "A metal screw sinks because metal is denser than water." },
  { emoji: "🪵", name: "Wooden log",    answer: "Float", fact: "Wood floats because it is less dense than water — that's why boats can be made of wood!" },
  { emoji: "🍎", name: "Apple",         answer: "Float", fact: "Apples are full of air pockets which make them less dense than water — they float!" },
  { emoji: "🔑", name: "Metal key",     answer: "Sink",  fact: "Metal keys sink because metal is much denser than water." },
  { emoji: "🧲", name: "Magnet",        answer: "Sink",  fact: "Magnets are metal and sink because metal is denser than water." },
  { emoji: "🧴", name: "Plastic bottle",answer: "Float", fact: "An empty plastic bottle is mostly air so it floats easily!" },
  { emoji: "🪙", name: "Coin",          answer: "Sink",  fact: "Coins sink because they are made of dense metal — denser than water." },
  { emoji: "🧸", name: "Teddy bear",    answer: "Float", fact: "A soft toy floats because it is filled with light stuffing — much less dense than water." },
  { emoji: "🍋", name: "Lemon",         answer: "Float", fact: "Lemons float even though they feel heavy — the skin traps enough air to keep them up!" },
  { emoji: "🥚", name: "Fresh egg",     answer: "Sink",  fact: "A fresh egg sinks because it is dense. An old egg floats because of air inside!" },
  { emoji: "🪶", name: "Feather",       answer: "Float", fact: "Feathers are extremely light and flat — they sit on top of water easily." },
  { emoji: "🔦", name: "Torch",         answer: "Sink",  fact: "A metal/plastic torch is heavy enough to sink in water." },
  { emoji: "🎈", name: "Balloon",       answer: "Float", fact: "A balloon filled with air is so light that it floats on water." },
];

export default function SinkOrFloat() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(OBJECTS).slice(0, 10).map((o, i) => ({
      id: `q${i}`,
      questionText: `Would a ${o.name} sink or float in water?`,
      explanation: o.fact,
      prompt: (
        <div className="text-center">
          <div className="text-[9rem] leading-none mb-4">{o.emoji}</div>
          <p className="text-3xl font-black text-muted-foreground">
            Would a <strong className="text-foreground">{o.name}</strong> sink or float?
          </p>
          <p className="text-xl font-bold text-muted-foreground mt-2">💧 What do you think?</p>
        </div>
      ),
      options: shuffle([
        { id: "sink",  label: "🪨 Sink",   labelText: "Sink",  isCorrect: o.answer === "Sink",  color: "bg-slate-600" },
        { id: "float", label: "🎈 Float",  labelText: "Float", isCorrect: o.answer === "Float", color: "bg-blue-500" },
      ])
    }));
  }, []);

  return (
    <GameEngine gameId="sink-or-float" gameName="Sink or Float?" category="science"
      description="Would it sink or float in water? Let's find out!"
      questions={questions} onExit={() => setLocation("/science")} />
  );
}
