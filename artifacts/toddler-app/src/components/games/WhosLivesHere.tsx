import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";

type AgeRange = "3-4" | "5-6" | "7-8";
type HabitatName = "Farm" | "Ocean" | "Jungle" | "Sky" | "Bugs";

interface Animal {
  emoji: string;
  name: string;
  category: HabitatName;
}

interface Habitat {
  name: HabitatName;
  image: string;
  clue: string;
  fact: string;
  animals: Animal[];
}

interface RoundAnimal extends Animal {
  id: string;
}

interface RoundState {
  habitat: Habitat;
  animals: RoundAnimal[];
  correctCount: number;
}

const HABITATS: Habitat[] = [
  {
    name: "Farm",
    image: "Farm.png",
    clue: "Who lives on the farm?",
    fact: "Farm animals often live close to people and help us with food, wool, or work.",
    animals: [
      { emoji: "🐮", name: "Cow", category: "Farm" },
      { emoji: "🐷", name: "Pig", category: "Farm" },
      { emoji: "🐑", name: "Sheep", category: "Farm" },
      { emoji: "🐔", name: "Chicken", category: "Farm" },
      { emoji: "🐴", name: "Horse", category: "Farm" },
      { emoji: "🐄", name: "Cow", category: "Farm" },
    ],
  },
  {
    name: "Ocean",
    image: "Ocean.png",
    clue: "Who lives in the ocean?",
    fact: "Ocean animals live in salty water and many of them swim, float, or crawl along the sea floor.",
    animals: [
      { emoji: "🐬", name: "Dolphin", category: "Ocean" },
      { emoji: "🐳", name: "Whale", category: "Ocean" },
      { emoji: "🦈", name: "Shark", category: "Ocean" },
      { emoji: "🐙", name: "Octopus", category: "Ocean" },
      { emoji: "🐠", name: "Fish", category: "Ocean" },
      { emoji: "🦞", name: "Lobster", category: "Ocean" },
    ],
  },
  {
    name: "Jungle",
    image: "Jungle.png",
    clue: "Who lives in the jungle?",
    fact: "Jungles are warm, leafy places where many animals climb, hide, and hunt.",
    animals: [
      { emoji: "🐒", name: "Monkey", category: "Jungle" },
      { emoji: "🦍", name: "Gorilla", category: "Jungle" },
      { emoji: "🐯", name: "Tiger", category: "Jungle" },
      { emoji: "🐍", name: "Snake", category: "Jungle" },
      { emoji: "🐊", name: "Crocodile", category: "Jungle" },
      { emoji: "🐆", name: "Leopard", category: "Jungle" },
    ],
  },
  {
    name: "Sky",
    image: "Sky.png",
    clue: "Who belongs in the sky?",
    fact: "Many sky animals have wings, feathers, or special bodies that help them fly.",
    animals: [
      { emoji: "🦅", name: "Eagle", category: "Sky" },
      { emoji: "🦆", name: "Duck", category: "Sky" },
      { emoji: "🦜", name: "Parrot", category: "Sky" },
      { emoji: "🦚", name: "Peacock", category: "Sky" },
      { emoji: "🐦", name: "Bird", category: "Sky" },
      { emoji: "🦉", name: "Owl", category: "Sky" },
    ],
  },
  {
    name: "Bugs",
    image: "Bugs.png",
    clue: "Who lives with the bugs?",
    fact: "Bugs are small creatures. Many have tiny legs, wings, feelers, or hard shells.",
    animals: [
      { emoji: "🐝", name: "Bee", category: "Bugs" },
      { emoji: "🐞", name: "Ladybird", category: "Bugs" },
      { emoji: "🦋", name: "Butterfly", category: "Bugs" },
      { emoji: "🐜", name: "Ant", category: "Bugs" },
      { emoji: "🪲", name: "Beetle", category: "Bugs" },
      { emoji: "🦗", name: "Cricket", category: "Bugs" },
    ],
  },
];

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function difficulty(ageRange: AgeRange) {
  if (ageRange === "3-4") return { correct: 3, wrong: 1, showNames: false };
  if (ageRange === "5-6") return { correct: 4, wrong: 2, showNames: true };
  return { correct: 6, wrong: 3, showNames: true };
}

