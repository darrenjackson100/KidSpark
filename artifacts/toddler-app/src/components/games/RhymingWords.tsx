import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { useAppContext } from "@/context/AppContext";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const RHYME_PAIRS: { word: string; emoji: string; rhyme: string; distractors: string[] }[] = [
  { word: "cat",  emoji: "🐱", rhyme: "bat",   distractors: ["pen","big","run"] },
  { word: "sun",  emoji: "☀️", rhyme: "fun",   distractors: ["cat","big","pen"] },
  { word: "day",  emoji: "🌞", rhyme: "say",   distractors: ["run","big","red"] },
  { word: "look", emoji: "👀", rhyme: "book",  distractors: ["run","big","cat"] },
  { word: "hop",  emoji: "🐸", rhyme: "pop",   distractors: ["sun","big","cat"] },
  { word: "tree", emoji: "🌳", rhyme: "bee",   distractors: ["run","cat","big"] },
  { word: "make", emoji: "🎂", rhyme: "cake",  distractors: ["run","big","cat"] },
  { word: "ball", emoji: "⚽", rhyme: "fall",  distractors: ["run","big","cat"] },
  { word: "night",emoji: "🌙", rhyme: "light", distractors: ["run","big","cat"] },
  { word: "bear", emoji: "🐻", rhyme: "hair",  distractors: ["run","big","cat"] },
  { word: "feet", emoji: "🦶", rhyme: "meet",  distractors: ["big","run","cat"] },
  { word: "sing", emoji: "🎵", rhyme: "ring",  distractors: ["big","run","cat"] },
];
const COLORS = ["bg-blue-500","bg-orange-500","bg-green-500","bg-purple-500"];

export default function RhymingWords() {
  const [, setLocation] = useLocation();
  const questions: Question[] = useMemo(() => {
    const items = shuffle(RHYME_PAIRS).slice(0, 10);
    return items.map((item, i) => ({
      id: `q${i}`,
      questionText: `Which word rhymes with "${item.word}"?`,
      prompt: (
        <div className="text-center">
          <div className="text-8xl mb-4">{item.emoji}</div>
          <p className="text-3xl font-black text-muted-foreground mb-2">Which word rhymes with</p>
          <p className="text-7xl font-black text-primary">"{item.word}"?</p>
        </div>
      ),
      options: shuffle([
        { id: "c", label: item.rhyme, isCorrect: true, color: COLORS[0] },
        ...item.distractors.map((d, j) => ({ id: `w${j}`, label: d, isCorrect: false, color: COLORS[j + 1] }))
      ])
    }));
  }, []);

  return (
    <GameEngine gameId="rhyming-words" gameName="Rhyming Words" category="reading"
      description="Find the word that rhymes!"
      questions={questions} onExit={() => setLocation("/reading")} />
  );
}
