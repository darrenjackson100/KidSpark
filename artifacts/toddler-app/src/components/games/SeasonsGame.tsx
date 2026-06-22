import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const CLUES: { text: string; emojis: string; season: string }[] = [
  { emojis: "❄️⛄🌨️",  text: "Snow is on the ground. Trees are bare.",              season: "Winter" },
  { emojis: "🌸🐣🌦️",  text: "Flowers begin to bloom. Baby animals are born.",     season: "Spring" },
  { emojis: "☀️🏖️🌊",  text: "It is hot and sunny. Children swim outside.",        season: "Summer" },
  { emojis: "🍂🍁🎃",  text: "Leaves turn red and orange. They fall from trees.",  season: "Autumn" },
  { emojis: "⛷️🧤🏔️",  text: "People wear scarves and gloves. It is very cold.",   season: "Winter" },
  { emojis: "🌷🦋🌱",  text: "Seeds start to grow. It rains a lot.",               season: "Spring" },
  { emojis: "🍦🌴👒",  text: "Days are long and bright. We eat ice cream.",        season: "Summer" },
  { emojis: "🍄🌰🦔",  text: "Animals prepare for winter. Squirrels gather nuts.", season: "Autumn" },
];

const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];
const COLORS = ["bg-green-500","bg-orange-500","bg-blue-500","bg-purple-500"];

export default function SeasonsGame() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(CLUES).slice(0, 8).map((clue, i) => {
      const wrongs = SEASONS.filter(s => s !== clue.season);
      return {
        id: `q${i}`,
        questionText: `Which season is this? "${clue.text}"`,
        prompt: (
          <div className="text-center">
            <div className="text-6xl mb-4">{clue.emojis}</div>
            <p className="text-3xl font-black text-foreground mb-2">Which season is this?</p>
            <p className="text-2xl font-bold text-muted-foreground">"{clue.text}"</p>
          </div>
        ),
        options: shuffle([
          { id: "c", label: clue.season, isCorrect: true, color: COLORS[0] },
          ...wrongs.map((w, j) => ({ id: `w${j}`, label: w, isCorrect: false, color: COLORS[j + 1] }))
        ])
      };
    });
  }, []);

  return (
    <GameEngine gameId="seasons-game" gameName="Four Seasons" category="science"
      description="Match the clues to the right season!"
      questions={questions} onExit={() => setLocation("/science")} />
  );
}
