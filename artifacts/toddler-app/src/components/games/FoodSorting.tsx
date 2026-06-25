import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

type FoodItem = { emoji: string; name: string; category: "healthy" | "treat" | "sometimes" };

// Foods used in the Healthy Food sorting game.
const FOODS: FoodItem[] = [
  { emoji: "🥦", name: "Broccoli",    category: "healthy" },
  { emoji: "🥕", name: "Carrot",      category: "healthy" },
  { emoji: "🍎", name: "Apple",       category: "healthy" },
  { emoji: "🫐", name: "Blueberries", category: "healthy" },
  { emoji: "🥗", name: "Salad",       category: "healthy" },
  { emoji: "🥑", name: "Avocado",     category: "healthy" },
  { emoji: "🍓", name: "Strawberry",  category: "healthy" },
  { emoji: "🥒", name: "Cucumber",    category: "healthy" },
  { emoji: "🍌", name: "Banana",      category: "healthy" },
  { emoji: "🫛", name: "Peas",        category: "healthy" },
  { emoji: "🍕", name: "Pizza",       category: "sometimes" },
  { emoji: "🍟", name: "Chips",       category: "treat" },
  { emoji: "🍰", name: "Cake",        category: "treat" },
  { emoji: "🍬", name: "Sweets",      category: "treat" },
  { emoji: "🍩", name: "Doughnut",    category: "treat" },
  { emoji: "🍫", name: "Chocolate",   category: "treat" },
  { emoji: "🥤", name: "Fizzy Drink", category: "treat" },
  { emoji: "🍔", name: "Burger",      category: "sometimes" },
];

type Q = { prompt: React.ReactNode; questionText: string; explanation: string; correct: string; options: string[] };

function buildQ(food: FoodItem): Q {
  const isHealthy = food.category === "healthy";
  return {
    prompt: (
      <div className="text-center">
        <div className="text-[9rem] leading-none mb-4">{food.emoji}</div>
        <p className="text-3xl font-black text-muted-foreground">Is <strong className="text-foreground">{food.name}</strong> healthy?</p>
      </div>
    ),
    questionText: `Is ${food.name} a healthy food?`,
    explanation: isHealthy
      ? `${food.name} is packed with vitamins and nutrients that help your body grow strong!`
      : food.category === "sometimes"
      ? `${food.name} can be enjoyed sometimes as part of a balanced diet.`
      : `${food.name} is a treat food — tasty sometimes, but not every day!`,
    correct: isHealthy ? "Yes" : "No",
    options: ["Yes", "No"],
  };
}

export default function FoodSorting() {
const [location, setLocation] = useLocation();
const openedFromHealth = location.startsWith("/health");
const backPath = openedFromHealth ? "/health" : "/science";
const category: "health" | "science" = openedFromHealth ? "health" : "science";
  const COLORS = ["bg-green-500", "bg-red-500", "bg-orange-500", "bg-blue-500"];

  const questions = useMemo(() => {
    const selected = shuffle([...FOODS]).slice(0, 10);
    return selected.map((food, i) => {
      const q = buildQ(food);
      return {
        id: `q${i}`,
        prompt: q.prompt,
        questionText: q.questionText,
        explanation: q.explanation,
        options: shuffle(q.options.map((o, j) => ({
          id: o,
          label: o,
          labelText: o,
          isCorrect: o === q.correct,
          color: COLORS[j % COLORS.length],
        })))
      };
    });
  }, []);

  return (
      <GameEngine gameId="food-sorting" gameName="Healthy Food" category={category}
      description="Which foods help your body grow strong?"
      questions={questions} onExit={() => setLocation(backPath)} />
  );
}
