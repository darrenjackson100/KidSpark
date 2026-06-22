import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const WORDS: { emoji: string; word: string; blank: number; hint: string }[] = [
  { emoji: "🐱", word: "CAT",      blank: 0, hint: "a small pet that meows" },
  { emoji: "🐶", word: "DOG",      blank: 1, hint: "a pet that barks" },
  { emoji: "🐸", word: "FROG",     blank: 2, hint: "a green animal that jumps" },
  { emoji: "🐔", word: "HEN",      blank: 0, hint: "a farm bird that lays eggs" },
  { emoji: "🐷", word: "PIG",      blank: 1, hint: "a farm animal that oinks" },
  { emoji: "🐝", word: "BEE",      blank: 1, hint: "an insect that makes honey" },
  { emoji: "🦁", word: "LION",     blank: 2, hint: "the king of the jungle" },
  { emoji: "🐠", word: "FISH",     blank: 1, hint: "an animal that swims" },
  { emoji: "🦆", word: "DUCK",     blank: 1, hint: "a bird that quacks" },
  { emoji: "🐢", word: "TORTOISE", blank: 4, hint: "a slow animal with a shell" },
  { emoji: "🐑", word: "SHEEP",    blank: 3, hint: "a fluffy farm animal" },
  { emoji: "🐻", word: "BEAR",     blank: 2, hint: "a big furry animal" },
  { emoji: "🦊", word: "FOX",      blank: 1, hint: "a clever orange animal" },
  { emoji: "🌸", word: "ROSE",     blank: 2, hint: "a beautiful flower" },
  { emoji: "☀️", word: "SUN",      blank: 0, hint: "it shines in the sky" },
  { emoji: "🌙", word: "MOON",     blank: 1, hint: "it shines at night" },
];

const ALL_LETTERS = "ABCDEFGHIJKLMNOPRSTUW".split("");

export default function MissingLetterWords() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(WORDS).slice(0, 10).map((w, i) => {
      const letters = w.word.split("");
      const missing = letters[w.blank];
      const displayed = letters.map((l, idx) => idx === w.blank ? "_" : l).join(" ");
      const wrongs = shuffle(ALL_LETTERS.filter(l => l !== missing)).slice(0, 3);

      return {
        id: `q${i}`,
        questionText: `${displayed} — Fill in the missing letter (${w.hint})`,
        explanation: `The word is ${w.word}. The missing letter is ${missing}.`,
        prompt: (
          <div className="text-center">
            <div className="text-[7rem] leading-none mb-3">{w.emoji}</div>
            <div className="text-6xl font-black tracking-widest text-foreground mb-2">{displayed}</div>
            <p className="text-2xl font-bold text-muted-foreground">What is the missing letter?</p>
          </div>
        ),
        options: shuffle([
          { id: "c", label: missing, labelText: missing, isCorrect: true, color: "bg-green-500" },
          ...wrongs.map((l, j) => ({ id: `w${j}`, label: l, labelText: l, isCorrect: false, color: ["bg-blue-500","bg-orange-500","bg-purple-500"][j] }))
        ])
      };
    });
  }, []);

  return (
    <GameEngine gameId="missing-letter" gameName="Missing Letter" category="reading"
      description="Fill in the missing letter to complete the word!"
      questions={questions} onExit={() => setLocation("/reading")} />
  );
}
