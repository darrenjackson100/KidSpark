import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

type FGroup = "Fruit & Veg" | "Carbohydrates" | "Protein" | "Dairy";

const FOODS: { emoji: string; name: string; group: FGroup; fact: string }[] = [
  { emoji: "🍎", name: "Apple",         group: "Fruit & Veg",      fact: "Fruit and vegetables give you vitamins, minerals and fibre to stay healthy." },
  { emoji: "🥦", name: "Broccoli",      group: "Fruit & Veg",      fact: "Broccoli is packed with vitamin C and iron — two of your body's favourites!" },
  { emoji: "🥕", name: "Carrot",        group: "Fruit & Veg",      fact: "Carrots have vitamin A which helps you see in the dark!" },
  { emoji: "🍌", name: "Banana",        group: "Fruit & Veg",      fact: "Bananas give you potassium which helps your muscles work." },
  { emoji: "🍞", name: "Bread",         group: "Carbohydrates",    fact: "Bread gives your body carbohydrates — the main fuel for energy!" },
  { emoji: "🍝", name: "Pasta",         group: "Carbohydrates",    fact: "Pasta is a carbohydrate that slowly releases energy — great before sport!" },
  { emoji: "🍚", name: "Rice",          group: "Carbohydrates",    fact: "Rice is a starchy carbohydrate eaten by billions of people around the world." },
  { emoji: "🥔", name: "Potato",        group: "Carbohydrates",    fact: "Potatoes are a carbohydrate and also contain vitamin C!" },
  { emoji: "🥩", name: "Chicken",       group: "Protein",          fact: "Chicken is a lean protein that helps your muscles grow and repair." },
  { emoji: "🥚", name: "Eggs",          group: "Protein",          fact: "Eggs contain all the essential amino acids your body needs!" },
  { emoji: "🐟", name: "Fish",          group: "Protein",          fact: "Fish has protein and omega-3 fatty acids which are great for your brain!" },
  { emoji: "🫘", name: "Baked beans",   group: "Protein",          fact: "Beans are a plant protein — also packed with fibre!" },
  { emoji: "🥛", name: "Milk",          group: "Dairy",            fact: "Milk has calcium and vitamin D which help build strong bones and teeth." },
  { emoji: "🧀", name: "Cheese",        group: "Dairy",            fact: "Cheese is full of calcium — great for bones and teeth!" },
  { emoji: "🍦", name: "Yoghurt",       group: "Dairy",            fact: "Yoghurt has calcium AND good bacteria that help your digestion." },
];

const GROUPS: FGroup[] = ["Fruit & Veg", "Carbohydrates", "Protein", "Dairy"];
const GROUP_COLORS: Record<FGroup, string> = {
  "Fruit & Veg":    "bg-green-500",
  "Carbohydrates":  "bg-amber-500",
  "Protein":        "bg-orange-600",
  "Dairy":          "bg-blue-500",
};

export default function FoodGroups() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(FOODS).slice(0, 10).map((f, i) => ({
      id: `q${i}`,
      questionText: `Which food group does ${f.name} belong to?`,
      explanation: f.fact,
      prompt: (
        <div className="text-center">
          <div className="text-[9rem] leading-none mb-4">{f.emoji}</div>
          <p className="text-3xl font-black text-muted-foreground">
            Which food group is <strong className="text-foreground">{f.name}</strong>?
          </p>
        </div>
      ),
      options: GROUPS.map(g => ({
        id: g, label: g, labelText: g,
        isCorrect: g === f.group,
        color: GROUP_COLORS[g],
      }))
    }));
  }, []);

  return (
    <GameEngine gameId="food-groups" gameName="Food Groups" category="health"
      description="Sort foods into their correct food group!"
      questions={questions} onExit={() => setLocation("/health")} />
  );
}
