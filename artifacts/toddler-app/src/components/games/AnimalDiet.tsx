import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

type Diet = "Herbivore" | "Carnivore" | "Omnivore";

const ANIMALS: { emoji: string; name: string; diet: Diet; eats: string; fact: string }[] = [
  { emoji: "🐄", name: "Cow",       diet: "Herbivore", eats: "grass and hay",      fact: "Cows only eat plants. They spend most of the day chewing grass!" },
  { emoji: "🐰", name: "Rabbit",    diet: "Herbivore", eats: "grass, vegetables",   fact: "Rabbits are herbivores and love vegetables like carrots and lettuce." },
  { emoji: "🐘", name: "Elephant",  diet: "Herbivore", eats: "leaves, fruit, grass",fact: "Elephants eat up to 150 kg of plants every day — they're huge herbivores!" },
  { emoji: "🦒", name: "Giraffe",   diet: "Herbivore", eats: "leaves from trees",   fact: "Giraffes are herbivores that use their long necks to reach leaves high up!" },
  { emoji: "🐴", name: "Horse",     diet: "Herbivore", eats: "grass and hay",       fact: "Horses only eat plants. They have flat teeth perfect for grinding grass!" },
  { emoji: "🦁", name: "Lion",      diet: "Carnivore", eats: "meat",                fact: "Lions are carnivores — they hunt zebras, wildebeest and other animals." },
  { emoji: "🐊", name: "Crocodile", diet: "Carnivore", eats: "fish and animals",    fact: "Crocodiles are carnivores with one of the strongest bites on Earth!" },
  { emoji: "🦈", name: "Shark",     diet: "Carnivore", eats: "fish and sea animals",fact: "Sharks are carnivores — apex predators of the ocean!" },
  { emoji: "🐍", name: "Snake",     diet: "Carnivore", eats: "mice and small animals",fact: "Snakes are carnivores that swallow their prey whole!" },
  { emoji: "🦅", name: "Eagle",     diet: "Carnivore", eats: "fish, rabbits, mice", fact: "Eagles are carnivores with incredible eyesight to spot prey from high up!" },
  { emoji: "🐻", name: "Bear",      diet: "Omnivore",  eats: "fish, berries, honey",fact: "Bears eat both plants and animals — they love berries AND fish!" },
  { emoji: "🐷", name: "Pig",       diet: "Omnivore",  eats: "plants and small animals",fact: "Pigs are omnivores — they'll eat almost anything they find!" },
  { emoji: "🦊", name: "Fox",       diet: "Omnivore",  eats: "rabbits, berries, insects",fact: "Foxes are clever omnivores — they eat meat, fruit, and insects." },
  { emoji: "🐧", name: "Penguin",   diet: "Carnivore", eats: "fish and squid",      fact: "Penguins only eat fish, squid and krill — true carnivores of the sea!" },
  { emoji: "🐔", name: "Chicken",   diet: "Omnivore",  eats: "seeds, insects, worms",fact: "Chickens are omnivores — they peck at seeds AND eat small insects!" },
  { emoji: "🦉", name: "Owl",       diet: "Carnivore", eats: "mice and small animals",fact: "Owls are night-time carnivores that swoop silently to catch prey." },
  { emoji: "🦝", name: "Raccoon",   diet: "Omnivore",  eats: "fruit, frogs, insects",fact: "Raccoons are omnivores famous for washing their food in water!" },
];

const DIET_COLORS: Record<Diet, string> = {
  "Herbivore": "bg-green-500",
  "Carnivore": "bg-red-600",
  "Omnivore":  "bg-orange-500",
};

const DIET_DESC: Record<Diet, string> = {
  "Herbivore": "🌿 Herbivore — eats only plants",
  "Carnivore": "🥩 Carnivore — eats only meat",
  "Omnivore":  "🍃 Omnivore — eats plants AND meat",
};

export default function AnimalDiet() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(ANIMALS).slice(0, 12).map((a, i) => ({
      id: `q${i}`,
      questionText: `What type of diet does a ${a.name} have? (It eats ${a.eats})`,
      explanation: a.fact,
      prompt: (
        <div className="text-center">
          <div className="text-[8rem] leading-none mb-4">{a.emoji}</div>
          <p className="text-2xl font-black text-foreground mb-2">{a.name}</p>
          <p className="text-xl font-bold text-muted-foreground">It eats: <span className="text-foreground">{a.eats}</span></p>
          <p className="text-xl font-bold text-muted-foreground mt-2">What type of diet is this?</p>
        </div>
      ),
      options: (["Herbivore","Carnivore","Omnivore"] as Diet[]).map(d => ({
        id: d as string, label: DIET_DESC[d], labelText: d as string, isCorrect: d === a.diet, color: DIET_COLORS[d],
      }))
    }));
  }, []);

  return (
    <GameEngine gameId="animal-diet" gameName="Animal Diets" category="animals"
      description="Is it a herbivore, carnivore or omnivore?"
      questions={questions} onExit={() => setLocation("/animals")} />
  );
}
