import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const ITEMS: { emoji: string; name: string; type: "fruit" | "vegetable"; fact: string }[] = [
  { emoji: "🍎", name: "Apple",       type: "fruit",     fact: "Apples are fruits that grow on trees. They are sweet and crunchy!" },
  { emoji: "🍌", name: "Banana",      type: "fruit",     fact: "Bananas are fruits full of energy. They grow in hot countries!" },
  { emoji: "🍓", name: "Strawberry",  type: "fruit",     fact: "Strawberries are bright red fruits with lots of vitamins!" },
  { emoji: "🍇", name: "Grapes",      type: "fruit",     fact: "Grapes are small sweet fruits that grow in bunches!" },
  { emoji: "🍊", name: "Orange",      type: "fruit",     fact: "Oranges are full of vitamin C which keeps you healthy!" },
  { emoji: "🍋", name: "Lemon",       type: "fruit",     fact: "Lemons are sour fruits packed with vitamin C!" },
  { emoji: "🍉", name: "Watermelon",  type: "fruit",     fact: "Watermelons are big juicy fruits — mostly water inside!" },
  { emoji: "🍑", name: "Peach",       type: "fruit",     fact: "Peaches are sweet soft fruits that grow on trees!" },
  { emoji: "🫐", name: "Blueberries", type: "fruit",     fact: "Blueberries are tiny fruits full of vitamins!" },
  { emoji: "🍍", name: "Pineapple",   type: "fruit",     fact: "Pineapples are tropical fruits — sweet and tangy!" },
  { emoji: "🥕", name: "Carrot",      type: "vegetable", fact: "Carrots are vegetables that grow underground. Great for your eyes!" },
  { emoji: "🥦", name: "Broccoli",    type: "vegetable", fact: "Broccoli is a green vegetable full of vitamins and fibre!" },
  { emoji: "🥒", name: "Cucumber",    type: "vegetable", fact: "Cucumbers are cool crunchy vegetables — mostly water inside!" },
  { emoji: "🌽", name: "Sweetcorn",   type: "vegetable", fact: "Sweetcorn is a vegetable that grows tall in fields!" },
  { emoji: "🧅", name: "Onion",       type: "vegetable", fact: "Onions are vegetables that can make your eyes water!" },
  { emoji: "🥬", name: "Lettuce",     type: "vegetable", fact: "Lettuce is a leafy green vegetable great in salads!" },
  { emoji: "🫛", name: "Peas",        type: "vegetable", fact: "Peas are tiny green vegetables that grow inside pods!" },
  { emoji: "🍅", name: "Tomato",      type: "fruit",     fact: "A tomato is actually a fruit! It grows from a flower and has seeds inside." },
  { emoji: "🥑", name: "Avocado",     type: "fruit",     fact: "Avocados are fruits that have healthy fats inside!" },
  { emoji: "🌶️", name: "Pepper",     type: "fruit",     fact: "Peppers are technically fruits because they have seeds inside!" },
];

export default function PickFruitVeg() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(ITEMS).slice(0, 10).map((item, i) => ({
      id: `q${i}`,
      questionText: `Is a ${item.name} a fruit or a vegetable?`,
      explanation: item.fact,
      prompt: (
        <div className="text-center">
          <div className="text-[10rem] leading-none mb-4">{item.emoji}</div>
          <p className="text-3xl font-black text-muted-foreground">Is a <strong className="text-foreground">{item.name}</strong> a fruit or a vegetable?</p>
        </div>
      ),
      options: shuffle([
        { id: "fruit", label: "🍎 Fruit",      labelText: "Fruit",     isCorrect: item.type === "fruit",     color: "bg-red-500" },
        { id: "veg",   label: "🥦 Vegetable",  labelText: "Vegetable", isCorrect: item.type === "vegetable", color: "bg-green-500" },
      ])
    }));
  }, []);

  return (
    <GameEngine gameId="pick-fruit-veg" gameName="Fruit or Veg?" category="health"
      description="Can you tell a fruit from a vegetable?"
      questions={questions} onExit={() => setLocation("/health")} />
  );
}