function createRound(ageRange: AgeRange): RoundState {
  const habitat = shuffle(HABITATS)[0];
  const settings = difficulty(ageRange);
  const correct = shuffle(habitat.animals).slice(0, settings.correct);

  const wrongPool = shuffle(
    HABITATS
      .filter(group => group.name !== habitat.name)
      .flatMap(group => group.animals)
  ).slice(0, settings.wrong);

  const animals = shuffle([...correct, ...wrongPool]).map((animal, index) => ({
    ...animal,
    id: `${Date.now()}-${index}-${animal.category}-${animal.name}`,
  }));

  return {
    habitat,
    animals,
    correctCount: correct.length,
  };
}

export default function WhoLivesHere() {
  const [, setLocation] = useLocation();
  const { activeProfile, addGameResult } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "5-6";
  const settings = difficulty(ageRange);

  const [round, setRound] = useState<RoundState>(() => createRound(ageRange));
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [message, setMessage] = useState("Drag the animals into the right home!");
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const imageBase = useMemo(() => import.meta.env.BASE_URL.replace(/\/?$/, "/"), []);
  const habitatImage = `${imageBase}who-lives-here/${round.habitat.image}`;
  const placedAnimals = round.animals.filter(animal => placedIds.includes(animal.id));
  const trayAnimals = round.animals.filter(animal => !placedIds.includes(animal.id));

  useEffect(() => {
    if (!activeProfile) setLocation("/");
  }, [activeProfile, setLocation]);

  useEffect(() => {
    setRound(createRound(ageRange));
    setPlacedIds([]);
    setWrongAttempts(0);
    setMessage("Drag the animals into the right home!");
    setWrongId(null);
    setFinished(false);
  }, [ageRange]);

  if (!activeProfile) return null;

  const finishRound = (nextPlacedIds: string[]) => {
    const score = Math.max(0, round.correctCount - wrongAttempts);
    const pct = score / round.correctCount;
    const stars = pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : 1;

    addGameResult({
      childId: activeProfile.id,
      gameId: "who-lives-here",
      gameName: "Who Lives Here?",
      category: "animals",
      score,
      total: round.correctCount,
      stars,
    });

    setPlacedIds(nextPlacedIds);
    setFinished(true);
    sounds.celebrate();
    setMessage(`Great job! You found all the ${round.habitat.name.toLowerCase()} animals!`);
  };

  const handleDropAnimal = (id: string) => {
    if (finished || placedIds.includes(id)) return;
    const animal = round.animals.find(item => item.id === id);
    if (!animal) return;

    if (animal.category === round.habitat.name) {
      const nextPlacedIds = [...placedIds, id];
      const correctPlaced = round.animals.filter(item =>
        item.category === round.habitat.name && nextPlacedIds.includes(item.id)
      ).length;

      sounds.correct();

      if (correctPlaced >= round.correctCount) {
        finishRound(nextPlacedIds);
      } else {
        setPlacedIds(nextPlacedIds);
        setMessage(`Yes! ${animal.name} lives here.`);
      }
    } else {
      sounds.wrong();
      setWrongAttempts(count => count + 1);
      setWrongId(id);
      setMessage(`${animal.name} lives somewhere else. Try another animal!`);
      window.setTimeout(() => setWrongId(null), 550);
    }
  };

  const nextRound = () => {
    setRound(createRound(ageRange));
    setPlacedIds([]);
    setWrongAttempts(0);
    setMessage("Drag the animals into the right home!");
    setWrongId(null);
    setFinished(false);
    sounds.pop();
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-5 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-3 sm:gap-5 mb-5 bg-card rounded-[2rem] p-4 sm:p-6 border-4 border-card-border shadow-md">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.click(); setLocation("/animals"); }}
            className="h-12 sm:h-16 px-4 sm:px-6 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground font-black text-base sm:text-xl border-4 border-border transition-colors"
          >
            ← Back
          </motion.button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-foreground leading-tight">Who Lives Here?</h1>
            <p className="text-base sm:text-xl font-bold text-muted-foreground">{round.habitat.clue}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-5">
          <section
            data-drop-zone="habitat"
            className="relative overflow-hidden rounded-[2rem] border-4 border-card-border shadow-2xl min-h-[360px] sm:min-h-[460px] bg-muted"
          >
            <img src={habitatImage} alt={`${round.habitat.name} habitat`} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/5" />

            <div className="absolute left-4 right-4 top-4 flex flex-wrap items-center justify-between gap-3">
              <div className="rounded-2xl bg-white/90 border-4 border-white px-4 py-2 shadow-md">
                <p className="text-lg sm:text-2xl font-black text-foreground">{round.habitat.name}</p>
              </div>
              <div className="rounded-2xl bg-white/90 border-4 border-white px-4 py-2 shadow-md">
                <p className="text-sm sm:text-base font-black text-foreground">
                  {placedAnimals.length} / {round.correctCount} found
                </p>
              </div>
            </div>

            <div className="absolute inset-x-4 bottom-4 min-h-[130px] rounded-[1.5rem] border-4 border-white/70 bg-white/25 backdrop-blur-sm p-3">
              <div className="flex flex-wrap gap-3 items-center justify-center">
                {placedAnimals.map(animal => (
                  <motion.div
                    key={animal.id}
                    initial={{ scale: 0.5, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/90 border-4 border-green-300 shadow-lg flex flex-col items-center justify-center"
                  >
                    <span className="text-4xl sm:text-5xl">{animal.emoji}</span>
                    {settings.showNames && <span className="text-xs font-black text-green-800">{animal.name}</span>}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <aside className="bg-card rounded-[2rem] border-4 border-card-border shadow-xl p-4 sm:p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={message}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className={`rounded-2xl border-4 px-4 py-3 mb-4 font-black text-center ${
                  finished ? "bg-green-50 border-green-300 text-green-800" : "bg-blue-50 border-blue-200 text-blue-800"
                }`}
              >
                {message}
              </motion.div>
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3">
              {trayAnimals.map(animal => (
                <DraggableAnimal
                  key={animal.id}
                  animal={animal}
                  showName={settings.showNames}
                  isWrong={wrongId === animal.id}
                  onDrop={handleDropAnimal}
                  disabled={finished}
                />
              ))}
            </div>

            {finished && (
              <div className="mt-5 text-center">
                {ageRange === "7-8" && (
                  <p className="text-sm sm:text-base font-bold text-muted-foreground mb-4 bg-muted rounded-2xl p-3">
                    {round.habitat.fact}
                  </p>
                )}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={nextRound}
                  className="h-14 px-7 rounded-full bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-lg"
                >
                  Next Habitat →
                </motion.button>
              </div>
            )}

            <p className="text-xs sm:text-sm font-bold text-muted-foreground text-center mt-4">
              Drag an animal onto the picture.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

function DraggableAnimal({
  animal,
  showName,
  isWrong,
  onDrop,
  disabled,
}: {
  animal: RoundAnimal;
  showName: boolean;
  isWrong: boolean;
  onDrop: (id: string) => void;
  disabled: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const startDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setPosition({ x: event.clientX, y: event.clientY });
    sounds.click();
  };

  const moveDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    setPosition({ x: event.clientX, y: event.clientY });
  };

  const endDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    setDragging(false);

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const inDropZone = target?.closest('[data-drop-zone="habitat"]');

    if (inDropZone) onDrop(animal.id);
  };

  return (
    <>
      <motion.button
        type="button"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={() => setDragging(false)}
        animate={isWrong ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className={`touch-none select-none rounded-2xl border-4 p-3 min-h-[116px] bg-white shadow-md flex flex-col items-center justify-center ${
          disabled ? "opacity-40" : "cursor-grab active:cursor-grabbing active:scale-95"
        } ${isWrong ? "border-red-300 bg-red-50" : "border-border"}`}
        aria-label={`Drag ${animal.name}`}
      >
        <span className="text-5xl sm:text-6xl leading-none">{animal.emoji}</span>
        {showName && <span className="mt-2 text-sm font-black text-foreground">{animal.name}</span>}
      </motion.button>

      {dragging && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-primary bg-white shadow-2xl px-5 py-4 flex flex-col items-center"
          style={{ left: position.x, top: position.y }}
        >
          <span className="text-6xl leading-none">{animal.emoji}</span>
          {showName && <span className="mt-2 text-sm font-black text-foreground">{animal.name}</span>}
        </div>
      )}
    </>
  );
}
