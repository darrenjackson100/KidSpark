import { GameResult, PetState } from "@/context/AppContext";
import { computeTotalPoints, getEarnedMilestoneBadges } from "@/lib/points";

// ---------------------------------------------------------------------------
// Pet species — rendered as large, friendly emoji (soft, rounded, child-safe).
// ---------------------------------------------------------------------------
export interface PetSpecies {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
}

export const PET_SPECIES: PetSpecies[] = [
  { id: "puppy",     name: "Puppy",         emoji: "🐶", blurb: "Waggy & loyal" },
  { id: "kitten",    name: "Kitten",        emoji: "🐱", blurb: "Soft & purry" },
  { id: "bunny",     name: "Bunny",         emoji: "🐰", blurb: "Hoppy & sweet" },
  { id: "capybara",  name: "Capybara",      emoji: "🦫", blurb: "Calm & cuddly" },
  { id: "hamster",   name: "Hamster",       emoji: "🐹", blurb: "Tiny & busy" },
  { id: "guineapig", name: "Guinea Pig",    emoji: "🐹", blurb: "Squeaky friend" },
  { id: "panda",     name: "Panda",         emoji: "🐼", blurb: "Roly & playful" },
  { id: "fox",       name: "Fox",           emoji: "🦊", blurb: "Clever & fluffy" },
  { id: "penguin",   name: "Penguin",       emoji: "🐧", blurb: "Waddly & fun" },
  { id: "duckling",  name: "Duckling",      emoji: "🐥", blurb: "Fuzzy & cheepy" },
  { id: "turtle",    name: "Turtle",        emoji: "🐢", blurb: "Slow & happy" },
  { id: "koala",     name: "Koala",         emoji: "🐨", blurb: "Sleepy & soft" },
  { id: "bearcub",   name: "Bear Cub",      emoji: "🐻", blurb: "Big & huggy" },
  { id: "dragon",    name: "Baby Dragon",   emoji: "🐉", blurb: "Sparky & brave" },
  { id: "dino",      name: "Baby Dinosaur", emoji: "🦖", blurb: "Stompy & kind" },
  { id: "unicorn",   name: "Unicorn",       emoji: "🦄", blurb: "Magic & shiny" },
  { id: "chick",     name: "Chick",         emoji: "🐤", blurb: "Little & sunny" },
  { id: "lamb",      name: "Lamb",          emoji: "🐑", blurb: "Woolly & gentle" },
  { id: "elephant",  name: "Baby Elephant", emoji: "🐘", blurb: "Trunky & jolly" },
  { id: "monkey",    name: "Baby Monkey",   emoji: "🐵", blurb: "Cheeky & giggly" },
];

export function getSpecies(id: string | undefined): PetSpecies {
  return PET_SPECIES.find(s => s.id === id) ?? PET_SPECIES[0];
}

// ---------------------------------------------------------------------------
// Growth stages — fully DERIVED from learning (never from tapping care). XP is
// earned by completing games, answering questions, daily challenges, badges and
// keeping a streak, so the only real way to grow the pet is to learn.
// ---------------------------------------------------------------------------
export interface GrowthStage {
  stage: number;   // 1..20
  label: string;
  minXp: number;
  scale: number;   // emoji size multiplier
}

// 20 gentle stages. Thresholds are deliberately steep so the pet grows slowly
// over weeks/months of real learning — a single game only nudges it forward a
// little. Growth should feel special, never farmable in a few sessions.
export const GROWTH_STAGES: GrowthStage[] = [
  { stage: 1,  label: "Tiny Baby",        minXp: 0,    scale: 0.70 },
  { stage: 2,  label: "Little Baby",      minXp: 40,   scale: 0.75 },
  { stage: 3,  label: "Playful Baby",     minXp: 90,   scale: 0.81 },
  { stage: 4,  label: "Curious Baby",     minXp: 150,  scale: 0.86 },
  { stage: 5,  label: "Toddler Pet",      minXp: 230,  scale: 0.91 },
  { stage: 6,  label: "Young Pet",        minXp: 330,  scale: 0.96 },
  { stage: 7,  label: "Growing Pet",      minXp: 460,  scale: 1.02 },
  { stage: 8,  label: "Adventurer",       minXp: 620,  scale: 1.07 },
  { stage: 9,  label: "Explorer",         minXp: 820,  scale: 1.12 },
  { stage: 10, label: "Learner",          minXp: 1060, scale: 1.18 },
  { stage: 11, label: "Helper",           minXp: 1350, scale: 1.23 },
  { stage: 12, label: "Friend",           minXp: 1700, scale: 1.28 },
  { stage: 13, label: "Big Kid",          minXp: 2120, scale: 1.33 },
  { stage: 14, label: "Teen Pet",         minXp: 2620, scale: 1.39 },
  { stage: 15, label: "Young Adult",      minXp: 3220, scale: 1.44 },
  { stage: 16, label: "Adult",            minXp: 3940, scale: 1.49 },
  { stage: 17, label: "Wise Adult",       minXp: 4800, scale: 1.54 },
  { stage: 18, label: "Master Companion", minXp: 5820, scale: 1.60 },
  { stage: 19, label: "Legendary Friend", minXp: 7020, scale: 1.65 },
  { stage: 20, label: "Fully Grown",      minXp: 8400, scale: 1.70 },
];

