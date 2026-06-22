import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";
import { useAppContext } from "@/context/AppContext";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const EASY_Q = [
  { sentence: "The dog can ___ fast.", answer: "run",   opts: ["run","big","blue","fly"] },
  { sentence: "The cat sat on the ___.", answer: "mat",  opts: ["mat","run","big","fly"] },
  { sentence: "I can see a big ___.", answer: "sun",   opts: ["sun","fly","run","big"] },
  { sentence: "The frog likes to ___.", answer: "jump",  opts: ["jump","cake","blue","run"] },
  { sentence: "The bird can ___.", answer: "fly",   opts: ["fly","big","run","sun"] },
  { sentence: "The fish lives in the ___.", answer: "sea",   opts: ["sea","fly","big","run"] },
  { sentence: "I put on my ___ to go out.", answer: "coat",  opts: ["coat","big","run","fly"] },
  { sentence: "The bear likes to ___.", answer: "sleep",  opts: ["sleep","run","big","blue"] },
];

const HARD_Q = [
  { sentence: "The rabbit quickly ran into the ___.", answer: "garden",    opts: ["garden","pencil","moon","school"] },
  { sentence: "She opened her ___ to stay dry in the rain.", answer: "umbrella", opts: ["umbrella","pencil","cloud","sky"] },
  { sentence: "The knight wore shining ___ into battle.", answer: "armour",    opts: ["armour","pencil","moon","sky"] },
  { sentence: "The children played on the ___ at school.", answer: "playground",opts: ["playground","pencil","moon","sky"] },
  { sentence: "The lion gave a mighty ___.", answer: "roar",      opts: ["roar","pencil","moon","sky"] },
  { sentence: "The astronaut floated in ___.", answer: "space",     opts: ["space","pencil","moon","river"] },
  { sentence: "The caterpillar turned into a ___.", answer: "butterfly", opts: ["butterfly","pencil","cloud","rock"] },
  { sentence: "We need ___ to breathe and live.", answer: "oxygen",    opts: ["oxygen","pencil","moon","sand"] },
  { sentence: "The detective looked for important ___.", answer: "clues",     opts: ["clues","pencil","moon","sky"] },
  { sentence: "The scientist did an ___ in the lab.", answer: "experiment",opts: ["experiment","pencil","moon","sky"] },
];

const COLORS = ["bg-blue-500","bg-orange-500","bg-green-500","bg-purple-500"];

export default function FillInWord() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "5-6";
  const pool = ageRange === "7-8" ? HARD_Q : EASY_Q;

  const questions: Question[] = useMemo(() => {
    const items = shuffle(pool).slice(0, 10);
    return items.map((item, i) => {
      const displaySentence = item.sentence.replace("___", "___");
      return {
        id: `q${i}`,
        questionText: `Complete the sentence: ${item.sentence.replace("___", "blank")}`,
        prompt: (
          <div className="text-center px-4">
            <p className="text-3xl font-black text-muted-foreground mb-4">Complete the sentence:</p>
            <p className="text-4xl md:text-5xl font-black text-foreground leading-snug">
              {item.sentence.split("___").map((part, j, arr) => (
                <React.Fragment key={j}>
                  {part}
                  {j < arr.length - 1 && <span className="text-primary underline decoration-4">___</span>}
                </React.Fragment>
              ))}
            </p>
          </div>
        ),
        options: shuffle(item.opts.map((o, j) => ({
          id: j === 0 ? "c" : `w${j}`,
          label: o,
          isCorrect: o === item.answer,
          color: COLORS[j % COLORS.length]
        })))
      };
    });
  }, [pool]);

  return (
    <GameEngine gameId="fill-in-word" gameName="Fill in the Word" category="reading"
      description="Pick the missing word to complete the sentence!"
      questions={questions} onExit={() => setLocation("/reading")} />
  );
}
