import React from "react";
import { questionKey } from "./dedup";

export type AgeRange = "3-4" | "5-6" | "7-8";
export type Category = "maths" | "animals" | "reading" | "science" | "health" | "colours";
export type RNG = () => number;

export interface BankQuestion {
  id: string;
  questionText: string;
  prompt: React.ReactNode;
  options: { label: string; isCorrect: boolean }[];
  category: Category;
}

function ri(rng: RNG, n: number): number { return Math.floor(rng() * n); }
function pick<T>(arr: T[], rng: RNG): T { return arr[ri(rng, arr.length)]; }
function shuffleRng<T>(arr: T[], rng: RNG): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = ri(rng, i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function makeOpts(correct: string, allWrongs: string[], rng: RNG) {
  const wrongs = shuffleRng(allWrongs.filter(w => w !== correct), rng).slice(0, 3);
  return shuffleRng([{ label: correct, isCorrect: true }, ...wrongs.map(w => ({ label: w, isCorrect: false }))], rng);
}
// For binary (two-way / yes-no) questions: exactly the two logical answers, no
// confusing extras like "Maybe", "Sometimes", "Both" or "Neither".
function binaryOpts(correct: string, other: string, rng: RNG) {
  return shuffleRng([{ label: correct, isCorrect: true }, { label: other, isCorrect: false }], rng);
}

// ─── Data ──────────────────────────────────────────────────────────────────
const COUNT_EMOJIS = ["🍎","⭐","🎈","🌸","🍭","🐥","🏆","🌻","🎲","🍕","🦋","🧸","🍦","🎀","🚗"];

const ANIMALS = [
  { e:"🐶", n:"Dog",      s:"Woof",   h:"Home",    b:"Puppy"   },
  { e:"🐱", n:"Cat",      s:"Meow",   h:"Home",    b:"Kitten"  },
  { e:"🐸", n:"Frog",     s:"Ribbit", h:"Pond",    b:"Tadpole" },
  { e:"🦁", n:"Lion",     s:"Roar",   h:"Safari",  b:"Cub"     },
  { e:"🐘", n:"Elephant", s:"Trumpet",h:"Safari",  b:"Calf"    },
  { e:"🦒", n:"Giraffe",  s:"Hum",    h:"Safari",  b:"Calf"    },
  { e:"🐧", n:"Penguin",  s:"Squawk", h:"Ice",     b:"Chick"   },
  { e:"🐮", n:"Cow",      s:"Moo",    h:"Farm",    b:"Calf"    },
  { e:"🐷", n:"Pig",      s:"Oink",   h:"Farm",    b:"Piglet"  },
  { e:"🐑", n:"Sheep",    s:"Baa",    h:"Farm",    b:"Lamb"    },
  { e:"🦊", n:"Fox",      s:"Yip",    h:"Forest",  b:"Kit"     },
  { e:"🦋", n:"Butterfly",s:"...",    h:"Garden",  b:"Caterpillar" },
  { e:"🐬", n:"Dolphin",  s:"Click",  h:"Ocean",   b:"Calf"    },
  { e:"🦆", n:"Duck",     s:"Quack",  h:"Pond",    b:"Duckling"},
  { e:"🦓", n:"Zebra",    s:"Neigh",  h:"Safari",  b:"Foal"    },
];

const SCIENCE_WEATHER = [
  { e:"☀️", n:"Sunny",   hot:true  },
  { e:"🌧️", n:"Rainy",  hot:false },
  { e:"❄️", n:"Snowy",   hot:false },
  { e:"🌈", n:"Rainbow", hot:false },
  { e:"⛅", n:"Cloudy",  hot:false },
  { e:"🌩️", n:"Stormy",  hot:false },
  { e:"🌬️", n:"Windy",   hot:false },
];

const SEASONS_DATA = [
  { name:"Spring", clue:"flowers bloom and birds sing",       e:"🌸" },
  { name:"Summer", clue:"the sun is hot and days are long",   e:"☀️" },
  { name:"Autumn", clue:"leaves turn orange and fall",        e:"🍂" },
  { name:"Winter", clue:"it snows and it is very cold",       e:"❄️" },
];

const HEALTH_FOOD = [
  { e:"🍎", n:"Apple",      healthy:true,  fruit:true  },
  { e:"🍌", n:"Banana",     healthy:true,  fruit:true  },
  { e:"🥦", n:"Broccoli",   healthy:true,  fruit:false },
  { e:"🥕", n:"Carrot",     healthy:true,  fruit:false },
  { e:"🍕", n:"Pizza",      healthy:false, fruit:false },
  { e:"🍰", n:"Cake",       healthy:false, fruit:false },
  { e:"🍟", n:"Chips",      healthy:false, fruit:false },
  { e:"🍇", n:"Grapes",     healthy:true,  fruit:true  },
  { e:"🍓", n:"Strawberry", healthy:true,  fruit:true  },
  { e:"🥝", n:"Kiwi",       healthy:true,  fruit:true  },
  { e:"🌽", n:"Corn",       healthy:true,  fruit:false },
  { e:"🍔", n:"Burger",     healthy:false, fruit:false },
  { e:"🍭", n:"Lollipop",   healthy:false, fruit:false },
];

const SHAPE_DATA = [
  { n:"Circle",   sides:0,  e:"⭕" },
  { n:"Triangle", sides:3,  e:"🔺" },
  { n:"Square",   sides:4,  e:"🟥" },
  { n:"Rectangle",sides:4,  e:"📏" },
  { n:"Pentagon", sides:5,  e:"⬠" },
  { n:"Hexagon",  sides:6,  e:"⬡" },
];

const COLOUR_THINGS = [
  { e:"🍎", colour:"Red"    },
  { e:"🍋", colour:"Yellow" },
  { e:"🍊", colour:"Orange" },
  { e:"🫐", colour:"Blue"   },
  { e:"🍇", colour:"Purple" },
  { e:"🥝", colour:"Green"  },
  { e:"🌹", colour:"Red"    },
  { e:"☁️", colour:"White"  },
  { e:"🌊", colour:"Blue"   },
  { e:"🌿", colour:"Green"  },
];

const RHYME_PAIRS = [
  { word:"Cat",   rhymes:["Bat","Hat","Mat"],   noRhymes:["Dog","Tree","Fish"] },
  { word:"Sun",   rhymes:["Run","Fun","Bun"],   noRhymes:["Moon","Sky","Star"] },
  { word:"Frog",  rhymes:["Log","Dog","Bog"],   noRhymes:["Duck","Bear","Fish"] },
  { word:"Tree",  rhymes:["Bee","Sea","Key"],   noRhymes:["Cloud","Rock","Fish"] },
  { word:"Rain",  rhymes:["Train","Plane","Chain"],noRhymes:["Cloud","Sun","Snow"] },
  { word:"Cake",  rhymes:["Lake","Snake","Rake"],noRhymes:["Pie","Bread","Jam"] },
  { word:"Star",  rhymes:["Car","Bar","Far"],   noRhymes:["Moon","Sky","Night"] },
  { word:"Moon",  rhymes:["Spoon","Tune","June"],noRhymes:["Star","Night","Sky"] },
];

const HOT_COLD = [
  { e:"🔥", n:"Fire",    hot:true  },
  { e:"🧊", n:"Ice",     hot:false },
  { e:"☀️", n:"Sun",     hot:true  },
  { e:"❄️", n:"Snow",    hot:false },
  { e:"🍦", n:"Ice Cream",hot:false},
  { e:"☕", n:"Hot Tea", hot:true  },
  { e:"🧊", n:"Frozen water",hot:false},
  { e:"🌋", n:"Volcano", hot:true  },
];

const BODY_PARTS_QA = [
  { q:"What do you use to see?",   a:"Eyes",  w:["Ears","Nose","Mouth"] },
  { q:"What do you use to hear?",  a:"Ears",  w:["Eyes","Nose","Legs"]  },
  { q:"What do you use to smell?", a:"Nose",  w:["Eyes","Ears","Mouth"] },
  { q:"What do you use to run?",   a:"Legs",  w:["Arms","Ears","Nose"]  },
  { q:"What do you use to hold things?",a:"Hands",w:["Feet","Nose","Eyes"] },
];

const SINK_FLOAT = [
  { e:"🪨", n:"Rock",   sinks:true  },
  { e:"🍂", n:"Leaf",   sinks:false },
  { e:"⚓", n:"Anchor", sinks:true  },
  { e:"🎈", n:"Balloon",sinks:false },
  { e:"🪵", n:"Wood",   sinks:false },
  { e:"🔩", n:"Bolt",   sinks:true  },
  { e:"🍄", n:"Mushroom",sinks:false},
];

// ─── Question Builders ──────────────────────────────────────────────────────
export function makeCounting(ageRange: AgeRange, id: string, rng: RNG): BankQuestion {
  const max = ageRange === "3-4" ? 5 : ageRange === "5-6" ? 10 : 15;
  const count = ri(rng, max) + 1;
  const emoji = pick(COUNT_EMOJIS, rng);
  const pool = Array.from({ length: max }, (_, i) => String(i + 1));
  return {
    id, category: "maths",
    questionText: `How many ${emoji} are there? Count them!`,
    prompt: (
      <div className="text-center">
        <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto mb-4">
          {Array.from({ length: count }, (_, j) => <span key={j} className="text-5xl md:text-6xl">{emoji}</span>)}
        </div>
        <p className="text-3xl font-black text-muted-foreground">How many?</p>
      </div>
    ),
    options: makeOpts(String(count), pool.filter(n => n !== String(count)), rng),
  };
}

export function makeAddition(ageRange: AgeRange, id: string, rng: RNG): BankQuestion {
  const max = ageRange === "3-4" ? 3 : ageRange === "5-6" ? 6 : 12;
  const a = ri(rng, max) + 1, b = ri(rng, max) + 1;
  const correct = a + b;
  const pool = Array.from({ length: max * 2 + 5 }, (_, i) => String(i + 1));
  return {
    id, category: "maths",
    questionText: `${a} + ${b} = ?`,
    prompt: <p className="text-8xl font-black text-foreground">{a} + {b} = ?</p>,
    options: makeOpts(String(correct), pool.filter(n => n !== String(correct)), rng),
  };
}

export function makeSubtraction(ageRange: AgeRange, id: string, rng: RNG): BankQuestion {
  const max = ageRange === "5-6" ? 8 : 15;
  const b = ri(rng, max - 1) + 1;
  const a = b + ri(rng, max - b) + 1;
  const correct = a - b;
  const pool = Array.from({ length: max }, (_, i) => String(i));
  return {
    id, category: "maths",
    questionText: `${a} − ${b} = ?`,
    prompt: <p className="text-8xl font-black text-foreground">{a} − {b} = ?</p>,
    options: makeOpts(String(correct), pool.filter(n => n !== String(correct)), rng),
  };
}

export function makeWhichBigger(ageRange: AgeRange, id: string, rng: RNG): BankQuestion {
  const max = ageRange === "3-4" ? 5 : ageRange === "5-6" ? 10 : 20;
  let a = ri(rng, max) + 1, b = ri(rng, max) + 1;
  while (a === b) b = ri(rng, max) + 1;
  const bigger = Math.max(a, b), smaller = Math.min(a, b);
  return {
    id, category: "maths",
    questionText: `Which number is bigger: ${a} or ${b}?`,
    prompt: (
      <div className="text-center">
        <p className="text-3xl font-black text-muted-foreground mb-6">Which is bigger?</p>
        <div className="flex gap-8 justify-center items-center">
          <span className="text-[7rem] font-black text-primary leading-none">{a}</span>
          <span className="text-4xl font-black text-muted-foreground">or</span>
          <span className="text-[7rem] font-black text-secondary leading-none">{b}</span>
        </div>
      </div>
    ),
    options: makeOpts(String(bigger), [String(smaller), String(bigger + 1), String(Math.max(1, smaller - 1))], rng),
  };
}

export function makeAnimalName(id: string, rng: RNG): BankQuestion {
  const animal = pick(ANIMALS, rng);
  const others = ANIMALS.filter(a => a.n !== animal.n);
  return {
    id, category: "animals",
    questionText: `What animal is this? It's a ${animal.n}!`,
    prompt: (
      <div className="text-center">
        <div className="text-[9rem] leading-none mb-4">{animal.e}</div>
        <p className="text-3xl font-black text-muted-foreground">What animal is this?</p>
      </div>
    ),
    options: makeOpts(animal.n, shuffleRng(others, rng).slice(0, 3).map(a => a.n), rng),
  };
}

export function makeAnimalSound(id: string, rng: RNG): BankQuestion {
  const known = ANIMALS.filter(a => a.s !== "...");
  const animal = pick(known, rng);
  const others = known.filter(a => a.s !== animal.s);
  return {
    id, category: "animals",
    questionText: `What sound does a ${animal.n} make?`,
    prompt: (
      <div className="text-center">
        <div className="text-[9rem] leading-none mb-4">{animal.e}</div>
        <p className="text-3xl font-black text-muted-foreground">What sound does this animal make?</p>
      </div>
    ),
    options: makeOpts(animal.s, shuffleRng(others, rng).slice(0, 3).map(a => a.s), rng),
  };
}

export function makeAnimalBaby(id: string, rng: RNG): BankQuestion {
  const known = ANIMALS.filter(a => a.b !== "Calf");
  const animal = pick(known, rng);
  const others = known.filter(a => a.b !== animal.b);
  return {
    id, category: "animals",
    questionText: `What is a baby ${animal.n} called? A ${animal.b}!`,
    prompt: (
      <div className="text-center">
        <div className="text-[9rem] leading-none mb-4">{animal.e}</div>
        <p className="text-3xl font-black text-muted-foreground">What is a baby {animal.n} called?</p>
      </div>
    ),
    options: makeOpts(animal.b, shuffleRng(others, rng).slice(0, 3).map(a => a.b), rng),
  };
}

export function makeWeather(id: string, rng: RNG): BankQuestion {
  const w = pick(SCIENCE_WEATHER, rng);
  const others = SCIENCE_WEATHER.filter(x => x.n !== w.n);
  return {
    id, category: "science",
    questionText: `What type of weather is this? It is ${w.n}!`,
    prompt: (
      <div className="text-center">
        <div className="text-[10rem] leading-none mb-4">{w.e}</div>
        <p className="text-3xl font-black text-muted-foreground">What weather is this?</p>
      </div>
    ),
    options: makeOpts(w.n, shuffleRng(others, rng).slice(0, 3).map(x => x.n), rng),
  };
}

export function makeSeason(id: string, rng: RNG): BankQuestion {
  const s = pick(SEASONS_DATA, rng);
  const others = SEASONS_DATA.filter(x => x.name !== s.name);
  return {
    id, category: "science",
    questionText: `Which season is it when ${s.clue}?`,
    prompt: (
      <div className="text-center">
        <div className="text-[8rem] leading-none mb-4">{s.e}</div>
        <p className="text-3xl font-black text-muted-foreground">Which season is when {s.clue}?</p>
      </div>
    ),
    options: makeOpts(s.name, others.map(x => x.name), rng),
  };
}

export function makeHotCold(id: string, rng: RNG): BankQuestion {
  const item = pick(HOT_COLD, rng);
  const answer = item.hot ? "Hot" : "Cold";
  return {
    id, category: "science",
    questionText: `Is ${item.n} hot or cold?`,
    prompt: (
      <div className="text-center">
        <div className="text-[10rem] leading-none mb-4">{item.e}</div>
        <p className="text-3xl font-black text-muted-foreground">Is {item.n} hot or cold?</p>
      </div>
    ),
    options: binaryOpts(answer, item.hot ? "Cold" : "Hot", rng),
  };
}

export function makeSinkFloat(id: string, rng: RNG): BankQuestion {
  const item = pick(SINK_FLOAT, rng);
  const answer = item.sinks ? "Sink" : "Float";
  return {
    id, category: "science",
    questionText: `Does a ${item.n} sink or float in water?`,
    prompt: (
      <div className="text-center">
        <div className="text-[10rem] leading-none mb-4">{item.e}</div>
        <p className="text-3xl font-black text-muted-foreground">Does a {item.n} sink or float?</p>
      </div>
    ),
    options: binaryOpts(answer, item.sinks ? "Float" : "Sink", rng),
  };
}

export function makeHealthyFood(id: string, rng: RNG): BankQuestion {
  const food = pick(HEALTH_FOOD, rng);
  const answer = food.healthy ? "Healthy" : "Not Healthy";
  return {
    id, category: "health",
    questionText: `Is ${food.n} healthy or not healthy?`,
    prompt: (
      <div className="text-center">
        <div className="text-[10rem] leading-none mb-4">{food.e}</div>
        <p className="text-3xl font-black text-muted-foreground">Is {food.n} healthy?</p>
      </div>
    ),
    options: binaryOpts(answer, food.healthy ? "Not Healthy" : "Healthy", rng),
  };
}

export function makeIsFruit(id: string, rng: RNG): BankQuestion {
  const food = pick(HEALTH_FOOD, rng);
  const answer = food.fruit ? "Yes" : "No";
  return {
    id, category: "health",
    questionText: `Is a ${food.n} a fruit?`,
    prompt: (
      <div className="text-center">
        <div className="text-[10rem] leading-none mb-4">{food.e}</div>
        <p className="text-3xl font-black text-muted-foreground">Is a {food.n} a fruit?</p>
      </div>
    ),
    options: binaryOpts(answer, food.fruit ? "No" : "Yes", rng),
  };
}

export function makeBodyPart(id: string, rng: RNG): BankQuestion {
  const qa = pick(BODY_PARTS_QA, rng);
  return {
    id, category: "health",
    questionText: qa.q,
    prompt: <p className="text-5xl font-black text-foreground text-center px-4">{qa.q}</p>,
    options: makeOpts(qa.a, qa.w, rng),
  };
}

export function makeColour(id: string, rng: RNG): BankQuestion {
  const item = pick(COLOUR_THINGS, rng);
  const allColours = ["Red","Yellow","Orange","Blue","Purple","Green","White","Pink","Brown","Black"];
  return {
    id, category: "colours",
    questionText: `What colour is ${item.e}?`,
    prompt: (
      <div className="text-center">
        <div className="text-[10rem] leading-none mb-4">{item.e}</div>
        <p className="text-3xl font-black text-muted-foreground">What colour is this?</p>
      </div>
    ),
    options: makeOpts(item.colour, allColours.filter(c => c !== item.colour), rng),
  };
}

export function makeShapeSides(id: string, rng: RNG): BankQuestion {
  const shape = pick(SHAPE_DATA.filter(s => s.sides > 0), rng);
  const others = ["1","2","3","4","5","6","7","8"].filter(n => n !== String(shape.sides));
  return {
    id, category: "colours",
    questionText: `How many sides does a ${shape.n} have?`,
    prompt: (
      <div className="text-center">
        <div className="text-[8rem] leading-none mb-4">{shape.e}</div>
        <p className="text-3xl font-black text-muted-foreground">How many sides does a {shape.n} have?</p>
      </div>
    ),
    options: makeOpts(String(shape.sides), others, rng),
  };
}

export function makeRhyming(id: string, rng: RNG): BankQuestion {
  const pair = pick(RHYME_PAIRS, rng);
  const rhyme = pick(pair.rhymes, rng);
  const noRhyme = pick(pair.noRhymes, rng);
  const decoys = shuffleRng(RHYME_PAIRS.filter(p => p.word !== pair.word).flatMap(p => p.noRhymes), rng).slice(0, 2);
  return {
    id, category: "reading",
    questionText: `Which word rhymes with ${pair.word}?`,
    prompt: <p className="text-5xl md:text-6xl font-black text-foreground text-center">Which word rhymes with <span className="text-primary">{pair.word}</span>?</p>,
    options: makeOpts(rhyme, [noRhyme, ...decoys], rng),
  };
}

export function makeLetterFill(id: string, rng: RNG): BankQuestion {
  const words = [
    ["CAT","🐱","A"], ["DOG","🐶","O"], ["PIG","🐷","I"], ["HAT","🎩","A"],
    ["BUS","🚌","U"], ["HEN","🐔","E"], ["CUP","☕","U"], ["SUN","☀️","U"],
    ["BED","🛏️","E"], ["HOP","🐸","O"], ["PIN","📌","I"], ["WET","💧","E"],
  ];
  const [word, emoji, answer] = pick(words, rng);
  const vowels = ["A","E","I","O","U"];
  return {
    id, category: "reading",
    questionText: `Fill in the missing letter: ${word[0]} _ ${word[2]}. The word is ${word.toLowerCase()}.`,
    prompt: (
      <div className="text-center">
        <div className="text-[8rem] leading-none mb-4">{emoji}</div>
        <div className="flex items-center justify-center gap-4 text-7xl font-black text-foreground">
          <span>{word[0]}</span>
          <span className="text-primary border-b-4 border-primary px-2">_</span>
          <span>{word[2]}</span>
        </div>
        <p className="text-2xl font-black text-muted-foreground mt-4">What is the missing letter?</p>
      </div>
    ),
    options: makeOpts(answer, vowels.filter(v => v !== answer), rng),
  };
}

export function makeFillInWord(ageRange: AgeRange, id: string, rng: RNG): BankQuestion {
  const easy = [
    { s:"The dog can ___ fast.",          a:"run",  w:["big","blue","fly"]   },
    { s:"The cat sat on the ___.",         a:"mat",  w:["run","big","fly"]    },
    { s:"The bird can ___.",               a:"fly",  w:["big","run","sun"]    },
    { s:"The frog likes to ___.",          a:"jump", w:["cake","blue","run"]  },
    { s:"I can see a big ___.",            a:"sun",  w:["fly","run","big"]    },
  ];
  const hard = [
    { s:"The rabbit ran into the ___.",    a:"garden",    w:["pencil","moon","school"] },
    { s:"She opened her ___ in the rain.", a:"umbrella",  w:["pencil","cloud","sky"]  },
    { s:"The caterpillar became a ___.",   a:"butterfly", w:["pencil","cloud","rock"] },
    { s:"We need ___ to breathe.",         a:"oxygen",    w:["pencil","moon","sand"]  },
    { s:"The astronaut floated in ___.",   a:"space",     w:["pencil","moon","river"] },
  ];
  const pool = ageRange === "7-8" ? hard : easy;
  const item = pick(pool, rng);
  return {
    id, category: "reading",
    questionText: `Complete the sentence: ${item.s.replace("___", item.a)}`,
    prompt: (
      <div className="text-center px-4">
        <p className="text-3xl font-black text-muted-foreground mb-4">Complete the sentence:</p>
        <p className="text-4xl md:text-5xl font-black text-foreground leading-snug">
          {item.s.split("___").map((part, j, arr) => (
            <React.Fragment key={j}>{part}{j < arr.length - 1 && <span className="text-primary underline decoration-4">___</span>}</React.Fragment>
          ))}
        </p>
      </div>
    ),
    options: makeOpts(item.a, item.w, rng),
  };
}

// ─── Main builder ────────────────────────────────────────────────────────────
type Builder = (id: string, rng: RNG) => BankQuestion;

function getBuilders(ageRange: AgeRange): { fn: Builder; category: Category }[] {
  const all: { fn: Builder; category: Category }[] = [
    { fn: (id, rng) => makeCounting(ageRange, id, rng),    category: "maths"   },
    { fn: (id, rng) => makeAddition(ageRange, id, rng),    category: "maths"   },
    { fn: (id, rng) => makeWhichBigger(ageRange, id, rng), category: "maths"   },
    { fn: makeAnimalName,   category: "animals" },
    { fn: makeAnimalSound,  category: "animals" },
    { fn: makeWeather,      category: "science" },
    { fn: makeHotCold,      category: "science" },
    { fn: makeHealthyFood,  category: "health"  },
    { fn: makeColour,       category: "colours" },
    { fn: makeLetterFill,   category: "reading" },
  ];
  if (ageRange !== "3-4") {
    all.push({ fn: (id, rng) => makeSubtraction(ageRange, id, rng), category: "maths"   });
    all.push({ fn: makeAnimalBaby,   category: "animals" });
    all.push({ fn: makeSeason,       category: "science" });
    all.push({ fn: makeSinkFloat,    category: "science" });
    all.push({ fn: makeIsFruit,      category: "health"  });
    all.push({ fn: makeShapeSides,   category: "colours" });
    all.push({ fn: makeRhyming,      category: "reading" });
    all.push({ fn: (id, rng) => makeFillInWord(ageRange, id, rng), category: "reading" });
  } else {
    all.push({ fn: makeBodyPart,     category: "health"  });
  }
  return all;
}

// Builds `count` questions all drawn from a single category, de-duplicated
// within the set. Used by the Daily Challenge, which presents one category at a
// time (5 questions each). Falls back to repeats only if the category's pool is
// genuinely exhausted.
export function buildCategoryQuestions(ageRange: AgeRange, category: Category, count: number, rng: RNG = Math.random): BankQuestion[] {
  const catBuilders = getBuilders(ageRange).filter(b => b.category === category);
  const questions: BankQuestion[] = [];
  if (!catBuilders.length) return questions;
  const used = new Set<string>();
  for (let i = 0; i < count; i++) {
    let q = pick(catBuilders, rng).fn(`${category}${i}`, rng);
    let attempts = 0;
    while (used.has(questionKey(q)) && attempts < 40) {
      q = pick(catBuilders, rng).fn(`${category}${i}`, rng);
      attempts++;
    }
    used.add(questionKey(q));
    questions.push(q);
  }
  return questions;
}

export function buildMixedQuestions(ageRange: AgeRange, count: number, rng: RNG = Math.random): BankQuestion[] {
  const builders = getBuilders(ageRange);
  const questions: BankQuestion[] = [];
  const used = new Set<string>();
  // Distribute across categories
  const cats: Category[] = ["maths","animals","reading","science","health","colours"];
  const perCat = Math.ceil(count / cats.length);
  for (const cat of cats) {
    const catBuilders = builders.filter(b => b.category === cat);
    if (!catBuilders.length) continue;
    for (let i = 0; i < perCat; i++) {
      // Retry generation until the question is unique within this set, or the
      // pool is effectively exhausted (then a repeat is accepted).
      let q = pick(catBuilders, rng).fn(`${cat}${i}`, rng);
      let attempts = 0;
      while (used.has(questionKey(q)) && attempts < 40) {
        q = pick(catBuilders, rng).fn(`${cat}${i}`, rng);
        attempts++;
      }
      used.add(questionKey(q));
      questions.push(q);
    }
  }
  // Shuffle and slice to exact count
  return shuffleRng(questions, rng).slice(0, count);
}
