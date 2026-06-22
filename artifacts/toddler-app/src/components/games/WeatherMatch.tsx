import React, { useMemo } from "react";
import { useLocation } from "wouter";
import GameEngine, { Question } from "./GameEngine";

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }

const WEATHER = [
  { emoji: "☀️", name: "Sunny",   others: ["Rainy","Snowy","Cloudy"] },
  { emoji: "🌧️", name: "Rainy",   others: ["Sunny","Snowy","Windy"] },
  { emoji: "❄️", name: "Snowy",   others: ["Sunny","Rainy","Cloudy"] },
  { emoji: "⛅", name: "Cloudy",  others: ["Sunny","Rainy","Snowy"] },
  { emoji: "⛈️", name: "Stormy",  others: ["Sunny","Rainy","Cloudy"] },
  { emoji: "🌬️", name: "Windy",   others: ["Sunny","Rainy","Snowy"] },
  { emoji: "🌫️", name: "Foggy",   others: ["Sunny","Rainy","Cloudy"] },
  { emoji: "🌈", name: "Rainbow", others: ["Sunny","Rainy","Cloudy"] },
  { emoji: "🌩️", name: "Thunder", others: ["Sunny","Rainy","Cloudy"] },
  { emoji: "🌦️", name: "Showers", others: ["Sunny","Cloudy","Windy"] },
];
const COLORS = ["bg-blue-500","bg-orange-500","bg-green-500","bg-purple-500"];

export default function WeatherMatch() {
  const [, setLocation] = useLocation();

  const questions: Question[] = useMemo(() => {
    return shuffle(WEATHER).slice(0, 10).map((w, i) => ({
      id: `q${i}`,
      questionText: `What is this weather? ${w.emoji}`,
      prompt: (
        <div className="text-center">
          <div className="text-[10rem] leading-none mb-4">{w.emoji}</div>
          <p className="text-3xl font-black text-muted-foreground">What is this weather?</p>
        </div>
      ),
      options: shuffle([
        { id: "c", label: w.name, isCorrect: true, color: COLORS[0] },
        ...w.others.map((o, j) => ({ id: `w${j}`, label: o, isCorrect: false, color: COLORS[j + 1] }))
      ])
    }));
  }, []);

  return (
    <GameEngine gameId="weather-match" gameName="Weather Watch" category="science"
      description="Can you name all the different types of weather?"
      questions={questions} onExit={() => setLocation("/science")} />
  );
}
