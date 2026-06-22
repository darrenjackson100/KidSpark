import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { useAppContext } from "@/context/AppContext";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const WORDS_WITH_PICS: { word: string; emoji: string; firstLetter: string }[] = [
  { word: "Apple",    emoji: "🍎", firstLetter: "A" },
  { word: "Ball",     emoji: "⚽", firstLetter: "B" },
  { word: "Cat",      emoji: "🐱", firstLetter: "C" },
  { word: "Dog",      emoji: "🐶", firstLetter: "D" },
  { word: "Egg",      emoji: "🥚", firstLetter: "E" },
  { word: "Fish",     emoji: "🐟", firstLetter: "F" },
  { word: "Hat",      emoji: "🎩", firstLetter: "H" },
  { word: "Kite",     emoji: "🪁", firstLetter: "K" },
  { word: "Lion",     emoji: "🦁", firstLetter: "L" },
  { word: "Moon",     emoji: "🌙", firstLetter: "M" },
  { word: "Nest",     emoji: "🪺", firstLetter: "N" },
  { word: "Orange",   emoji: "🍊", firstLetter: "O" },
  { word: "Pig",      emoji: "🐷", firstLetter: "P" },
  { word: "Queen",    emoji: "👑", firstLetter: "Q" },
  { word: "Rabbit",   emoji: "🐰", firstLetter: "R" },
  { word: "Sun",      emoji: "☀️", firstLetter: "S" },
  { word: "Tree",     emoji: "🌳", firstLetter: "T" },
  { word: "Umbrella", emoji: "☂️", firstLetter: "U" },
  { word: "Volcano",  emoji: "🌋", firstLetter: "V" },
  { word: "Whale",    emoji: "🐳", firstLetter: "W" },
];

const COLORS = ["bg-blue-500","bg-orange-500","bg-green-500","bg-purple-500"];

export default function AlphabetTap() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "3-4";

  const questions: Question[] = useMemo(() => {
    const pool = shuffle(WORDS_WITH_PICS).slice(0, 10);
    return pool.map((item, i) => {
      const wrongs = shuffle(LETTERS.filter(l => l !== item.firstLetter)).slice(0, 3);
      const options = shuffle([
        { id: "c", label: item.firstLetter, isCorrect: true, color: COLORS[0] },
        ...wrongs.map((l, j) => ({ id: `w${j}`, label: l, isCorrect: false, color: COLORS[j + 1] }))
      ]);

      if (ageRange === "3-4") {
        return {
          id: `q${i}`,
          questionText: `What letter does ${item.word} start with?`,
          prompt: (
            <div className="text-center">
              <div className="text-9xl mb-4">{item.emoji}</div>
              <p className="text-3xl font-black text-muted-foreground">What letter does <span className="text-primary">{item.word}</span> start with?</p>
            </div>
          ),
          options
        };
      } else if (ageRange === "5-6") {
        const lower = item.firstLetter.toLowerCase();
        const wrongLowers = shuffle(LETTERS.filter(l => l !== item.firstLetter)).slice(0, 3).map(l => l.toLowerCase());
        return {
          id: `q${i}`,
          questionText: `Find the lowercase letter for: ${item.firstLetter}`,
          prompt: (
            <div className="text-center">
              <p className="text-3xl font-black text-muted-foreground mb-4">Find the lowercase letter:</p>
              <span className="text-9xl font-black text-primary">{item.firstLetter}</span>
            </div>
          ),
          options: shuffle([
            { id: "c", label: lower, isCorrect: true, color: COLORS[0] },
            ...wrongLowers.map((l, j) => ({ id: `w${j}`, label: l, isCorrect: false, color: COLORS[j + 1] }))
          ])
        };
      } else {
        return {
          id: `q${i}`,
          questionText: `What is the first letter of ${item.word}?`,
          prompt: (
            <div className="text-center">
              <div className="text-8xl mb-4">{item.emoji}</div>
              <p className="text-3xl font-black text-muted-foreground">What is the first letter of <span className="text-primary">{item.word}</span>?</p>
            </div>
          ),
          options
        };
      }
    });
  }, [ageRange]);

  return (
    <GameEngine gameId="alphabet-tap" gameName="Alphabet Tap" category="reading"
      description="Find the right letter for each picture!"
      questions={questions} onExit={() => setLocation("/reading")} />
  );
}
