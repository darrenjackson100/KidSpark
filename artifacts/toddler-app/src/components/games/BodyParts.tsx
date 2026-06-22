import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const PARTS: { emoji: string; name: string; fact?: string }[] = [
  { emoji: "👁️",  name: "Eye",     fact: "We use our eyes to see" },
  { emoji: "👂",  name: "Ear",     fact: "We use our ears to hear" },
  { emoji: "👃",  name: "Nose",    fact: "We use our nose to smell" },
  { emoji: "👄",  name: "Mouth",   fact: "We use our mouth to eat and talk" },
  { emoji: "🦷",  name: "Teeth",   fact: "We use our teeth to chew food" },
  { emoji: "🤚",  name: "Hand",    fact: "We use our hands to grab things" },
  { emoji: "🦵",  name: "Leg",     fact: "We use our legs to walk and run" },
  { emoji: "🦶",  name: "Foot",    fact: "Our feet help us stand and balance" },
  { emoji: "💪",  name: "Arm",     fact: "Our arms help us lift and reach" },
  { emoji: "🧠",  name: "Brain",   fact: "Our brain controls everything we do" },
  { emoji: "❤️",  name: "Heart",   fact: "Our heart pumps blood around our body" },
  { emoji: "🦴",  name: "Bone",    fact: "Bones give our body its shape" },
];

const COLORS = ["bg-blue-500","bg-orange-500","bg-green-500","bg-purple-500"];

export default function BodyParts() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    const items = shuffle(PARTS).slice(0, 10);
    return items.map((item, i) => {
      const wrongs = shuffle(PARTS.filter(p => p.name !== item.name)).slice(0, 3);
      return {
        id: `q${i}`,
        questionText: `What part of the body is this? ${item.emoji}`,
        prompt: (
          <div className="text-center">
            <div className="text-[9rem] leading-none mb-4">{item.emoji}</div>
            <p className="text-3xl font-black text-muted-foreground">What part of the body is this?</p>
          </div>
        ),
        options: shuffle([
          { id: "c", label: item.name, isCorrect: true, color: COLORS[0] },
          ...wrongs.map((w, j) => ({ id: `w${j}`, label: w.name, isCorrect: false, color: COLORS[j + 1] }))
        ])
      };
    });
  }, []);

  return (
    <GameEngine gameId="body-parts" gameName="Body Parts" category="science"
      description="Can you name the different parts of your body?"
      questions={questions} onExit={() => setLocation("/science")} />
  );
}
