import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const FOODS: { emoji: string; name: string; healthy: boolean; fact: string }[] = [
  { emoji: "🥪", name: "Wholemeal sandwich",  healthy: true,  fact: "Wholemeal bread gives you slow-release energy to last through the afternoon!" },
  { emoji: "🍎", name: "Apple",               healthy: true,  fact: "An apple is a perfect lunchbox snack — sweet, crunchy and full of vitamins!" },
  { emoji: "🥕", name: "Carrot sticks",       healthy: true,  fact: "Carrot sticks are crunchy and full of vitamin A — great for your eyes!" },
  { emoji: "💧", name: "Water bottle",        healthy: true,  fact: "Water is the best drink for school — keeps your brain sharp!" },
  { emoji: "🫐", name: "Blueberries",         healthy: true,  fact: "Blueberries are full of antioxidants that help your brain think clearly!" },
  { emoji: "🧀", name: "Cheese",              healthy: true,  fact: "A small piece of cheese has protein and calcium for strong bones!" },
  { emoji: "🍰", name: "Slice of cake",       healthy: false, fact: "Cake is a treat — it tastes great but doesn't give much nutrition." },
  { emoji: "🍬", name: "Bag of sweets",       healthy: false, fact: "Sweets are full of sugar and can cause a big energy crash in the afternoon!" },
  { emoji: "🥤", name: "Fizzy drink",         healthy: false, fact: "Fizzy drinks have lots of sugar and no nutrients. Water is much better!" },
  { emoji: "🍫", name: "Chocolate bar",       healthy: false, fact: "A chocolate bar is a sugary treat — lovely now and then, but not for every lunchbox." },
  { emoji: "🍟", name: "Chips / crisps",      healthy: false, fact: "Crisps are salty and fatty — try crunchy crackers or veg sticks instead!" },
  { emoji: "🥜", name: "Mixed nuts",          healthy: true,  fact: "Nuts have healthy fats and protein to keep you full and focused!" },
  { emoji: "🍇", name: "Grapes",              healthy: true,  fact: "Grapes are easy to eat and full of vitamins — a perfect lunchbox fruit!" },
  { emoji: "🍩", name: "Doughnut",            healthy: false, fact: "Doughnuts are mostly sugar and fat with very little goodness for your body." },
];

export default function HealthyLunchbox() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(FOODS).slice(0, 10).map((f, i) => ({
      id: `q${i}`,
      questionText: `Is this a healthy lunch choice?`,
      explanation: f.fact,
      prompt: (
        <div className="text-center">
          <div className="text-[9rem] leading-none mb-4">{f.emoji}</div>
          <p className="text-3xl font-black text-muted-foreground">
            Is <strong className="text-foreground">{f.name}</strong> a healthy lunch choice?
          </p>
        </div>
      ),
      options: [
        { id: "yes", label: "Yes 👍", labelText: "Yes", isCorrect: f.healthy,  color: "bg-green-500" },
        { id: "no",  label: "No 👎",  labelText: "No",  isCorrect: !f.healthy, color: "bg-red-500" },
      ]
    }));
  }, []);

  return (
    <GameEngine gameId="healthy-lunchbox" gameName="Healthy Lunchbox" category="health"
      description="What makes a great school lunchbox?"
      questions={questions} onExit={() => setLocation("/health")} />
  );
}