// What the pet "knows" about the child's learning — the single source of truth
// for XP, growth and accessory unlocks. Everything here is derived from real
// learning data so growth and rewards can never be farmed by tapping.
export interface PetLearningContext {
  questions: number;       // total questions answered
  games: number;           // games completed
  daily: number;           // daily challenges completed
  points: number;          // total points earned (lifetime)
  streakDays: number;
  badges: number;          // milestone badges earned
  hasReadingBadge: boolean;
  hasMathsBadge: boolean;
  hasScienceBadge: boolean;
  lastLearnAt?: string;    // most recent game played
  xp: number;
  stage: GrowthStage;
}

export function buildPetContext(results: GameResult[], streakDays: number): PetLearningContext {
  const questions = results.reduce((s, r) => s + r.total, 0);
  const correct = results.reduce((s, r) => s + r.score, 0);
  const games = results.length;
  const daily = results.filter(r => r.gameId === "daily-challenge").length;
  const points = computeTotalPoints(results);
  const badges = getEarnedMilestoneBadges(results).length;
  const hasReadingBadge = results.filter(g => g.category === "reading").length >= 1;
  const hasMathsBadge = results.filter(g => g.category === "maths").length >= 3;
  const hasScienceBadge = results.filter(g => g.category === "science").length >= 1;
  const lastLearnAt = results.reduce<string | undefined>(
    (latest, r) => (!latest || r.playedAt > latest ? r.playedAt : latest), undefined
  );

  // Learning-weighted XP — kept deliberately SMALL so the pet grows slowly over
  // weeks of real learning. Correctly-answered questions are the steady drip,
  // with gentle bonuses for finishing games, daily challenges, keeping a streak
  // and earning badges. A single ~10-question game only adds a handful of XP.
  const xp = correct * 2 + games * 5 + daily * 12 + streakDays * 6 + badges * 15;
  const stage = stageForXp(xp);

  return { questions, games, daily, points, streakDays, badges, hasReadingBadge, hasMathsBadge, hasScienceBadge, lastLearnAt, xp, stage };
}

export function stageForXp(xp: number): GrowthStage {
  let current = GROWTH_STAGES[0];
  for (const s of GROWTH_STAGES) if (xp >= s.minXp) current = s;
  return current;
}

// Progress toward the next stage (null when fully grown).
export function nextStageProgress(xp: number): { next: GrowthStage; into: number; span: number; pct: number } | null {
  const cur = stageForXp(xp);
  const next = GROWTH_STAGES.find(s => s.stage === cur.stage + 1);
  if (!next) return null;
  const span = next.minXp - cur.minXp;
  const into = xp - cur.minXp;
  return { next, into, span, pct: Math.max(0, Math.min(100, Math.round((into / span) * 100))) };
}

// ---------------------------------------------------------------------------
// Care needs — timestamp based so they keep counting while the app is closed.
// level = 100 just after caring, draining to 0 over the need's period.
// ---------------------------------------------------------------------------
export type NeedKey = "hunger" | "thirst" | "cleanliness" | "energy" | "happiness" | "learning";
export type PetNeeds = Record<NeedKey, number>;

export interface NeedMeta {
  key: NeedKey;
  label: string;
  emoji: string;
  color: string;     // tailwind bg for the filled bar
  lowMsg: (petName: string) => string;
}

export const NEED_META: NeedMeta[] = [
  { key: "hunger",      label: "Food",     emoji: "🍖", color: "bg-orange-400", lowMsg: n => `${n} is getting hungry!` },
  { key: "thirst",      label: "Water",    emoji: "💧", color: "bg-sky-400",    lowMsg: n => `${n} is thirsty!` },
  { key: "cleanliness", label: "Clean",    emoji: "🛁", color: "bg-cyan-400",   lowMsg: n => `${n} would love a bath!` },
  { key: "energy",      label: "Energy",   emoji: "🌙", color: "bg-indigo-400", lowMsg: n => `${n} is feeling sleepy!` },
  { key: "happiness",   label: "Fun",      emoji: "💛", color: "bg-pink-400",   lowMsg: n => `${n} wants to play!` },
  { key: "learning",    label: "Learning", emoji: "📚", color: "bg-emerald-400",lowMsg: n => `${n} wants to learn with you!` },
];

