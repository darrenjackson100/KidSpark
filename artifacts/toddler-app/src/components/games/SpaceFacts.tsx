import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const ALL_QUESTIONS: { prompt: React.ReactNode; questionText: string; answer: string; options: string[] }[] = [
  { prompt: <><div className="text-8xl mb-4">🌍</div><p className="text-4xl font-black">Which planet do we live on?</p></>, questionText: "Which planet do we live on?", answer: "Earth", options: ["Earth","Mars","Venus","Jupiter"] },
  { prompt: <><div className="text-8xl mb-4">☀️</div><p className="text-4xl font-black">What is the star at the centre of our solar system?</p></>, questionText: "What is the star at the centre of our solar system?", answer: "The Sun", options: ["The Sun","The Moon","Mars","Saturn"] },
  { prompt: <><div className="text-8xl mb-4">🪐</div><p className="text-4xl font-black">Which planet is the largest?</p></>, questionText: "Which planet is the largest?", answer: "Jupiter", options: ["Jupiter","Saturn","Neptune","Earth"] },
  { prompt: <><div className="text-8xl mb-4">🌙</div><p className="text-4xl font-black">What do we call Earth's natural satellite?</p></>, questionText: "What do we call Earth's natural satellite?", answer: "The Moon", options: ["The Moon","A Star","Mars","Venus"] },
  { prompt: <><div className="text-8xl mb-4">🪐</div><p className="text-4xl font-black">Which planet has famous rings around it?</p></>, questionText: "Which planet has famous rings around it?", answer: "Saturn", options: ["Saturn","Jupiter","Mars","Venus"] },
  { prompt: <><div className="text-8xl mb-4">🔴</div><p className="text-4xl font-black">Which planet is called the Red Planet?</p></>, questionText: "Which planet is called the Red Planet?", answer: "Mars", options: ["Mars","Venus","Mercury","Neptune"] },
  { prompt: <><div className="text-8xl mb-4">🌌</div><p className="text-4xl font-black">What is our galaxy called?</p></>, questionText: "What is our galaxy called?", answer: "Milky Way", options: ["Milky Way","Big Dipper","Cosmos","Andromeda"] },
  { prompt: <><div className="text-8xl mb-4">🔢</div><p className="text-4xl font-black">How many planets are in our solar system?</p></>, questionText: "How many planets are in our solar system?", answer: "8", options: ["8","7","9","10"] },
  { prompt: <><div className="text-8xl mb-4">🚀</div><p className="text-4xl font-black">What is the path a planet travels around the Sun?</p></>, questionText: "What is the path a planet travels around the Sun?", answer: "An orbit", options: ["An orbit","A crater","A galaxy","A comet"] },
  { prompt: <><div className="text-8xl mb-4">⭐</div><p className="text-4xl font-black">What are stars made of?</p></>, questionText: "What are stars made of?", answer: "Hot gas", options: ["Hot gas","Rock","Ice","Water"] },
  { prompt: <><div className="text-8xl mb-4">☄️</div><p className="text-4xl font-black">What is a large ball of ice and rock that travels through space?</p></>, questionText: "What is a large ball of ice and rock that travels through space?", answer: "A comet", options: ["A comet","A planet","A moon","A star"] },
  { prompt: <><div className="text-8xl mb-4">🌍</div><p className="text-4xl font-black">How long does it take Earth to orbit the Sun?</p></>, questionText: "How long does it take Earth to orbit the Sun?", answer: "1 year", options: ["1 year","1 month","1 day","10 years"] },
];
const COLORS = ["bg-blue-500","bg-orange-500","bg-green-500","bg-purple-500"];

export default function SpaceFacts() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(ALL_QUESTIONS).slice(0, 10).map((q, i) => ({
      id: `q${i}`,
      questionText: q.questionText,
      prompt: <div className="text-center">{q.prompt}</div>,
      options: shuffle(q.options.map((o, j) => ({
        id: o === q.answer ? "c" : `w${j}`,
        label: o,
        isCorrect: o === q.answer,
        color: COLORS[j % COLORS.length]
      })))
    }));
  }, []);

  return (
    <GameEngine gameId="space-facts" gameName="Space Explorer" category="science"
      description="How much do you know about space and our solar system?"
      questions={questions} onExit={() => setLocation("/science")} />
  );
}
