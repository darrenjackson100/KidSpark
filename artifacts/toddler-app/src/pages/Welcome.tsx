import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAppContext, ChildProfile } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";
import { PasscodeCreate } from "@/components/PasscodeGate";
import { makeDefaultRewards } from "@/lib/rewards";
import { PointsGuide } from "@/components/PointsGuide";
import { makeNewPet, getSpecies } from "@/lib/pets";
import { isValidChildName, normalizeChildName, NAME_ERROR_CREATE } from "@/lib/name";
import PetPicker from "@/components/pet/PetPicker";

const AGE_RANGES: { value: ChildProfile["ageRange"]; label: string; emoji: string }[] = [
  { value: "3-4", label: "3–4 Years", emoji: "🌱" },
  { value: "5-6", label: "5–6 Years", emoji: "🌟" },
  { value: "7-8", label: "7–8 Years", emoji: "🚀" },
];

const PROFILE_GRADIENTS = [
  "from-blue-400 to-blue-600",
  "from-orange-400 to-orange-600",
  "from-green-400 to-green-600",
  "from-purple-400 to-purple-600",
  "from-pink-400 to-pink-600",
  "from-teal-400 to-teal-600",
];

const DEFAULT_AVATARS = ["🦁", "🐼", "🦊", "🐸", "🦋", "🐙"];

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { profiles, addProfile, setActiveProfile, hasPasscode, setPasscode, unlockAdult } = useAppContext();
  const [showAddForm, setShowAddForm] = useState(profiles.length === 0);
  const [showPasscodeSetup, setShowPasscodeSetup] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [ageRange, setAgeRange] = useState<ChildProfile["ageRange"]>("3-4");
  const [mode, setMode] = useState<"parent" | "teacher">("parent");
  const [pointsEnabled, setPointsEnabled] = useState(false);
  const [petSpecies, setPetSpecies] = useState<string | undefined>();

  const handlePlay = (profileId: string) => {
    sounds.pop();
    setActiveProfile(profileId);
    setLocation("/home");
  };

  const createProfileAndGo = () => {
    addProfile({
      name: normalizeChildName(name),
      ageRange,
      mode,
      pointsEnabled,
      requireApproval: false,
      rewards: pointsEnabled ? makeDefaultRewards() : [],
      pet: petSpecies ? makeNewPet(petSpecies) : undefined,
    });
    setLocation("/home");
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Names must be letters and spaces only (this also catches empty/whitespace)
    // so every reading, writing and speech activity works.
    if (!isValidChildName(name)) {
      setNameError(NAME_ERROR_CREATE);
      return;
    }
    // On very first setup, require an adult passcode before continuing.
    if (!hasPasscode) {
      sounds.pop();
      setShowPasscodeSetup(true);
      return;
    }
    sounds.celebrate();
    createProfileAndGo();
  };

  if (showPasscodeSetup) {
    return (
      <PasscodeCreate
        title="Set an Adult Passcode"
        subtitle="Create a 1–4 digit passcode for grown-ups. It keeps progress, notes and settings safe from little fingers."
        onDone={(code) => { setPasscode(code); unlockAdult(); sounds.celebrate(); createProfileAndGo(); }}
        onBack={() => { sounds.click(); setShowPasscodeSetup(false); }}
      />
    );
  }

  if (showAddForm) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          className="max-w-lg w-full bg-card rounded-[2.5rem] shadow-2xl p-8 border-4 border-card-border">
          <div className="text-center mb-8">
            <motion.h1 animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }}
              className="text-5xl font-black text-primary mb-2">KidSpark ✨</motion.h1>
            <p className="text-xl text-muted-foreground font-bold">Set up a new child profile!</p>
          </div>
          <form onSubmit={handleAddSubmit} className="space-y-6">
            <div>
              <label className="text-2xl font-black text-foreground block mb-2">Child's Name</label>
              <input value={name} onChange={e => { setName(e.target.value); if (nameError) setNameError(null); }} placeholder="e.g. Lily"
                className={`w-full text-2xl h-16 rounded-2xl px-6 border-4 bg-background focus:outline-none font-bold ${nameError ? "border-red-400 focus:border-red-500" : "border-border focus:border-primary"}`}
                data-testid="input-child-name" required />
              {nameError && (
                <p className="mt-2 text-base font-black text-red-600" data-testid="text-name-error">❌ {nameError}</p>
              )}
            </div>
            <div>
              <label className="text-2xl font-black text-foreground block mb-2">Age Range</label>
              <div className="grid grid-cols-3 gap-3">
                {AGE_RANGES.map(a => (
                  <button key={a.value} type="button" onClick={() => { sounds.click(); setAgeRange(a.value); }}
                    className={`h-24 rounded-2xl border-4 flex flex-col items-center justify-center gap-1 text-lg font-black transition-all ${
                      ageRange === a.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                    }`} data-testid={`button-age-${a.value}`}>
                    <span className="text-3xl">{a.emoji}</span>{a.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-2xl font-black text-foreground block mb-2">Setting this up as a:</label>
              <div className="grid grid-cols-2 gap-3">
                {(["parent", "teacher"] as const).map(m => (
                  <button key={m} type="button" onClick={() => { sounds.click(); setMode(m); }}
                    className={`h-20 rounded-2xl border-4 flex items-center justify-center gap-2 text-xl font-black capitalize transition-all ${
                      mode === m ? "border-secondary bg-secondary/10 text-secondary" : "border-border text-muted-foreground hover:bg-muted"
                    }`}>
                    {m === "parent" ? "👨‍👧" : "👩‍🏫"} {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-2xl font-black text-foreground block mb-2">Points & Rewards Shop?</label>
              <p className="text-sm font-bold text-muted-foreground mb-3">Let {name.trim() || "your child"} earn points from learning and spend them on rewards you choose. You stay in control.</p>
              <button type="button" onClick={() => { sounds.click(); setPointsEnabled(v => !v); }}
                className={`w-full h-16 rounded-2xl border-4 flex items-center justify-between px-5 text-xl font-black transition-all ${
                  pointsEnabled ? "border-secondary bg-secondary/10 text-secondary" : "border-border bg-muted text-muted-foreground"
                }`}
                role="switch" aria-checked={pointsEnabled}
                data-testid="toggle-points-enabled">
                <span>{pointsEnabled ? "🎁 Rewards Shop ON" : "Rewards Shop OFF"}</span>
                <span className={`relative w-14 h-8 rounded-full flex-shrink-0 transition-colors ${pointsEnabled ? "bg-green-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${pointsEnabled ? "translate-x-6" : "translate-x-0"}`} />
                </span>
              </button>
              {pointsEnabled && <div className="mt-3"><PointsGuide /></div>}
            </div>

            <div>
              <label className="text-2xl font-black text-foreground block mb-2">Choose a Pet 🐾 <span className="text-sm font-bold text-muted-foreground">(optional)</span></label>
              <p className="text-sm font-bold text-muted-foreground mb-3">Pick a little friend that grows as {name.trim() || "your child"} learns. You can also adopt one later.</p>
              <PetPicker selected={petSpecies} onSelect={s => setPetSpecies(prev => prev === s ? undefined : s)} compact />
              {petSpecies && (
                <p className="text-sm font-black text-primary mt-2 text-center">{getSpecies(petSpecies).emoji} {getSpecies(petSpecies).name} is coming home!</p>
              )}
            </div>

            <div className="flex gap-4 pt-2">
              {profiles.length > 0 && (
                <button type="button" onClick={() => { sounds.click(); setShowAddForm(false); }}
                  className="flex-1 h-16 rounded-2xl border-4 border-border text-xl font-black text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
              )}
              <button type="submit"
                className="flex-1 h-16 rounded-2xl text-2xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg transition-colors"
                data-testid="button-create-profile">
                Let's Go! 🚀
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center">
      <div className="text-center mb-10">
        <motion.h1 animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 3 }}
          className="text-6xl font-black text-primary mb-3 drop-shadow-sm">KidSpark ✨</motion.h1>
        <p className="text-2xl text-muted-foreground font-bold">Who is playing today?</p>
      </div>

      <div className="flex flex-wrap justify-center gap-6 max-w-5xl">
        {profiles.map((profile, idx) => (
          <motion.div key={profile.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, type: "spring" }}
            className="w-60 bg-card rounded-[2.5rem] shadow-xl p-6 border-4 border-card-border flex flex-col items-center relative"
            data-testid={`card-profile-${profile.id}`}>

            {/* Edit button */}
            <button
              onClick={e => { e.stopPropagation(); sounds.click(); setLocation(`/edit-profile/${profile.id}`); }}
              className="absolute top-4 right-4 h-10 w-10 rounded-xl bg-muted hover:bg-muted/70 border-2 border-border text-lg flex items-center justify-center transition-colors"
              title="Edit profile"
              data-testid={`button-edit-profile-${profile.id}`}>
              ✏️
            </button>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => handlePlay(profile.id)}
              className={`w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br ${PROFILE_GRADIENTS[idx % PROFILE_GRADIENTS.length]} flex items-center justify-center mb-4 text-5xl shadow-lg cursor-pointer`}>
              {profile.avatarPhoto
                ? <img src={profile.avatarPhoto} alt={`${profile.name}'s photo`} className="w-full h-full object-cover" />
                : (profile.avatarEmoji ?? DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length])}
            </motion.div>

            <h2 className="text-2xl font-black text-foreground mb-1">{profile.name}</h2>
            <p className="text-base font-bold text-muted-foreground mb-1">
              {AGE_RANGES.find(a => a.value === profile.ageRange)?.label ?? profile.ageRange}
            </p>
            <p className="text-sm font-bold text-muted-foreground capitalize mb-4">{profile.mode}</p>

            {profile.streakDays && profile.streakDays > 1 && (
              <div className="bg-orange-100 text-orange-600 rounded-full px-4 py-1 text-sm font-black mb-4">
                🔥 {profile.streakDays} day streak!
              </div>
            )}

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => handlePlay(profile.id)}
              className="w-full h-14 rounded-2xl text-xl font-black bg-secondary hover:bg-secondary/90 text-white shadow-md transition-colors">
              Play! 🎮
            </motion.button>
          </motion.div>
        ))}

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="w-60 bg-muted/50 rounded-[2.5rem] border-4 border-dashed border-border p-6 flex flex-col items-center justify-center cursor-pointer min-h-[290px]"
          onClick={() => { sounds.click(); setShowAddForm(true); }}
          data-testid="button-add-new-child">
          <div className="w-20 h-20 rounded-full bg-background border-4 border-border flex items-center justify-center mb-4 text-4xl text-muted-foreground">+</div>
          <h2 className="text-xl font-black text-muted-foreground text-center">Add New Child</h2>
        </motion.div>
      </div>
    </div>
  );
}