const HOUR = 3600 * 1000;
const NEED_PERIOD_MS: Record<NeedKey, number> = {
  thirst: 2 * HOUR,
  cleanliness: 3 * HOUR,
  happiness: 3 * HOUR,
  hunger: 4 * HOUR,
  energy: 6 * HOUR,
  learning: 24 * HOUR,
};

function clamp100(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }

function levelFor(lastIso: string | undefined, period: number, now: number): number {
  if (!lastIso) return 100;
  const elapsed = now - new Date(lastIso).getTime();
  if (elapsed <= 0) return 100;
  return clamp100(100 - (elapsed / period) * 100);
}

// Needs derive from the pet's care timestamps; learning derives from the most
// recent game the child played (so doing lessons keeps the pet's learning bar up).
export function computePetNeeds(pet: PetState, lastLearnAt: string | undefined, now: number = Date.now()): PetNeeds {
  return {
    hunger: levelFor(pet.lastFedTime, NEED_PERIOD_MS.hunger, now),
    thirst: levelFor(pet.lastWaterTime, NEED_PERIOD_MS.thirst, now),
    cleanliness: levelFor(pet.lastBathTime, NEED_PERIOD_MS.cleanliness, now),
    energy: levelFor(pet.lastSleepTime, NEED_PERIOD_MS.energy, now),
    happiness: levelFor(pet.lastPlayTime, NEED_PERIOD_MS.happiness, now),
    learning: levelFor(lastLearnAt ?? pet.acquiredAt, NEED_PERIOD_MS.learning, now),
  };
}

export function overallMood(needs: PetNeeds): { emoji: string; label: string } {
  const avg = (needs.hunger + needs.thirst + needs.cleanliness + needs.energy + needs.happiness + needs.learning) / 6;
  if (avg >= 80) return { emoji: "🤩", label: "Thriving" };
  if (avg >= 60) return { emoji: "😊", label: "Happy" };
  if (avg >= 40) return { emoji: "🙂", label: "Okay" };
  if (avg >= 20) return { emoji: "🥺", label: "Needs you" };
  return { emoji: "😴", label: "Missing you" };
}

// ---------------------------------------------------------------------------
// Care actions — they refill a need and save a timestamp, but NEVER grow the
// pet (growth is learning-only). Each maps to the timestamp it refreshes.
// ---------------------------------------------------------------------------
export type CareAction = "feed" | "water" | "bath" | "sleep" | "play";

export interface CareMeta {
  action: CareAction;
  label: string;
  emoji: string;
  need: NeedKey;
  done: (petName: string) => string;
  color: string; // tailwind classes for the button
}

export const CARE_ACTIONS: CareMeta[] = [
  { action: "feed",  label: "Feed",  emoji: "🍖", need: "hunger",      done: n => `Yum! ${n} loved that!`,     color: "bg-orange-500 hover:bg-orange-600" },
  { action: "water", label: "Water", emoji: "💧", need: "thirst",      done: n => `Glug glug! ${n} feels fresh!`, color: "bg-sky-500 hover:bg-sky-600" },
  { action: "bath",  label: "Bath",  emoji: "🛁", need: "cleanliness", done: n => `Splash! ${n} is sparkling clean!`, color: "bg-cyan-500 hover:bg-cyan-600" },
  { action: "sleep", label: "Rest",  emoji: "🌙", need: "energy",      done: n => `Zzz… ${n} feels rested!`,    color: "bg-indigo-500 hover:bg-indigo-600" },
  { action: "play",  label: "Play",  emoji: "🎾", need: "happiness",   done: n => `Wheee! ${n} had so much fun!`, color: "bg-pink-500 hover:bg-pink-600" },
];

export const CARE_TIMESTAMP_FIELD: Record<CareAction, keyof PetState> = {
  feed: "lastFedTime",
  water: "lastWaterTime",
  bath: "lastBathTime",
  sleep: "lastSleepTime",
  play: "lastPlayTime",
};

// ---------------------------------------------------------------------------
// Accessories — all unlocked by LEARNING milestones (free + automatic), so the
// pet's wardrobe rewards lessons. One item may be equipped per slot.
// ---------------------------------------------------------------------------
export type AccessorySlot = "hat" | "face" | "neck" | "cape" | "room";

export interface AccessoryUnlock {
  kind: "questions" | "games" | "daily" | "streak" | "points" | "stage" | "reading" | "maths" | "science";
  value?: number;
}

export interface Accessory {
  id: string;
  name: string;
  emoji: string;
  slot: AccessorySlot;
  unlock: AccessoryUnlock;
  hint: string;
}

