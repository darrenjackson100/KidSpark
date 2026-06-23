import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext, type PetState } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";
import { THEMES, type ThemeDef } from "@/lib/themes";
import PetAvatar, { PetAction } from "@/components/pet/PetAvatar";
import PetCharacter, { type PetExpression } from "@/components/pet/PetCharacter";
import PetPicker from "@/components/pet/PetPicker";
import {
  getSpecies, buildPetContext, computePetNeeds, overallMood,
  NEED_META, CARE_ACTIONS,
  type CareAction, type CareMeta, type NeedKey,
} from "@/lib/pets";

import roomBgGirlPhone from "@assets/GirlPhone.png";
import roomBgBoyPhone from "@assets/BoyPhone.png";
import roomBgNeutralPhone from "@assets/NeutralPhone.png";

import roomBgGirl from "@assets/Girl.png";
import roomBgBoy from "@assets/Boy.png";
import roomBgNeutral from "@assets/Neutral.png";

// Maps a care action to the body animation the pet plays.
const CARE_TO_ACTION: Record<CareAction, PetAction> = {
  feed: "eat", water: "drink", bath: "bath", sleep: "sleep", play: "play",
};

// First-person speech the pet "says" when a need is low — gentle, never scary.
const NEED_SPEECH: Record<NeedKey, string> = {
  hunger: "I'm getting a little hungry…",
  thirst: "I'm a bit thirsty!",
  cleanliness: "Can I have a bubbly bath?",
  energy: "I'm feeling sleepy…",
  happiness: "Can we play together?",
  learning: "Can we learn something today?",
};

const HAPPY_LINES = [
  "I missed you!",
  "I feel so cosy!",
  "Thank you for looking after me!",
  "Great job learning today!",
  "I'm so happy you're here!",
  "Let's learn together!",
  "It's great to see you again!",
];

// ---------------------------------------------------------------------------
// Pet-room background image. We collapse the 10 visual themes into three
// child-friendly families (girl / boy / neutral) via theme.suggestedFor, and
// pick the matching uploaded room photo as the full-bleed scene background.
type DecorFamily = "girl" | "boy" | "neutral";

function familyOf(theme: ThemeDef): DecorFamily {
  return (theme.suggestedFor?.[0] as DecorFamily) ?? "neutral";
}

const ROOM_BG: Record<DecorFamily, string> = {
  girl: roomBgGirl,
  boy: roomBgBoy,
  neutral: roomBgNeutral,
};
const ROOM_BG_PHONE: Record<DecorFamily, string> = {
  girl: roomBgGirlPhone,
  boy: roomBgBoyPhone,
  neutral: roomBgNeutralPhone,
};
export default function PetRoom() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();

  useEffect(() => { if (!activeProfile) setLocation("/"); }, [activeProfile, setLocation]);
  if (!activeProfile) return null;

  // No pet yet → adoption flow (also covers existing profiles created before pets).
  if (!activeProfile.pet) return <AdoptView />;

  return <PetRoomInner key={activeProfile.id} />;
}

