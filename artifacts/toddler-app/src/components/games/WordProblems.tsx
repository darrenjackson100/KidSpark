import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const PROBLEMS: { text: string; emoji: string; answer: number; explanation: string }[] = [
  { text: "Tom has 8 apples. He eats 3. How many are left?",                     emoji: "🍎", answer: 5,   explanation: "8 − 3 = 5. Tom has 5 apples left." },
  { text: "There are 4 bags with 3 sweets in each. How many sweets in total?",   emoji: "🍬", answer: 12,  explanation: "4 × 3 = 12 sweets altogether." },
  { text: "Lily has 15 stickers. She gives 7 away. How many does she have left?",emoji: "⭐", answer: 8,   explanation: "15 − 7 = 8 stickers remaining." },
  { text: "A class has 24 children split into 4 equal groups. How many in each?",emoji: "👦", answer: 6,   explanation: "24 ÷ 4 = 6 children in each group." },
  { text: "There are 5 tables, each with 6 chairs. How many chairs altogether?", emoji: "🪑", answer: 30,  explanation: "5 × 6 = 30 chairs in total." },
  { text: "Sam reads 9 pages a day for 7 days. How many pages does he read?",    emoji: "📖", answer: 63,  explanation: "9 × 7 = 63 pages read in a week." },
  { text: "A baker makes 36 buns. He packs them in boxes of 9. How many boxes?", emoji: "🧁", answer: 4,   explanation: "36 ÷ 9 = 4 boxes of buns." },
  { text: "Maya has £20. She buys a book for £7. How much change does she get?", emoji: "💰", answer: 13,  explanation: "£20 − £7 = £13 change." },
  { text: "There are 12 eggs in a box. 5 are cracked. How many are good?",       emoji: "🥚", answer: 7,   explanation: "12 − 5 = 7 good eggs left." },
  { text: "A plant grows 3 cm each week for 8 weeks. How tall is it?",           emoji: "🌱", answer: 24,  explanation: "3 × 8 = 24 cm tall." },
  { text: "Jake saves £5 every week for 6 weeks. How much has he saved?",        emoji: "🐷", answer: 30,  explanation: "5 × 6 = £30 saved." },
  { text: "56 pupils are split into 7 equal teams. How many in each team?",      emoji: "⚽", answer: 8,   explanation: "56 ÷ 7 = 8 pupils per team." },
];

export default function WordProblems() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(PROBLEMS).slice(0, 10).map((p, i) => {
      const wrongs = shuffle(
        Array.from(new Set([-3,-2,-1,1,2,3,5].map(d => p.answer + d).filter(n => n > 0 && n !== p.answer)))
      ).slice(0, 3);
      return {
        id: `q${i}`,
        questionText: p.text,
        explanation: p.explanation,
        prompt: (
          <div className="text-center">
            <div className="text-7xl mb-5">{p.emoji}</div>
            <p className="text-2xl font-black text-foreground leading-snug">{p.text}</p>
          </div>
        ),
        options: shuffle([
          { id: "c", label: String(p.answer), labelText: String(p.answer), isCorrect: true, color: "bg-green-500" },
          ...wrongs.map((n, j) => ({ id: `w${j}`, label: String(n), labelText: String(n), isCorrect: false, color: ["bg-blue-500","bg-orange-500","bg-purple-500"][j] }))
        ])
      };
    });
  }, []);

  return (
    <GameEngine gameId="word-problems" gameName="Word Problems" category="maths"
      description="Read the problem carefully, then find the answer!"
      questions={questions} onExit={() => setLocation("/maths")} />
  );
}