export const ACCESSORIES: Accessory[] = [
  // Hats
  { id: "flower",   name: "Flower",      emoji: "🌸", slot: "hat",  unlock: { kind: "questions", value: 10 }, hint: "Answer 10 questions" },
  { id: "partyhat", name: "Party Hat",   emoji: "🎉", slot: "hat",  unlock: { kind: "games", value: 5 },      hint: "Complete 5 games" },
  { id: "bow",      name: "Big Bow",     emoji: "🎀", slot: "hat",  unlock: { kind: "daily", value: 3 },      hint: "Do 3 daily challenges" },
  { id: "wizard",   name: "Wizard Hat",  emoji: "🧙", slot: "hat",  unlock: { kind: "points", value: 500 },   hint: "Earn 500 points" },
  { id: "crown",    name: "Royal Crown", emoji: "👑", slot: "hat",  unlock: { kind: "stage", value: 8 },      hint: "Reach growth stage 8" },
  // Face
  { id: "glasses",  name: "Glasses",     emoji: "👓", slot: "face", unlock: { kind: "reading" },              hint: "Earn a reading badge" },
  { id: "shades",   name: "Sunglasses",  emoji: "🕶️", slot: "face", unlock: { kind: "questions", value: 25 }, hint: "Answer 25 questions" },
  { id: "headphones", name: "Headphones",emoji: "🎧", slot: "face", unlock: { kind: "points", value: 1000 },  hint: "Earn 1,000 points" },
  // Neck
  { id: "starcollar", name: "Star Collar", emoji: "⭐", slot: "neck", unlock: { kind: "maths" },              hint: "Earn a maths badge" },
  { id: "scarf",    name: "Cosy Scarf",  emoji: "🧣", slot: "neck", unlock: { kind: "streak", value: 3 },     hint: "Keep a 3-day streak" },
  { id: "medal",    name: "Gold Medal",  emoji: "🏅", slot: "neck", unlock: { kind: "daily", value: 5 },      hint: "Do 5 daily challenges" },
  // Cape / back
  { id: "backpack", name: "Backpack",    emoji: "🎒", slot: "cape", unlock: { kind: "questions", value: 50 }, hint: "Answer 50 questions" },
  { id: "cape",     name: "Hero Cape",   emoji: "🦸", slot: "cape", unlock: { kind: "stage", value: 12 },     hint: "Reach growth stage 12" },
  // Room decor
  { id: "balloons", name: "Balloons",    emoji: "🎈", slot: "room", unlock: { kind: "games", value: 3 },      hint: "Complete 3 games" },
  { id: "plant",    name: "Plant",       emoji: "🪴", slot: "room", unlock: { kind: "science" },              hint: "Earn a science badge" },
  { id: "poster",   name: "Poster",      emoji: "🖼️", slot: "room", unlock: { kind: "games", value: 15 },     hint: "Complete 15 games" },
  { id: "lamp",     name: "Star Lamp",   emoji: "🪔", slot: "room", unlock: { kind: "points", value: 250 },   hint: "Earn 250 points" },
];

export function isAccessoryUnlocked(acc: Accessory, ctx: PetLearningContext): boolean {
  const u = acc.unlock;
  switch (u.kind) {
    case "questions": return ctx.questions >= (u.value ?? 0);
    case "games":     return ctx.games >= (u.value ?? 0);
    case "daily":     return ctx.daily >= (u.value ?? 0);
    case "streak":    return ctx.streakDays >= (u.value ?? 0);
    case "points":    return ctx.points >= (u.value ?? 0);
    case "stage":     return ctx.stage.stage >= (u.value ?? 0);
    case "reading":   return ctx.hasReadingBadge;
    case "maths":     return ctx.hasMathsBadge;
    case "science":   return ctx.hasScienceBadge;
    default:          return false;
  }
}

export function unlockedAccessories(ctx: PetLearningContext): Accessory[] {
  return ACCESSORIES.filter(a => isAccessoryUnlocked(a, ctx));
}

export function getAccessory(id: string): Accessory | undefined {
  return ACCESSORIES.find(a => a.id === id);
}

// A fresh pet with all needs full (timestamps = now). Used for adoption AND for
// changing pets (which resets care/growth state but keeps learning data).
export function makeNewPet(species: string, petName?: string): PetState {
  const now = new Date().toISOString();
  return {
    species,
    petName: petName?.trim() || undefined,
    acquiredAt: now,
    lastFedTime: now,
    lastWaterTime: now,
    lastBathTime: now,
    lastSleepTime: now,
    lastPlayTime: now,
    accessoriesEquipped: [],
    history: [{ id: Math.random().toString(36).slice(2, 11), type: "adopt", label: `${getSpecies(species).name} joined the family!`, emoji: getSpecies(species).emoji, at: now }],
  };
}
