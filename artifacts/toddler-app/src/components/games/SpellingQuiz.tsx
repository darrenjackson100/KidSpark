import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const SPELLING_WORDS: { hint: string; emoji: string; correct: string; wrong: string[] }[] = [
  { hint: "A large grey animal with a long trunk", emoji: "🐘", correct: "elephant",  wrong: ["elefant","elephent","eliphant"] },
  { hint: "Very pretty to look at",                emoji: "✨", correct: "beautiful", wrong: ["beautifull","beutiful","beautful"] },
  { hint: "The reason why",                         emoji: "🤔", correct: "because",   wrong: ["becuase","becouse","becawse"] },
  { hint: "A flying mammal that comes out at night",emoji: "🦇", correct: "friend",    wrong: ["freind","frend","freiend"] },
  { hint: "A striped big cat",                      emoji: "🐯", correct: "tiger",     wrong: ["tigger","tiegr","tigur"] },
  { hint: "Opposite of loud",                       emoji: "🤫", correct: "quiet",     wrong: ["quite","queit","quiot"] },
  { hint: "More than enough",                       emoji: "😄", correct: "enough",    wrong: ["enuff","enuf","enogh"] },
  { hint: "A flying insect that turns from a caterpillar", emoji:"🦋", correct:"butterfly",wrong:["butterflye","butterfliy","buterflie"] },
  { hint: "A piece of equipment used in school",    emoji: "📐", correct: "ruler",     wrong: ["rulur","ruller","rooler"] },
  { hint: "To move through water",                  emoji: "🏊", correct: "swimming",  wrong: ["swiming","swimimg","swimminng"] },
  { hint: "A building where sick people go",        emoji: "🏥", correct: "hospital",  wrong: ["hospitel","hospitle","hospetal"] },
  { hint: "Days, months, and years",                emoji: "📅", correct: "calendar",  wrong: ["calender","calander","calandar"] },
];

export default function SpellingQuiz() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(SPELLING_WORDS).slice(0, 10).map((w, i) => ({
      id: `q${i}`,
      questionText: `Which is the correct spelling? (${w.hint})`,
      explanation: `The correct spelling is "${w.correct}".`,
      prompt: (
        <div className="text-center">
          <div className="text-8xl mb-5">{w.emoji}</div>
          <p className="text-3xl font-black text-muted-foreground leading-snug">{w.hint}</p>
          <p className="text-2xl font-bold text-muted-foreground mt-3">Which spelling is correct?</p>
        </div>
      ),
      options: shuffle([
        { id: "c", label: w.correct, labelText: w.correct, isCorrect: true, color: "bg-green-500" },
        ...w.wrong.map((s, j) => ({ id: `w${j}`, label: s, labelText: s, isCorrect: false, color: ["bg-blue-500","bg-orange-500","bg-purple-500"][j] }))
      ])
    }));
  }, []);

  return (
    <GameEngine gameId="spelling-quiz" gameName="Spelling Challenge" category="reading"
      description="Can you pick the correct spelling?"
      questions={questions} onExit={() => setLocation("/reading")} />
  );
}
