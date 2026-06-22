import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { buildUniqueQuestions } from "@/lib/dedup";
import { useAppContext } from "@/context/AppContext";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const COLORS = [
  { name: "Red", bg: "bg-red-500", hex: "#ef4444" },
  { name: "Blue", bg: "bg-blue-500", hex: "#3b82f6" },
  { name: "Yellow", bg: "bg-yellow-400", hex: "#facc15" },
  { name: "Green", bg: "bg-green-500", hex: "#22c55e" },
  { name: "Orange", bg: "bg-orange-500", hex: "#f97316" },
  { name: "Purple", bg: "bg-purple-500", hex: "#a855f7" },
  { name: "Pink", bg: "bg-pink-500", hex: "#ec4899" },
  { name: "Brown", bg: "bg-[#92400e]", hex: "#92400e" },
];

const SHAPES = [
  { emoji: "●", label: "Circle" },
  { emoji: "■", label: "Square" },
  { emoji: "▲", label: "Triangle" },
  { emoji: "★", label: "Star" },
];

export default function ColorMatch() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "3-4";
  const useShapes = ageRange === "5-6" || ageRange === "7-8";
  const pool = ageRange === "3-4" ? COLORS.slice(0, 5) : COLORS;

  const questions: Question[] = useMemo(() => {
    const shuffled = shuffle(pool);
    return buildUniqueQuestions(10, (i) => {
      const correct = shuffled[i % shuffled.length];
      const wrongs = shuffle(pool.filter(c => c.name !== correct.name)).slice(0, 3);
      const shape = useShapes ? SHAPES[i % SHAPES.length] : null;

      return {
        id: `q${i}`,
        questionText: shape ? `What colour is this ${shape.label}?` : `What colour is this?`,
        prompt: (
          <div className="text-center">
            {shape ? (
              <>
                <div
                  className="text-[8rem] leading-none mb-4 mx-auto"
                  style={{ color: correct.hex }}
                >
                  {shape.emoji}
                </div>
                <p className="text-3xl font-black text-muted-foreground">What colour is this {shape.label}?</p>
              </>
            ) : (
              <>
                <div className={`w-48 h-48 rounded-[2rem] mx-auto mb-6 shadow-xl ${correct.bg}`} />
                <p className="text-3xl font-black text-muted-foreground">What colour is this?</p>
              </>
            )}
          </div>
        ),
        options: shuffle([
          { id: "c", label: correct.name, isCorrect: true, color: correct.bg },
          ...wrongs.map((w, j) => ({ id: `w${j}`, label: w.name, isCorrect: false, color: w.bg }))
        ])
      };
    });
  }, [pool, useShapes]);

  return (
    <GameEngine
      gameId="color-match"
      gameName="Colour Match"
      category="maths"
      description="Look at the colour and pick the right name!"
      questions={questions}
      onExit={() => setLocation("/maths")}
    />
  );
}
