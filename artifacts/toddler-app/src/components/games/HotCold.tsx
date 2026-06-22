import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const ITEMS: { emoji: string; label: string; answer: "Hot" | "Cold" }[] = [
  { emoji: "🔥", label: "Fire",       answer: "Hot" },
  { emoji: "☀️", label: "The Sun",    answer: "Hot" },
  { emoji: "🍕", label: "Hot Pizza",  answer: "Hot" },
  { emoji: "☕", label: "Hot Tea",    answer: "Hot" },
  { emoji: "🕯️", label: "A Candle",   answer: "Hot" },
  { emoji: "🫐", label: "A Toaster",  answer: "Hot" },
  { emoji: "❄️", label: "Ice",        answer: "Cold" },
  { emoji: "⛄", label: "Snowman",    answer: "Cold" },
  { emoji: "🍦", label: "Ice Cream",  answer: "Cold" },
  { emoji: "🧊", label: "Ice Cube",   answer: "Cold" },
  { emoji: "🌨️", label: "Snow",       answer: "Cold" },
  { emoji: "🥤", label: "Cold Drink", answer: "Cold" },
];

export default function HotCold() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(ITEMS).slice(0, 10).map((item, i) => ({
      id: `q${i}`,
      questionText: `${item.label} — is it hot or cold?`,
      prompt: (
        <div className="text-center">
          <div className="text-[9rem] leading-none mb-4">{item.emoji}</div>
          <p className="text-3xl font-black text-muted-foreground">{item.label} — is it hot or cold?</p>
        </div>
      ),
      options: shuffle([
        { id: "hot",  label: "🔥 Hot",  labelText: "Hot",  isCorrect: item.answer === "Hot",  color: "bg-red-500" },
        { id: "cold", label: "❄️ Cold", labelText: "Cold", isCorrect: item.answer === "Cold", color: "bg-blue-500" },
      ])
    }));
  }, []);

  return (
    <GameEngine gameId="hot-cold" gameName="Hot or Cold?" category="science"
      description="Is it hot or cold? Let's find out!"
      questions={questions} onExit={() => setLocation("/science")} />
  );
}
