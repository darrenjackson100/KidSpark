import React, { useMemo } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "@/context/AppContext";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Concrete dots: filled circles for the known amount, dashed empty circles for
// the part the child has to work out. Only used for the younger age groups.
function Dots({ filled, empty }: { filled: number; empty: number }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center max-w-[320px]">
      {Array.from({ length: filled }).map((_, i) => (
        <div key={`f${i}`} className="w-7 h-7 rounded-full bg-primary shadow-md" />
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <div key={`e${i}`} className="w-7 h-7 rounded-full border-4 border-dashed border-muted-foreground" />
      ))}
    </div>
  );
}

function EmptyBox() {
  return (
    <span className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-2xl border-4 border-dashed border-primary bg-primary/10 text-primary">
      ?
    </span>
  );
}

interface BondConfig { targets: number[]; showDots: boolean; allowBoxFirst: boolean; }

function configFor(age: "3-4" | "5-6" | "7-8"): BondConfig {
  if (age === "3-4") return { targets: [5], showDots: true, allowBoxFirst: false };
  if (age === "5-6") return { targets: [5, 10], showDots: true, allowBoxFirst: false };
  return { targets: [10, 20], showDots: false, allowBoxFirst: true };
}

function buildQuestion(target: number, allowBoxFirst: boolean, showDots: boolean, i: number): Question {
  const a = randInt(1, target - 1);
  const b = target - a;
  const boxFirst = allowBoxFirst && Math.random() < 0.4;
  const missing = boxFirst ? a : b;
  const known = boxFirst ? b : a;

  const distractors = shuffle(
    Array.from({ length: target + 1 }, (_, k) => k).filter(n => n !== missing && n >= 0 && n <= target),
  ).slice(0, 3);

  const questionText = boxFirst
    ? `What number plus ${known} equals ${target}?`
    : `${known} plus what number equals ${target}?`;

  return {
    id: `q${i}`,
    questionText,
    explanation: `${a} + ${b} = ${target}.`,
    prompt: (
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-2 sm:gap-3 text-4xl sm:text-5xl font-black text-foreground">
          {boxFirst ? <EmptyBox /> : <span>{known}</span>}
          <span>+</span>
          {boxFirst ? <span>{known}</span> : <EmptyBox />}
          <span>=</span>
          <span>{target}</span>
        </div>
        {showDots && target <= 10 && <Dots filled={known} empty={missing} />}
        <p className="text-xl sm:text-2xl font-bold text-muted-foreground">What is the missing number?</p>
      </div>
    ),
    options: shuffle([
      { id: "c", label: String(missing), labelText: String(missing), isCorrect: true, color: "bg-green-500" },
      ...distractors.map((n, j) => ({ id: `w${j}`, label: String(n), labelText: String(n), isCorrect: false, color: ["bg-blue-500", "bg-orange-500", "bg-purple-500"][j] })),
    ]),
  };
}

function buildBonds(cfg: BondConfig): Question[] {
  const out: Question[] = [];
  for (let i = 0; i < 10; i++) {
    const target = cfg.targets[i % cfg.targets.length];
    out.push(buildQuestion(target, cfg.allowBoxFirst, cfg.showDots, i));
  }
  return shuffle(out);
}

export default function NumberBonds() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();
  const age = activeProfile?.ageRange ?? "5-6";
  const cfg = useMemo(() => configFor(age), [age]);
  const questions: Question[] = useMemo(() => buildBonds(cfg), [cfg]);

  const label = cfg.targets.join(" & ");
  return (
    <GameEngine gameId="number-bonds" gameName={`Number Bonds to ${label}`} category="maths"
      description={`Fill the box to make ${label}!`}
      questions={questions} onExit={() => setLocation("/maths")} />
  );
}
