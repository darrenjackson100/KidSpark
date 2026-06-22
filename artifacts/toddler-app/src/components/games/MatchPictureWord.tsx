import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { useAppContext } from "@/context/AppContext";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const EASY = [
  { word: "cat",  emoji: "🐱" }, { word: "dog",  emoji: "🐶" }, { word: "sun",  emoji: "☀️" },
  { word: "hat",  emoji: "🎩" }, { word: "cup",  emoji: "☕" }, { word: "bee",  emoji: "🐝" },
  { word: "egg",  emoji: "🥚" }, { word: "pig",  emoji: "🐷" }, { word: "hen",  emoji: "🐔" },
  { word: "log",  emoji: "🪵" }, { word: "bug",  emoji: "🐛" }, { word: "fan",  emoji: "🌀" },
];
const MEDIUM = [
  { word: "frog",  emoji: "🐸" }, { word: "cake",  emoji: "🎂" }, { word: "bird",  emoji: "🐦" },
  { word: "fish",  emoji: "🐟" }, { word: "kite",  emoji: "🪁" }, { word: "star",  emoji: "⭐" },
  { word: "tree",  emoji: "🌳" }, { word: "duck",  emoji: "🦆" }, { word: "drum",  emoji: "🥁" },
  { word: "book",  emoji: "📚" }, { word: "flag",  emoji: "🚩" }, { word: "ship",  emoji: "🚢" },
];
const HARD = [
  { word: "elephant",   emoji: "🐘" }, { word: "rainbow",    emoji: "🌈" }, { word: "butterfly",  emoji: "🦋" },
  { word: "mountain",   emoji: "⛰️" }, { word: "octopus",    emoji: "🐙" }, { word: "umbrella",   emoji: "☂️" },
  { word: "telescope",  emoji: "🔭" }, { word: "pineapple",  emoji: "🍍" }, { word: "crocodile",  emoji: "🐊" },
  { word: "volcano",    emoji: "🌋" }, { word: "dolphin",    emoji: "🐬" }, { word: "spaceship",  emoji: "🚀" },
];
const COLORS = ["bg-blue-500","bg-orange-500","bg-green-500","bg-purple-500"];

export default function MatchPictureWord() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "3-4";
  const pool = ageRange === "3-4" ? EASY : ageRange === "5-6" ? MEDIUM : HARD;

  const questions: Question[] = useMemo(() => {
    const items = shuffle(pool).slice(0, 10);
    return items.map((item, i) => {
      const wrongs = shuffle(pool.filter(p => p.word !== item.word)).slice(0, 3);
      return {
        id: `q${i}`,
        questionText: `What word matches the picture?`,
        prompt: (
          <div className="text-center">
            <div className="text-[9rem] leading-none mb-4">{item.emoji}</div>
            <p className="text-3xl font-black text-muted-foreground">What word is this?</p>
          </div>
        ),
        options: shuffle([
          { id: "c", label: item.word, isCorrect: true, color: COLORS[0] },
          ...wrongs.map((w, j) => ({ id: `w${j}`, label: w.word, isCorrect: false, color: COLORS[j + 1] }))
        ])
      };
    });
  }, [pool]);

  return (
    <GameEngine gameId="match-picture-word" gameName="Picture & Word" category="reading"
      description="Look at the picture and find the matching word!"
      questions={questions} onExit={() => setLocation("/reading")} />
  );
}
