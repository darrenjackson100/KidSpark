import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const EMOTIONS: { emoji: string; name: string; desc: string; options: string[]; explanation: string }[] = [
  { emoji: "😊", name: "Happy",      desc: "smiling face",      options: ["Happy","Sad","Angry","Scared"],     explanation: "A big smile means someone is happy!" },
  { emoji: "😢", name: "Sad",        desc: "crying face",       options: ["Happy","Sad","Angry","Surprised"],  explanation: "Tears mean someone is feeling sad." },
  { emoji: "😠", name: "Angry",      desc: "cross/angry face",  options: ["Happy","Sad","Angry","Tired"],      explanation: "Frowning eyebrows mean someone is angry." },
  { emoji: "😮", name: "Surprised",  desc: "surprised face",    options: ["Happy","Surprised","Scared","Sad"], explanation: "A wide open mouth means someone is surprised!" },
  { emoji: "😴", name: "Tired",      desc: "sleepy face",       options: ["Happy","Sad","Tired","Angry"],      explanation: "Closed eyes and Z's mean someone is tired." },
  { emoji: "😨", name: "Scared",     desc: "frightened face",   options: ["Happy","Scared","Angry","Sad"],     explanation: "Wide eyes and pale face means someone is scared." },
  { emoji: "😂", name: "Laughing",   desc: "laughing face",     options: ["Laughing","Sad","Angry","Tired"],   explanation: "Tears of joy mean someone is laughing!" },
  { emoji: "🥰", name: "Loved",      desc: "heart-eyes face",   options: ["Happy","Loved","Angry","Tired"],    explanation: "Heart eyes mean someone feels loved!" },
  { emoji: "😎", name: "Cool",       desc: "sunglasses face",   options: ["Cool","Sad","Scared","Tired"],      explanation: "Sunglasses mean someone is feeling cool and confident!" },
  { emoji: "🤒", name: "Sick",       desc: "sick/unwell face",  options: ["Happy","Sick","Angry","Surprised"], explanation: "A thermometer means someone is feeling sick." },
];

const COLORS = ["bg-yellow-500","bg-blue-500","bg-red-500","bg-purple-500"];

export default function HappySad() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(EMOTIONS).slice(0, 10).map((em, i) => ({
      id: `q${i}`,
      questionText: `How is this face feeling?`,
      explanation: em.explanation,
      prompt: (
        <div className="text-center">
          <div className="text-[10rem] leading-none mb-4">{em.emoji}</div>
          <p className="text-3xl font-black text-muted-foreground">How are they feeling?</p>
        </div>
      ),
      options: shuffle(em.options.map((o, j) => ({
        id: o,
        label: o,
        labelText: o,
        isCorrect: o === em.name,
        color: COLORS[j % COLORS.length],
      })))
    }));
  }, []);

  return (
    <GameEngine gameId="happy-sad" gameName="How Do They Feel?" category="reading"
      description="Can you name these feelings and emotions?"
      questions={questions} onExit={() => setLocation("/reading")} />
  );
}
