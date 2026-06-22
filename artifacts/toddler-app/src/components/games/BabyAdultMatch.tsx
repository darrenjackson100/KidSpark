import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const PAIRS = [
  { baby: "🐱", babyName: "Kitten", adult: "🐈", adultName: "Cat" },
  { baby: "🐶", babyName: "Puppy", adult: "🐕", adultName: "Dog" },
  { baby: "🐥", babyName: "Chick", adult: "🐔", adultName: "Hen" },
  { baby: "🐣", babyName: "Hatching Egg", adult: "🦆", adultName: "Duck" },
  { baby: "🐰", babyName: "Baby Rabbit", adult: "🐇", adultName: "Rabbit" },
  { baby: "🐷", babyName: "Piglet", adult: "🐖", adultName: "Pig" },
  { baby: "🐄", babyName: "Calf", adult: "🐮", adultName: "Cow" },
  { baby: "🦁", babyName: "Lion Cub", adult: "🦁", adultName: "Lion" },
  { baby: "🐻", babyName: "Bear Cub", adult: "🐻", adultName: "Bear" },
  { baby: "🦊", babyName: "Fox Kit", adult: "🦊", adultName: "Fox" },
];

export default function BabyAdultMatch() {
  const [, setLocation] = useLocation();
  const colors = ["bg-primary", "bg-secondary", "bg-accent", "bg-[#a855f7]"];

  const questions: Question[] = useMemo(() => {
    const pool = shuffle(PAIRS).slice(0, 10);
    return pool.map((pair, i) => {
      const wrongPool = PAIRS.filter(p => p.adultName !== pair.adultName);
      const wrongs = shuffle(wrongPool).slice(0, 3);
      return {
        id: `q${i}`,
        questionText: `Who is the grown-up of this baby? ${pair.baby} ${pair.babyName}`,
        prompt: (
          <div className="text-center">
            <div className="text-[8rem] leading-none mb-2">{pair.baby}</div>
            <p className="text-3xl font-black text-muted-foreground">Who is the grown-up of this baby?</p>
          </div>
        ),
        options: shuffle([
          { id: "c", label: <span>{pair.adult} {pair.adultName}</span>, labelText: `${pair.adult} ${pair.adultName}`, isCorrect: true, color: colors[0] },
          ...wrongs.map((w, j) => ({ id: `w${j}`, label: <span>{w.adult} {w.adultName}</span>, labelText: `${w.adult} ${w.adultName}`, isCorrect: false, color: colors[j + 1] }))
        ])
      };
    });
  }, []);

  return (
    <GameEngine
      gameId="baby-adult-match"
      gameName="Baby & Grown-Up"
      category="animals"
      description="Match the baby animal to its grown-up!"
      questions={questions}
      onExit={() => setLocation("/animals")}
    />
  );
}
