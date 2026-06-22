import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

interface MoneyQ { coins: string; total: string; explanation: string; wrong: string[] }

const QUESTIONS: MoneyQ[] = [
  { coins: "10p + 5p + 2p",            total: "17p",  explanation: "10 + 5 + 2 = 17 pence.",                       wrong: ["15p","12p","20p"] },
  { coins: "50p + 20p",                 total: "70p",  explanation: "50 + 20 = 70 pence.",                          wrong: ["60p","75p","80p"] },
  { coins: "£1 + 50p",                  total: "£1.50",explanation: "One pound plus fifty pence = £1.50.",          wrong: ["£1.20","£2.00","£1.05"] },
  { coins: "£2 + £1 + 50p",            total: "£3.50",explanation: "2 + 1 = 3 pounds, plus 50p = £3.50.",         wrong: ["£3.00","£4.00","£2.50"] },
  { coins: "20p + 20p + 10p + 5p",     total: "55p",  explanation: "20+20+10+5 = 55 pence.",                       wrong: ["45p","50p","60p"] },
  { coins: "£5 + £2 + £1",             total: "£8",   explanation: "5 + 2 + 1 = £8.",                             wrong: ["£6","£7","£9"] },
  { coins: "£10 − spend £3",           total: "£7",   explanation: "£10 take away £3 leaves £7 change.",           wrong: ["£6","£8","£5"] },
  { coins: "3 × 20p",                   total: "60p",  explanation: "3 lots of 20p = 60 pence.",                    wrong: ["50p","70p","40p"] },
  { coins: "£1 + 25p + 10p",           total: "£1.35",explanation: "100p + 25p + 10p = 135p = £1.35.",            wrong: ["£1.30","£1.45","£1.25"] },
  { coins: "£20 − spend £12",          total: "£8",   explanation: "£20 take away £12 = £8 change.",              wrong: ["£6","£10","£9"] },
  { coins: "5p + 5p + 5p + 5p + 5p",  total: "25p",  explanation: "5 × 5p = 25 pence.",                           wrong: ["20p","30p","15p"] },
  { coins: "2 × £5",                   total: "£10",  explanation: "2 lots of £5 = £10.",                         wrong: ["£8","£12","£15"] },
];

export default function MoneyCount() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(QUESTIONS).slice(0, 10).map((q, i) => ({
      id: `q${i}`,
      questionText: `${q.coins} = ?`,
      explanation: q.explanation,
      prompt: (
        <div className="text-center">
          <div className="text-7xl mb-4">💰</div>
          <p className="text-3xl font-black text-foreground mb-3">{q.coins}</p>
          <p className="text-2xl font-bold text-muted-foreground">How much money is this?</p>
        </div>
      ),
      options: shuffle([
        { id: "c", label: q.total, labelText: q.total, isCorrect: true, color: "bg-green-500" },
        ...q.wrong.map((w, j) => ({ id: `w${j}`, label: w, labelText: w, isCorrect: false, color: ["bg-blue-500","bg-orange-500","bg-purple-500"][j] }))
      ])
    }));
  }, []);

  return (
    <GameEngine gameId="money-count" gameName="Money Maths" category="maths"
      description="Count the coins and notes — how much is there?"
      questions={questions} onExit={() => setLocation("/maths")} />
  );
}
