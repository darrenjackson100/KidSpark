import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const DRINKS: { emoji: string; name: string; answer: "Healthy" | "Sometimes" | "Not healthy"; fact: string }[] = [
  { emoji: "💧", name: "Water",           answer: "Healthy",     fact: "Water is the best drink! Your body is mostly water and needs it every day." },
  { emoji: "🥛", name: "Milk",            answer: "Healthy",     fact: "Milk has calcium which helps your bones and teeth grow strong!" },
  { emoji: "🧃", name: "Orange juice",    answer: "Sometimes",   fact: "Fruit juice has vitamins but also a lot of sugar. A small glass sometimes is fine!" },
  { emoji: "🥤", name: "Cola",            answer: "Not healthy", fact: "Cola has lots of sugar and no vitamins. It can damage your teeth!" },
  { emoji: "🍵", name: "Warm milk",       answer: "Healthy",     fact: "Warm milk is great before bed and full of goodness!" },
  { emoji: "🫖", name: "Herbal tea",      answer: "Sometimes",   fact: "Herbal tea can be nice sometimes, but water is still the best choice!" },
  { emoji: "🧋", name: "Bubble tea",      answer: "Not healthy", fact: "Bubble tea has lots of sugar and is best kept as a rare treat!" },
  { emoji: "🍹", name: "Sugary squash",   answer: "Not healthy", fact: "Squash with lots of sugar can damage your teeth. Look for low-sugar versions!" },
  { emoji: "🥤", name: "Energy drink",    answer: "Not healthy", fact: "Energy drinks have too much sugar and caffeine. They are not for children!" },
  { emoji: "🫗", name: "Coconut water",   answer: "Healthy",     fact: "Coconut water is a natural drink with minerals and no added sugar!" },
  { emoji: "🧃", name: "Apple juice",     answer: "Sometimes",   fact: "Apple juice has vitamins but also sugar. A small glass is fine sometimes!" },
  { emoji: "🥤", name: "Sports drink",    answer: "Sometimes",   fact: "Sports drinks are only needed after lots of exercise. Water is usually better!" },
];

export default function DrinkChoices() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(DRINKS).slice(0, 10).map((d, i) => ({
      id: `q${i}`,
      questionText: `Is ${d.name} a healthy drink for every day?`,
      explanation: d.fact,
      prompt: (
        <div className="text-center">
          <div className="text-[9rem] leading-none mb-4">{d.emoji}</div>
          <p className="text-3xl font-black text-muted-foreground">Is <strong className="text-foreground">{d.name}</strong> a healthy drink for every day?</p>
        </div>
      ),
      options: shuffle([
        { id: "yes", label: "✅ Yes", labelText: "Yes", isCorrect: d.answer === "Healthy", color: "bg-green-500" },
        { id: "no",  label: "❌ No",  labelText: "No",  isCorrect: d.answer !== "Healthy", color: "bg-red-500" },
      ])
    }));
  }, []);

  return (
    <GameEngine gameId="drink-choices" gameName="Drink Choices" category="health"
      description="Which drinks are good for your body?"
      questions={questions} onExit={() => setLocation("/health")} />
  );
}
