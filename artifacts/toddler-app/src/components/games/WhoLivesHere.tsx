import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext, QuestionRecord } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";
import { computeGamePoints } from "@/lib/points";
import SpeakerButton from "@/components/SpeakerButton";

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

interface HabitatReview {
  habitat: HabitatName;
  animalsShown: string[];
  correctPlaced: string[];
  wrongAttempted: string[];
  explanation: string;
}

const HABITATS: Habitat[] = [
  {
    name: "Farm",
    image: "Farm.png",
    fact: "Farm animals often live close to people.",
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
    fact: "Ocean animals live in salty water.",
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
    fact: "Jungle animals live in warm, leafy places.",
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
    fact: "Sky animals often have wings or feathers.",
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
    fact: "Bugs are small creatures with tiny legs, wings, feelers, or shells.",
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

const OBVIOUS_WRONGS: Record<HabitatName, HabitatName[]> = {
  Farm: ["Ocean", "Bugs", "Sky"],
  Ocean: ["Farm", "Sky", "Bugs"],
  Jungle: ["Ocean", "Farm", "Sky"],
  Sky: ["Ocean", "Farm", "Bugs"],
  Bugs: ["Ocean", "Farm", "Sky"],
};

const CONFUSING_WRONG_CATEGORIES: Partial<Record<HabitatName, HabitatName[]>> = {
  Sky: ["Bugs"],
  Bugs: ["Sky"],
};

const CONFUSING_WRONG_NAMES: Partial<Record<HabitatName, string[]>> = {
  Farm: ["Duck"],
  Ocean: ["Duck"],
};

function isClearWrongChoice(habitat: HabitatName, animal: Animal): boolean {
  if (animal.category === habitat) return false;
  if (CONFUSING_WRONG_CATEGORIES[habitat]?.includes(animal.category)) return false;
  if (CONFUSING_WRONG_NAMES[habitat]?.includes(animal.name)) return false;
  return true;
}

function preloadHabitatImages(base: string) {
  HABITATS.forEach(habitat => {
    const img = new Image();
    img.src = `${base}who-lives-here/${habitat.image}`;
  });
}

function createInitialSession(ageRange: AgeRange) {
  const order = shuffle(HABITATS);
  return {
    order,
    round: createRound(order[0], ageRange),
  };
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function difficulty(ageRange: AgeRange) {
  if (ageRange === "3-4") return { correct: 3, wrongMin: 1, wrongMax: 1, showNames: false };
  if (ageRange === "5-6") return { correct: 4, wrongMin: 2, wrongMax: 2, showNames: true };
  return { correct: 6, wrongMin: 2, wrongMax: 3, showNames: true };
}

function habitatInstruction(habitat: HabitatName): string {
  if (habitat === "Farm") return "Drag the animals that live on the farm into their home.";
  if (habitat === "Ocean") return "Drag the animals that live in the ocean into their home.";
  if (habitat === "Jungle") return "Drag the animals that live in the jungle into their home.";
  if (habitat === "Sky") return "Drag the animals that live in the sky into their home.";
  return "Drag the bugs into their home.";
}

function explanationFor(animal: Animal): string {
  if (animal.category === "Farm") return `${animal.name}s live on farms.`;
  if (animal.category === "Ocean") return `${animal.name}s live in the ocean.`;
  if (animal.category === "Jungle") return `${animal.name}s live in the jungle.`;
  if (animal.category === "Sky") return `${animal.name}s fly in the sky.`;
  return `${animal.name}s are bugs.`;
}

function createRound(habitat: Habitat, ageRange: AgeRange): RoundState {
  const settings = difficulty(ageRange);
  const correct = shuffle(habitat.animals).slice(0, settings.correct);
  const wrongCount =
    settings.wrongMin === settings.wrongMax
      ? settings.wrongMin
      : settings.wrongMin + Math.floor(Math.random() * (settings.wrongMax - settings.wrongMin + 1));

  const wrongCategories =
    ageRange === "3-4"
      ? OBVIOUS_WRONGS[habitat.name]
      : shuffle(HABITATS.filter(group => group.name !== habitat.name).map(group => group.name));

  const clearWrongPool = wrongCategories
    .flatMap(name => HABITATS.find(group => group.name === name)?.animals ?? [])
    .filter(animal => isClearWrongChoice(habitat.name, animal));

  const fallbackWrongPool = HABITATS
    .filter(group => group.name !== habitat.name)
    .flatMap(group => group.animals)
    .filter(animal => isClearWrongChoice(habitat.name, animal));

  const wrongPool = shuffle(clearWrongPool.length >= wrongCount ? clearWrongPool : fallbackWrongPool).slice(0, wrongCount);

  const animals = shuffle([...correct, ...wrongPool]).map((animal, index) => ({
    ...animal,
    id: `${Date.now()}-${index}-${animal.category}-${animal.name}-${animal.emoji}`,
  }));

  return {
    habitat,
    animals,
    correctCount: correct.length,
  };
}

function starsFor(score: number, total: number): number {
  const pct = total > 0 ? score / total : 0;
  if (pct >= 0.8) return 3;
  if (pct >= 0.5) return 2;
  return 1;
}

export default function WhoLivesHere() {
  const [, setLocation] = useLocation();
  const { activeProfile, addGameResult } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "5-6";
  const settings = difficulty(ageRange);

  const initialSession = useMemo(() => createInitialSession(ageRange), []);
  const [habitatOrder, setHabitatOrder] = useState<Habitat[]>(initialSession.order);
  const [habitatIndex, setHabitatIndex] = useState(0);
  const [round, setRound] = useState<RoundState>(initialSession.round);
  
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  const [wrongAttempts, setWrongAttempts] = useState<Animal[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [message, setMessage] = useState("Drag the animals into their home!");
  const [roundComplete, setRoundComplete] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [reviews, setReviews] = useState<HabitatReview[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);

  const startTimeRef = useRef(Date.now());
  const questionHistoryRef = useRef<QuestionRecord[]>([]);

  const imageBase = useMemo(() => import.meta.env.BASE_URL.replace(/\/?$/, "/"), []);
  const habitatImage = `${imageBase}who-lives-here/${round.habitat.image}`;
  const [visibleHabitatImage, setVisibleHabitatImage] = useState("");
  const [habitatImageReady, setHabitatImageReady] = useState(false);
  const instruction = habitatInstruction(round.habitat.name);
  const placedAnimals = round.animals.filter(animal => placedIds.includes(animal.id));
  const trayAnimals = round.animals.filter(animal => !placedIds.includes(animal.id));
  const totalHabitats = HABITATS.length;
  const totalCorrectTargets = habitatOrder.reduce((sum, habitat) => {
    return sum + Math.min(difficulty(ageRange).correct, habitat.animals.length);
  }, 0);

  useEffect(() => {
    if (!activeProfile) setLocation("/");
  }, [activeProfile, setLocation]);

  useEffect(() => {
    startNewSession();
  }, [ageRange]);

   useEffect(() => {
    preloadHabitatImages(imageBase);
  }, [imageBase]);

  useEffect(() => {
    let cancelled = false;
    setHabitatImageReady(false);
    setVisibleHabitatImage("");

    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        setVisibleHabitatImage(habitatImage);
        setHabitatImageReady(true);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setVisibleHabitatImage(habitatImage);
        setHabitatImageReady(true);
      }
    };
    img.src = habitatImage;

    return () => {
      cancelled = true;
    };
  }, [habitatImage]);
  
  if (!activeProfile) return null;

  function startNewSession() {
    const order = shuffle(HABITATS);
    setHabitatOrder(order);
    setHabitatIndex(0);
    setRound(createRound(order[0], ageRange));
    setPlacedIds([]);
    setWrongAttempts([]);
    setWrongId(null);
    setMessage("Drag the animals into their home!");
    setRoundComplete(false);
    setGameComplete(false);
    setReviews([]);
    setFinalScore(0);
    setPointsEarned(0);
    startTimeRef.current = Date.now();
    questionHistoryRef.current = [];
  }

  function addHistory(animal: Animal, isCorrect: boolean) {
    questionHistoryRef.current = [
      ...questionHistoryRef.current,
      {
        questionId: `${round.habitat.name}-${questionHistoryRef.current.length + 1}-${animal.name}`,
        questionText: instruction,
        childAnswerText: animal.name,
        correctAnswerText: isCorrect ? animal.name : `${animal.name} belongs in ${animal.category}`,
        isCorrect,
        explanation: explanationFor(animal),
      },
    ];
  }

  function completeHabitat(nextPlacedIds: string[]) {
    const correctPlaced = round.animals.filter(
      animal => animal.category === round.habitat.name && nextPlacedIds.includes(animal.id)
    );

    const review: HabitatReview = {
      habitat: round.habitat.name,
      animalsShown: round.animals.map(animal => `${animal.emoji} ${animal.name}`),
      correctPlaced: correctPlaced.map(animal => `${animal.emoji} ${animal.name}`),
      wrongAttempted: wrongAttempts.map(animal => `${animal.emoji} ${animal.name}`),
      explanation: round.habitat.fact,
    };

    setPlacedIds(nextPlacedIds);
    setReviews(prev => [...prev, review]);
    setRoundComplete(true);
    sounds.celebrate();
    setMessage(`Great job! You found the ${round.habitat.name.toLowerCase()} animals!`);
  }

  function finishFullGame(nextReviews: HabitatReview[]) {
    const totalWrong = nextReviews.reduce((sum, review) => sum + review.wrongAttempted.length, 0);
    const score = Math.max(0, totalCorrectTargets - totalWrong);
    const stars = starsFor(score, totalCorrectTargets);
    const points = computeGamePoints({
      score,
      total: totalCorrectTargets,
      stars,
      gameId: "who-lives-here",
    });

    addGameResult({
      childId: activeProfile.id,
      gameId: "who-lives-here",
      gameName: "Who Lives Here?",
      category: "animals",
      score,
      total: totalCorrectTargets,
      stars,
      timeTakenSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
      questionHistory: questionHistoryRef.current,
    });

    setFinalScore(score);
    setPointsEarned(points);
    setGameComplete(true);
    sounds.celebrate();
  }

  function handleDropAnimal(id: string) {
    if (roundComplete || gameComplete || placedIds.includes(id)) return;

    const animal = round.animals.find(item => item.id === id);
    if (!animal) return;

    if (animal.category === round.habitat.name) {
      const nextPlacedIds = [...placedIds, id];
      const correctPlaced = round.animals.filter(
        item => item.category === round.habitat.name && nextPlacedIds.includes(item.id)
      ).length;

      addHistory(animal, true);
      sounds.correct();

      if (correctPlaced >= round.correctCount) {
        const correctAnimals = round.animals.filter(
          item => item.category === round.habitat.name && nextPlacedIds.includes(item.id)
        );

        const review: HabitatReview = {
          habitat: round.habitat.name,
          animalsShown: round.animals.map(item => `${item.emoji} ${item.name}`),
          correctPlaced: correctAnimals.map(item => `${item.emoji} ${item.name}`),
          wrongAttempted: wrongAttempts.map(item => `${item.emoji} ${item.name}`),
          explanation: round.habitat.fact,
        };

        const nextReviews = [...reviews, review];
        setPlacedIds(nextPlacedIds);
        setReviews(nextReviews);
        setRoundComplete(true);
        setMessage(`Great job! You found the ${round.habitat.name.toLowerCase()} animals!`);

        if (habitatIndex >= totalHabitats - 1) {
          finishFullGame(nextReviews);
        } else {
          sounds.celebrate();
        }
      } else {
        setPlacedIds(nextPlacedIds);
        setMessage(`Yes! ${animal.name} lives here.`);
      }
    } else {
      addHistory(animal, false);
      sounds.wrong();
      setWrongAttempts(prev => [...prev, animal]);
      setWrongId(id);
      setMessage(`${animal.name} lives somewhere else. Try another animal!`);
      window.setTimeout(() => setWrongId(null), 550);
    }
  }

  function nextHabitat() {
    const nextIndex = habitatIndex + 1;
    const nextHabitat = habitatOrder[nextIndex];

    setHabitatIndex(nextIndex);
    setRound(createRound(nextHabitat, ageRange));
    setPlacedIds([]);
    setWrongAttempts([]);
    setWrongId(null);
    setMessage("Drag the animals into their home!");
    setRoundComplete(false);
    sounds.pop();
  }

  if (gameComplete) {
    const stars = starsFor(finalScore, totalCorrectTargets);

    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          <section className="bg-card rounded-[2rem] border-4 border-card-border shadow-2xl p-5 sm:p-8 text-center">
            <div className="text-7xl sm:text-8xl mb-4">🎉</div>
            <h1 className="text-3xl sm:text-5xl font-black text-foreground mb-3">Habitats Complete!</h1>
            <p className="text-xl sm:text-2xl font-bold text-muted-foreground mb-5">
              You helped every animal find its home.
            </p>

            <div className="flex justify-center gap-2 sm:gap-4 mb-5">
              {[1, 2, 3].map(star => (
                <span key={star} className={`text-5xl sm:text-7xl ${star <= stars ? "" : "opacity-25 grayscale"}`}>
                  ⭐
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl bg-emerald-50 border-4 border-emerald-200 p-4">
                <p className="text-sm font-black text-emerald-700">Final Score</p>
                <p className="text-3xl font-black text-emerald-900">
                  {finalScore} / {totalCorrectTargets}
                </p>
              </div>
              <div className="rounded-2xl bg-amber-50 border-4 border-amber-200 p-4">
                <p className="text-sm font-black text-amber-700">Points Earned</p>
                <p className="text-3xl font-black text-amber-900">+{pointsEarned}</p>
              </div>
            </div>

            <div className="text-left grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {reviews.map(review => (
                <div key={review.habitat} className="rounded-2xl border-4 border-border bg-muted p-4">
                  <h2 className="text-xl font-black text-foreground mb-2">{review.habitat}</h2>
                  <p className="text-sm font-bold text-muted-foreground mb-2">
                    Animals shown: {review.animalsShown.join(", ")}
                  </p>
                  <p className="text-sm font-bold text-green-700 mb-2">
                    Correct: {review.correctPlaced.join(", ")}
                  </p>
                  <p className="text-sm font-bold text-red-700 mb-2">
                    Wrong tries: {review.wrongAttempted.length ? review.wrongAttempted.join(", ") : "None"}
                  </p>
                  <p className="text-sm font-bold text-foreground">{review.explanation}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  sounds.click();
                  setLocation("/animals");
                }}
                className="h-14 px-8 rounded-full bg-muted hover:bg-muted/80 text-foreground border-4 border-border font-black text-lg"
              >
                ← Back to Animals
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={startNewSession}
                className="h-14 px-8 rounded-full bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-lg"
              >
                Play Again
              </motion.button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-5 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center gap-3 sm:gap-5 mb-5 bg-card rounded-[2rem] p-4 sm:p-6 border-4 border-card-border shadow-md">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              sounds.click();
              setLocation("/animals");
            }}
            className="h-12 sm:h-16 px-4 sm:px-6 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground font-black text-base sm:text-xl border-4 border-border transition-colors"
          >
            ← Back
          </motion.button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-foreground leading-tight">
                Who Lives Here?
              </h1>
              <span className="rounded-full bg-primary/10 text-primary border-2 border-primary/20 px-3 py-1 text-sm sm:text-base font-black">
                Habitat {habitatIndex + 1} of {totalHabitats}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-base sm:text-xl font-bold text-muted-foreground">{instruction}</p>
              <SpeakerButton text={instruction} label="Read the instruction" size="xs" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-5">
          <section
            data-drop-zone="habitat"
            className="relative overflow-hidden rounded-[2rem] border-4 border-card-border shadow-2xl min-h-[360px] sm:min-h-[460px] bg-muted"
          >
            {habitatImageReady && visibleHabitatImage ? (
  <img
    src={visibleHabitatImage}
    alt={`${round.habitat.name} habitat`}
    className="absolute inset-0 w-full h-full object-cover"
    loading="eager"
    decoding="async"
  />
) : (
  <div className="absolute inset-0 grid place-items-center bg-muted">
    <p className="text-xl sm:text-2xl font-black text-muted-foreground">Loading habitat...</p>
  </div>
)}
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
                  roundComplete ? "bg-green-50 border-green-300 text-green-800" : "bg-blue-50 border-blue-200 text-blue-800"
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
                  disabled={roundComplete}
                />
              ))}
            </div>

            {roundComplete && !gameComplete && (
              <div className="mt-5 text-center">
                {ageRange === "7-8" && (
                  <p className="text-sm sm:text-base font-bold text-muted-foreground mb-4 bg-muted rounded-2xl p-3">
                    {round.habitat.fact}
                  </p>
                )}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={nextHabitat}
                  className="h-14 px-7 rounded-full bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-lg"
                >
                  Next Habitat →
                </motion.button>
              </div>
            )}

            <p className="text-xs sm:text-sm font-bold text-muted-foreground text-center mt-4">
              Drag an animal onto the habitat picture.
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

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    setPosition({ x: event.clientX, y: event.clientY });
    sounds.click();
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setPosition({ x: event.clientX, y: event.clientY });
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const inDropZone = target?.closest('[data-drop-zone="habitat"]');

    if (inDropZone) onDrop(animal.id);
  };

  return (
    <>
      <motion.div
        role="button"
        tabIndex={0}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={() => setDragging(false)}
        animate={isWrong ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className={`relative touch-none select-none rounded-2xl border-4 p-3 min-h-[116px] bg-white shadow-md flex flex-col items-center justify-center ${
          disabled ? "opacity-40" : "cursor-grab active:cursor-grabbing active:scale-95"
        } ${isWrong ? "border-red-300 bg-red-50" : "border-border"}`}
        aria-label={`Drag ${animal.name}`}
      >
        <div className="absolute right-2 top-2" onPointerDown={event => event.stopPropagation()}>
          <SpeakerButton text={animal.name} label={`Hear ${animal.name}`} size="xs" />
        </div>
        <span className="text-5xl sm:text-6xl leading-none">{animal.emoji}</span>
        {showName && <span className="mt-2 text-sm font-black text-foreground">{animal.name}</span>}
      </motion.div>

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