// ---------------------------------------------------------------------------
// Adoption — choose a pet (and optionally name it).
// ---------------------------------------------------------------------------
function AdoptView() {
  const [, setLocation] = useLocation();
  const { activeProfile, choosePet } = useAppContext();
  const [species, setSpecies] = useState<string | undefined>();
  const [petName, setPetName] = useState("");

  if (!activeProfile) return null;

  const adopt = () => {
    if (!species) return;
    sounds.celebrate();
    choosePet(activeProfile.id, species, petName);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground">Choose Your Pet 🐾</h1>
          <button onClick={() => { sounds.click(); setLocation("/home"); }}
            className="h-12 px-5 rounded-2xl border-4 border-border bg-muted hover:bg-muted/70 text-base font-black text-muted-foreground"
            data-testid="button-pet-back">← Back</button>
        </div>

        <div className="bg-card rounded-[2rem] border-4 border-card-border shadow-lg p-5 sm:p-7 space-y-6">
          <p className="text-lg font-bold text-muted-foreground">
            Pick a little friend for {activeProfile.name}. Learning together helps your pet grow!
          </p>

          {/* Preview of the chosen pet */}
          <AnimatePresence>
            {species && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="flex flex-col items-center gap-2 py-2">
                <PetAvatar species={species} sizeRem={6} action="celebrate" burst={1} />
                <p className="text-xl font-black text-foreground">{getSpecies(species).name}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <PetPicker selected={species} onSelect={setSpecies} />

          <div>
            <label className="block text-xl font-black text-foreground mb-2">Pet's Name <span className="text-sm font-bold text-muted-foreground">(optional)</span></label>
            <input value={petName} onChange={e => setPetName(e.target.value)} maxLength={16}
              placeholder={species ? getSpecies(species).name : "e.g. Buddy"}
              className="w-full text-xl h-14 rounded-2xl px-5 border-4 border-border bg-background focus:outline-none focus:border-primary font-bold"
              data-testid="input-pet-name" />
          </div>

          <button onClick={adopt} disabled={!species}
            className="w-full h-16 rounded-2xl text-2xl font-black bg-primary hover:bg-primary/90 disabled:opacity-40 text-white shadow-lg transition-all"
            data-testid="button-adopt-pet">
            {species ? `Adopt ${petName.trim() || getSpecies(species).name}! 🎉` : "Pick a pet above"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main pet room — a single clean scene + care buttons. No tabs, no XP numbers.
// ---------------------------------------------------------------------------
function PetRoomInner() {
  const [, setLocation] = useLocation();
  const { activeProfile, gameResults, petCareAction } = useAppContext();

  const [action, setAction] = useState<PetAction>("idle");
  const [burst, setBurst] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recompute needs every minute so bars drift down live while the screen is open.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const pet = activeProfile!.pet!;
  const childId = activeProfile!.id;
  const sp = getSpecies(pet.species);
  const petName = pet.petName || sp.name;

  const myResults = useMemo(() => gameResults.filter(r => r.childId === childId), [gameResults, childId]);
  const ctx = useMemo(() => buildPetContext(myResults, activeProfile!.streakDays ?? 0), [myResults, activeProfile]);
  const needs = useMemo(() => computePetNeeds(pet, ctx.lastLearnAt), [pet, ctx.lastLearnAt]);
  const mood = overallMood(needs);

  // The pet's resting face reflects how it feels: sleepy when low on energy,
  // a little sad when a need is really low, otherwise happy.
  const idleMood: PetExpression = useMemo(() => {
    const lowest = Math.min(...NEED_META.map(m => needs[m.key]));
    if (needs.energy < 28) return "sleepy";
    if (lowest < 22) return "sad";
    return "happy";
  }, [needs]);

  // Friendly speech bubble — always MATCHES the lowest status bar: whichever
  // need is lowest, the pet asks for that care. Only when every bar is near-full
  // does it switch to a cheerful line instead of nagging.
  const speech = useMemo(() => {
    const lowest = NEED_META.map(m => ({ m, v: needs[m.key] })).sort((a, b) => a.v - b.v)[0];
    if (lowest && lowest.v < 60) return NEED_SPEECH[lowest.m.key];
    return HAPPY_LINES[tick % HAPPY_LINES.length];
  }, [needs, tick]);

  const theme = THEMES[activeProfile!.theme ?? "default"] ?? THEMES.default;

  const flashAction = (a: PetAction, ms = 2300) => {
    setAction(a);
    setBurst(b => b + 1);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setAction("idle"); setToast(null); }, ms);
  };

  const doCare = (care: CareMeta) => {
    sounds.correct();
    petCareAction(childId, care.action);
    setToast(care.done(petName));
    flashAction(CARE_TO_ACTION[care.action]);
  };

  const tapPet = () => {
    sounds.pop();
    setToast(`${petName} loves you! 💖`);
    flashAction("tap", 1400);
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-2xl bg-card border-2 border-card-border p-1 flex items-end justify-center overflow-hidden">
              <PetCharacter species={pet.species} expression="happy" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground truncate">{petName}</h1>
              <p className="text-sm sm:text-base font-bold text-muted-foreground">
                {mood.emoji} {mood.label} · {ctx.stage.label}
              </p>
            </div>
          </div>
          <button onClick={() => { sounds.click(); setLocation("/home"); }}
            className="h-11 sm:h-12 px-4 sm:px-5 rounded-2xl border-4 border-border bg-muted hover:bg-muted/70 text-sm sm:text-base font-black text-muted-foreground flex-shrink-0"
            data-testid="button-pet-back">← Home</button>
        </header>

        <RoomTab
          theme={theme} pet={pet} action={action} burst={burst} scale={ctx.stage.scale}
          needs={needs} petName={petName} toast={toast} mood={idleMood} speech={speech}
          onTapPet={tapPet} onCare={doCare} onLearn={() => { sounds.pop(); setLocation("/home"); }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The pet room: a full-bleed uploaded room photo (chosen by profile family —
// girl / boy / neutral) as the background, with the pet idling on top centred
// near the rug, a speech bubble pinned directly above the pet's head, a premium
// row of care buttons, and always-visible status bars.
// No tabs, no unlocks, no XP numbers, no Dress Up.
function RoomTab({
  theme, pet, action, burst, scale, needs, petName, toast, mood, speech,
  onTapPet, onCare, onLearn,
}: {
  theme: (typeof THEMES)[string];
  pet: PetState;
  action: PetAction; burst: number; scale: number;
  needs: Record<NeedKey, number>;
  petName: string; toast: string | null;
  mood: PetExpression; speech: string;
  onTapPet: () => void; onCare: (c: CareMeta) => void; onLearn: () => void;
}) {
  const bubble = toast ?? speech;
const family = familyOf(theme);
const roomBg = ROOM_BG[family];
const roomBgPhone = ROOM_BG_PHONE[family];

  return (
    <div className="space-y-4">
      {/* ===== Pet room: uploaded background photo + pet on top ===== */}
      <div className="relative overflow-hidden rounded-[2rem] border-4 border-card-border shadow-lg bg-card"
        style={{ height: "clamp(24rem, 62vh, 34rem)" }} data-testid="pet-scene">
        {/* full-bleed room background — fills the area, keeps proportions
            (object-cover, never stretches) and favours the floor/rug centre so
            the pet sits naturally on the rug. Responsive across all sizes. */}
<picture>
  <source media="(max-width: 639px)" srcSet={roomBgPhone} />
  <img
    src={roomBg}
    alt=""
    aria-hidden
    draggable={false}
    className="pointer-events-none absolute inset-0 w-full h-full object-cover object-[center_70%] select-none"
    data-testid="room-background"
  />
</picture>

        {/* the pet, centered on the rug, with its speech bubble pinned directly
            above its head — the bubble lives in the same wrapper as the pet, so
            it always follows and scales with the pet and never covers the face */}
        <div className="absolute bottom-[7%] left-0 right-0 flex justify-center z-10">
          <div style={{ width: "min(78vw, 19rem)" }} className="relative flex justify-center">
            <AnimatePresence mode="wait">
              {bubble && (
                <motion.div key={bubble}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-max max-w-[14rem] text-center"
                  data-testid="pet-toast">
                  <div className="relative bg-white/95 text-foreground font-black text-sm sm:text-base px-4 py-2 rounded-3xl shadow-lg border-2 border-card-border">
                    {bubble}
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <PetAvatar species={pet.species} scale={scale} sizeRem={10}
              action={action} mood={mood} burst={burst} onTap={onTapPet} />
          </div>
        </div>
      </div>

      {/* clean care action bar — 6 equal buttons, centered + responsive */}
      <div className="bg-card rounded-[1.75rem] border-4 border-card-border shadow-md p-3 sm:p-4">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {CARE_ACTIONS.map(care => (
            <motion.button key={care.action} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
              onClick={() => onCare(care)}
              className={`grow-0 shrink-0 basis-[28%] sm:basis-[14%] rounded-2xl ${care.color} text-white font-black py-2.5 sm:py-3 flex flex-col items-center justify-center gap-1 shadow-md transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40`}
              data-testid={`button-care-${care.action}`}>
              <span className="text-2xl sm:text-3xl leading-none">{care.emoji}</span>
              <span className="text-[11px] sm:text-sm leading-none">{care.label}</span>
            </motion.button>
          ))}
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} onClick={onLearn}
            className="grow-0 shrink-0 basis-[28%] sm:basis-[14%] rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2.5 sm:py-3 flex flex-col items-center justify-center gap-1 shadow-md transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
            data-testid="button-care-learn">
            <span className="text-2xl sm:text-3xl leading-none">📚</span>
            <span className="text-[11px] sm:text-sm leading-none">Learn</span>
          </motion.button>
        </div>
        <p className="text-center text-xs sm:text-sm font-bold text-muted-foreground mt-3">
          Tap a button to care for {petName} — or tap {petName} for a cuddle! 🐾
        </p>
      </div>

      {/* always-visible status bars — how each of {petName}'s needs is doing */}
      <div className="bg-card rounded-[1.75rem] border-4 border-card-border shadow-md p-4 sm:p-5">
        <h2 className="text-lg sm:text-xl font-black text-foreground mb-3">How is {petName} feeling?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {NEED_META.map(meta => {
            const val = Math.round(needs[meta.key]);
            const low = val < 35;
            return (
              <div key={meta.key} className="rounded-2xl bg-muted/40 border-2 border-card-border/60 p-2.5 sm:p-3"
                data-testid={`need-${meta.key}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex-shrink-0 grid place-items-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white shadow-sm text-lg sm:text-xl"
                    aria-hidden>{meta.emoji}</span>
                  <span className="text-sm sm:text-base font-black text-foreground leading-tight">{meta.label}</span>
                  <span className={`ml-auto text-sm font-black tabular-nums ${low ? "text-red-500" : "text-muted-foreground"}`}>{val}%</span>
                </div>
                <div className="h-3 sm:h-3.5 rounded-full bg-black/10 overflow-hidden shadow-inner">
                  <motion.div className={`h-full rounded-full ${meta.color} shadow`}
                    initial={false} animate={{ width: `${Math.max(val, 4)}%` }} transition={{ duration: 0.5 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
