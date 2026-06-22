import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const COLOURS = [
  { name: "Red",    css: "bg-red-500",    ring: "ring-red-400" },
  { name: "Blue",   css: "bg-blue-500",   ring: "ring-blue-400" },
  { name: "Green",  css: "bg-green-500",  ring: "ring-green-400" },
  { name: "Yellow", css: "bg-yellow-400", ring: "ring-yellow-300" },
  { name: "Purple", css: "bg-purple-500", ring: "ring-purple-400" },
  { name: "Orange", css: "bg-orange-500", ring: "ring-orange-400" },
  { name: "Pink",   css: "bg-pink-500",   ring: "ring-pink-400" },
  { name: "Teal",   css: "bg-teal-500",   ring: "ring-teal-400" },
];

function ColourDot({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const c = COLOURS.find(x => x.name === name) ?? COLOURS[0];
  const sz = size === "sm" ? "w-10 h-10" : size === "md" ? "w-16 h-16" : "w-20 h-20";
  return <div className={`${sz} rounded-full ${c.css} shadow-md border-4 border-white/40 flex-shrink-0`} title={name} />;
}

interface PatternDef {
  shown: string[];  // the visible part of the pattern
  answer: string;
  patternCore: string[];
  explanation: string;
}

function makeAB(cols: typeof COLOURS): PatternDef {
  const [a, b] = shuffle(cols).slice(0, 2);
  return {
    shown: [a.name, b.name, a.name, b.name],
    answer: a.name,
    patternCore: [a.name, b.name],
    explanation: `The pattern repeats ${a.name}, ${b.name}. After ${a.name}, ${b.name}, ${a.name}, ${b.name} comes ${a.name} again!`,
  };
}
function makeABB(cols: typeof COLOURS): PatternDef {
  const [a, b] = shuffle(cols).slice(0, 2);
  return {
    shown: [a.name, b.name, b.name, a.name, b.name],
    answer: b.name,
    patternCore: [a.name, b.name, b.name],
    explanation: `The pattern goes ${a.name}, ${b.name}, ${b.name} and repeats. The next colour is ${b.name}.`,
  };
}
function makeAABB(cols: typeof COLOURS): PatternDef {
  const [a, b] = shuffle(cols).slice(0, 2);
  return {
    shown: [a.name, a.name, b.name, b.name, a.name],
    answer: a.name,
    patternCore: [a.name, a.name, b.name, b.name],
    explanation: `The pattern goes ${a.name}, ${a.name}, ${b.name}, ${b.name} and repeats. The next colour is ${a.name}.`,
  };
}
function makeABC(cols: typeof COLOURS): PatternDef {
  const [a, b, c] = shuffle(cols).slice(0, 3);
  return {
    shown: [a.name, b.name, c.name, a.name, b.name],
    answer: c.name,
    patternCore: [a.name, b.name, c.name],
    explanation: `The pattern repeats ${a.name}, ${b.name}, ${c.name}. After ${a.name}, ${b.name} comes ${c.name}!`,
  };
}

const MAKERS = [makeAB, makeAB, makeAB, makeABB, makeAABB, makeABC];

export default function ColourPatterns() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    const seen = new Set<string>();
    const qs: Question[] = [];
    let attempts = 0;
    while (qs.length < 12 && attempts < 80) {
      attempts++;
      const maker = MAKERS[Math.floor(Math.random() * MAKERS.length)];
      const p = maker(COLOURS);
      const key = p.shown.join("-") + "-" + p.answer;
      if (seen.has(key)) continue;
      seen.add(key);

      const wrongCols = shuffle(COLOURS.filter(c => c.name !== p.answer)).slice(0, 3);
      const opts = shuffle([
        { id: "c", label: <ColourDot name={p.answer} size="lg" />, labelText: p.answer, isCorrect: true,  color: "bg-card border-4 border-border flex items-center justify-center" },
        ...wrongCols.map((w, j) => ({ id: `w${j}`, label: <ColourDot name={w.name} size="lg" />, labelText: w.name, isCorrect: false, color: "bg-card border-4 border-border flex items-center justify-center" })),
      ]);

      const questionText = `Pattern: ${p.shown.join(", ")}, ___ — What colour comes next?`;

      qs.push({
        id: `q${qs.length}`,
        questionText,
        explanation: p.explanation,
        prompt: (
          <div className="flex flex-col items-center gap-4">
            <p className="text-2xl font-black text-muted-foreground">What colour comes next?</p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {p.shown.map((name, i) => <ColourDot key={i} name={name} size="md" />)}
              <div className="w-16 h-16 rounded-full border-4 border-dashed border-muted-foreground flex items-center justify-center">
                <span className="text-3xl font-black text-muted-foreground">?</span>
              </div>
            </div>
            <p className="text-lg font-bold text-muted-foreground">{p.shown.join(" → ")} → ___</p>
          </div>
        ),
        options: opts,
      });
    }
    return qs;
  }, []);

  return (
    <GameEngine gameId="colour-patterns" gameName="Colour Patterns 🌈" category="colours"
      description="What colour comes next in the pattern?"
      questions={questions} onExit={() => setLocation("/colours")} />
  );
}
