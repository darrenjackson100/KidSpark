import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

function ShapeSVG({ shape }: { shape: string }) {
  const s = 120;
  const shapeMap: Record<string, React.ReactNode> = {
    Circle:    <circle cx={s/2} cy={s/2} r={s/2-6} fill="hsl(220 80% 55%)" />,
    Square:    <rect x={10} y={10} width={s-20} height={s-20} fill="hsl(30 90% 55%)" />,
    Triangle:  <polygon points={`${s/2},8 ${s-8},${s-8} 8,${s-8}`} fill="hsl(140 60% 45%)" />,
    Rectangle: <rect x={6} y={25} width={s-12} height={s-50} fill="hsl(270 70% 55%)" />,
    Diamond:   <polygon points={`${s/2},8 ${s-8},${s/2} ${s/2},${s-8} 8,${s/2}`} fill="hsl(350 75% 55%)" />,
    Star:      <polygon points={`${s/2},8 ${s/2+12},${s/2-10} ${s-8},${s/2-10} ${s/2+18},${s/2+8} ${s/2+8},${s-8} ${s/2},${s/2+18} ${s/2-8},${s-8} ${s/2-18},${s/2+8} 8,${s/2-10} ${s/2-12},${s/2-10}`} fill="hsl(50 95% 50%)" />,
    Oval:      <ellipse cx={s/2} cy={s/2} rx={s/2-8} ry={s/2-24} fill="hsl(185 65% 45%)" />,
    Pentagon:  <polygon points={`${s/2},8 ${s-10},${s/2-8} ${s-20},${s-10} ${20},${s-10} ${10},${s/2-8}`} fill="hsl(320 65% 50%)" />,
    Hexagon:   <polygon points={`${s/2},8 ${s-10},${s/2-12} ${s-10},${s/2+12} ${s/2},${s-8} 10,${s/2+12} 10,${s/2-12}`} fill="hsl(160 60% 45%)" />,
  };
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="drop-shadow-lg">
      {shapeMap[shape] ?? <circle cx={s/2} cy={s/2} r={s/2-6} fill="hsl(220 80% 55%)" />}
    </svg>
  );
}

const SHAPES_EASY = ["Circle","Square","Triangle","Star"];
const SHAPES_ALL = ["Circle","Square","Triangle","Rectangle","Diamond","Star","Oval","Pentagon","Hexagon"];
const COLORS = ["bg-blue-500","bg-orange-500","bg-green-500","bg-purple-500"];

export default function ShapeSorting() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    const shapes = shuffle(SHAPES_ALL).slice(0, 10);
    return shapes.map((correct, i) => {
      const wrongs = shuffle(SHAPES_ALL.filter(s => s !== correct)).slice(0, 3);
      return {
        id: `q${i}`,
        questionText: `What shape is this?`,
        prompt: (
          <div className="text-center flex flex-col items-center">
            <ShapeSVG shape={correct} />
            <p className="text-3xl font-black text-muted-foreground mt-4">What shape is this?</p>
          </div>
        ),
        options: shuffle([
          { id: "c", label: correct, isCorrect: true, color: COLORS[0] },
          ...wrongs.map((w, j) => ({ id: `w${j}`, label: w, isCorrect: false, color: COLORS[j + 1] }))
        ])
      };
    });
  }, []);

  return (
    <GameEngine gameId="shape-sorting" gameName="Shape Sorting" category="colours"
      description="Can you name all the different shapes?"
      questions={questions} onExit={() => setLocation("/colours")} />
  );
}
