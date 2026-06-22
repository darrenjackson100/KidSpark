import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext, ChildProfile, ShopReward, RewardPurchase } from "@/context/AppContext";
import { useSoundContext } from "@/context/SoundContext";
import { THEMES, GENDER_DEFAULT_THEME } from "@/lib/themes";
import { sounds } from "@/lib/sounds";
import { speakPreview, DEFAULT_VOICE_SETTINGS } from "@/lib/speech";
import { PasscodeCreate, PasscodeEntry } from "@/components/PasscodeGate";
import { REWARD_EMOJIS, makeDefaultRewards } from "@/lib/rewards";
import { PointsGuide } from "@/components/PointsGuide";
import { computeBalance } from "@/lib/points";
import { getSpecies } from "@/lib/pets";
import { fileToAvatarDataUrl, ACCEPTED_IMAGE_EXTENSIONS } from "@/lib/image";
import { isValidChildName, normalizeChildName, NAME_ERROR_EXISTING } from "@/lib/name";
import PetPicker from "@/components/pet/PetPicker";

const AGE_RANGES: { value: ChildProfile["ageRange"]; label: string; emoji: string; desc: string }[] = [
  { value: "3-4", label: "3–4 Years", emoji: "🌱", desc: "Early Learning" },
  { value: "5-6", label: "5–6 Years", emoji: "🌟", desc: "Foundation" },
  { value: "7-8", label: "7–8 Years", emoji: "🚀", desc: "Developing" },
];

const GENDERS: { value: ChildProfile["gender"]; label: string; emoji: string; desc: string }[] = [
  { value: "girl",    label: "Girl",    emoji: "👧", desc: "She / Her" },
  { value: "boy",     label: "Boy",     emoji: "👦", desc: "He / Him" },
  { value: "neutral", label: "Neutral", emoji: "🌈", desc: "They / Any" },
];

const AVATARS = [
  "🦁","🐼","🦊","🐸","🦋","🐙","🦄","🐧",
  "🐶","🐱","🦅","🌟","🚀","🎨","⚽","🌈",
  "🦕","🐠","🦜","🐻","🐨","🦒","🐯","🌺",
  "🧸","🐝","🦔","🦩","🐳","🐉","🌻","🎪",
];

const THEME_LIST = Object.entries(THEMES);

export default function EditProfile() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { profiles } = useAppContext();
  const profile = profiles.find(p => p.id === params.id);

  useEffect(() => { if (!profile) setLocation("/"); }, [profile, setLocation]);
  if (!profile) return null;

  return <EditProfileInner profile={profile} />;
}

function EditProfileInner({ profile }: { profile: ChildProfile }) {
  const [, setLocation] = useLocation();
  const { editProfile, deleteProfile, setPasscode, addReward, updateReward, deleteReward, choosePet,
    adjustPoints, resetPoints, rewardPurchases, gameResults } = useAppContext();

  const [showChangePasscode, setShowChangePasscode] = useState(false);
  const [passcodeChanged, setPasscodeChanged] = useState(false);

  const [name, setName] = useState(profile.name);
  const [ageRange, setAgeRange] = useState<ChildProfile["ageRange"]>(profile.ageRange);
  const [mode, setMode] = useState<"parent" | "teacher">(profile.mode);
  const [avatar, setAvatar] = useState(profile.avatarEmoji ?? "🦁");
  const [avatarPhoto, setAvatarPhoto] = useState<string | undefined>(profile.avatarPhoto);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [gender, setGender] = useState<ChildProfile["gender"]>(profile.gender ?? "neutral");
  const [theme, setTheme] = useState<string>(profile.theme ?? "default");
  const [saved, setSaved] = useState(false);
  const [ageChanged, setAgeChanged] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "theme" | "rewards" | "points" | "pet">("profile");

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    try {
      const url = await fileToAvatarDataUrl(file);
      setAvatarPhoto(url);
      setPhotoError(null);
      sounds.pop();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Could not use that image.");
    }
  };
  const removePhoto = () => { sounds.click(); setAvatarPhoto(undefined); setPhotoError(null); };

  // Rewards Shop settings persist immediately (like the reward list itself).
  const pointsEnabled = profile.pointsEnabled ?? false;
  const requireApproval = profile.requireApproval ?? false;
  const rewards = profile.rewards ?? [];

  const togglePointsEnabled = () => {
    sounds.click();
    const next = !pointsEnabled;
    const updates: Partial<ChildProfile> = { pointsEnabled: next };
    if (next && rewards.length === 0) updates.rewards = makeDefaultRewards();
    editProfile(profile.id, updates);
  };
  const toggleRequireApproval = () => {
    sounds.click();
    editProfile(profile.id, { requireApproval: !requireApproval });
  };

  const handleAgeChange = (a: ChildProfile["ageRange"]) => {
    sounds.click();
    if (a !== profile.ageRange) setAgeChanged(true);
    setAgeRange(a);
  };

  const handleGenderChange = (g: ChildProfile["gender"]) => {
    sounds.click();
    setGender(g);
    if (!profile.theme) setTheme(GENDER_DEFAULT_THEME[g ?? "neutral"] ?? "default");
  };

  const nameInvalid = !isValidChildName(name);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // A letters-only name is required before any profile changes can be saved.
    if (nameInvalid) {
      sounds.click();
      setActiveTab("profile");
      return;
    }
    sounds.celebrate();
    editProfile(profile.id, { name: normalizeChildName(name), ageRange, mode, avatarEmoji: avatar, avatarPhoto, gender, theme });
    setSaved(true);
    setTimeout(() => setLocation("/home"), 2000);
  };

  const handleDelete = () => {
    sounds.click();
    deleteProfile(profile.id);
    setLocation("/");
  };

  if (showChangePasscode) {
    return (
      <PasscodeCreate
        title="Change Adult Passcode"
        subtitle="Choose a new 1–4 digit passcode for grown-up areas."
        onDone={(code) => {
          setPasscode(code);
          sounds.celebrate();
          setShowChangePasscode(false);
          setPasscodeChanged(true);
        }}
        onBack={() => { sounds.click(); setShowChangePasscode(false); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-5">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-green-500 text-white rounded-2xl px-6 py-4 mb-5 text-xl font-black text-center shadow-lg">
              ✅ Changes saved! {ageChanged && `${name} now sees ${ageRange}-year activities.`}
            </motion.div>
          )}
          {ageChanged && !saved && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border-4 border-amber-300 rounded-2xl px-6 py-4 mb-5 text-lg font-bold text-amber-800">
              🎂 Changing age range will show {name} new games for {AGE_RANGES.find(a => a.value === ageRange)?.label}. All previous scores are kept!
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-card rounded-[2.5rem] shadow-2xl border-4 border-card-border overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between p-6 border-b-4 border-card-border">
            <h1 className="text-3xl font-black text-foreground">Edit Profile</h1>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { sounds.click(); setLocation("/home"); }}
              className="h-12 px-5 rounded-2xl border-4 border-border bg-muted hover:bg-muted/70 text-base font-black text-muted-foreground">
              ← Back
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex border-b-4 border-card-border">
            {(["profile", "theme", "rewards", "points", "pet"] as const).map(tab => (
              <button key={tab} type="button" onClick={() => { sounds.click(); setActiveTab(tab); }}
                className={`flex-1 py-4 px-1 text-xs sm:text-lg font-black capitalize transition-colors ${activeTab === tab ? "bg-primary/10 text-primary border-b-4 border-primary" : "text-muted-foreground hover:bg-muted"}`}
                data-testid={`tab-${tab}`}>
                {tab === "profile" ? "👤 Profile" : tab === "theme" ? "🎨 Theme" : tab === "rewards" ? "🎁 Rewards" : tab === "points" ? "💰 Points" : "🐾 Pet"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSave} className="p-7 space-y-7">
            {activeTab === "profile" && (
              <>
                {/* Avatar preview */}
                <div className="flex items-center gap-5 bg-muted/50 rounded-3xl p-5">
                  <div className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-6xl shadow-lg bg-gradient-to-br ${THEMES[theme]?.gradientFrom ?? "from-blue-400"} ${THEMES[theme]?.gradientTo ?? "to-blue-600"}`}>
                    {avatarPhoto
                      ? <img src={avatarPhoto} alt={`${name || "Child"}'s photo`} className="w-full h-full object-cover" />
                      : avatar}
                  </div>
                  <div>
                    <p className="text-2xl font-black text-foreground">{name || "Name..."}</p>
                    <p className="text-base font-bold text-muted-foreground">{AGE_RANGES.find(a => a.value === ageRange)?.label} · {mode}</p>
                    <p className="text-base font-bold text-muted-foreground">{THEMES[theme]?.emoji} {THEMES[theme]?.label} theme</p>
                  </div>
                </div>

                {/* Profile photo */}
                <div>
                  <label className="block text-xl font-black text-foreground mb-3">Profile Photo</label>
                  <input ref={fileInputRef} type="file" accept={ACCEPTED_IMAGE_EXTENSIONS}
                    onChange={handlePhotoFile} className="hidden" data-testid="input-photo" />
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={() => { sounds.click(); fileInputRef.current?.click(); }}
                      className="h-14 px-6 rounded-2xl text-lg font-black bg-secondary hover:bg-secondary/90 text-white shadow-md transition-colors"
                      data-testid="button-upload-photo">
                      {avatarPhoto ? "🔄 Replace Photo" : "📷 Upload Photo"}
                    </button>
                    {avatarPhoto && (
                      <button type="button" onClick={removePhoto}
                        className="h-14 px-6 rounded-2xl text-lg font-black text-red-600 hover:bg-red-50 border-4 border-red-200 transition-colors"
                        data-testid="button-remove-photo">
                        🗑️ Remove Photo
                      </button>
                    )}
                  </div>
                  {photoError && (
                    <p className="mt-2 text-base font-black text-red-600" data-testid="text-photo-error">❌ {photoError}</p>
                  )}
                  <p className="mt-2 text-sm font-bold text-muted-foreground">
                    Use a JPG, PNG or WEBP photo, or pick an avatar below. A photo is shown instead of the avatar.
                  </p>
                </div>

                {/* Avatar grid */}
                <div>
                  <label className="block text-xl font-black text-foreground mb-3">Choose Avatar</label>
                  <div className="grid grid-cols-8 gap-2">
                    {AVATARS.map(a => (
                      <button key={a} type="button" onClick={() => { sounds.click(); setAvatar(a); }}
                        className={`text-3xl h-12 w-12 rounded-xl border-4 transition-all flex items-center justify-center ${avatar === a ? "border-primary bg-primary/10 scale-110 shadow-md" : "border-border hover:bg-muted"}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xl font-black text-foreground mb-3">Child's Name</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className={`w-full text-2xl h-16 rounded-2xl px-6 border-4 bg-background focus:outline-none font-bold ${nameInvalid ? "border-red-400 focus:border-red-500" : "border-border focus:border-primary"}`}
                    required data-testid="input-edit-name" />
                  {nameInvalid && (
                    <p className="mt-2 text-base font-black text-red-600" data-testid="text-name-error">❌ {NAME_ERROR_EXISTING}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xl font-black text-foreground mb-3">Gender <span className="text-sm font-bold text-muted-foreground">(suggests a theme)</span></label>
                  <div className="grid grid-cols-3 gap-3">
                    {GENDERS.map(g => (
                      <button key={g.value} type="button" onClick={() => handleGenderChange(g.value)}
                        className={`h-24 rounded-2xl border-4 flex flex-col items-center justify-center gap-1 transition-all ${gender === g.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                        <span className="text-3xl">{g.emoji}</span>
                        <span className="text-lg font-black">{g.label}</span>
                        <span className="text-xs font-bold opacity-70">{g.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Range */}
                <div>
                  <label className="block text-xl font-black text-foreground mb-3">Age Range</label>
                  <div className="grid grid-cols-3 gap-3">
                    {AGE_RANGES.map(a => (
                      <button key={a.value} type="button" onClick={() => handleAgeChange(a.value)}
                        className={`h-28 rounded-2xl border-4 flex flex-col items-center justify-center gap-1 transition-all ${ageRange === a.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                        data-testid={`button-age-${a.value}`}>
                        <span className="text-3xl">{a.emoji}</span>
                        <span className="text-lg font-black">{a.label}</span>
                        <span className="text-xs font-bold opacity-70">{a.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xl font-black text-foreground mb-3">Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["parent", "teacher"] as const).map(m => (
                      <button key={m} type="button" onClick={() => { sounds.click(); setMode(m); }}
                        className={`h-16 rounded-2xl border-4 flex items-center justify-center gap-2 text-xl font-black capitalize transition-all ${mode === m ? "border-secondary bg-secondary/10 text-secondary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                        {m === "parent" ? "👨‍👧" : "👩‍🏫"} {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice settings */}
                <VoiceSettingsSection />
              </>
            )}

            {activeTab === "rewards" && (
              <RewardsTab
                profile={profile}
                pointsEnabled={pointsEnabled}
                requireApproval={requireApproval}
                rewards={rewards}
                onTogglePoints={togglePointsEnabled}
                onToggleApproval={toggleRequireApproval}
                onAdd={addReward}
                onUpdate={updateReward}
                onDelete={deleteReward}
              />
            )}

            {activeTab === "theme" && (
              <div>
                <p className="text-xl font-bold text-muted-foreground mb-5">Choose a colour theme for {name || "this profile"}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {THEME_LIST.map(([key, def]) => (
                    <motion.button key={key} type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                      onClick={() => { sounds.click(); setTheme(key); }}
                      className={`rounded-3xl border-4 p-5 flex flex-col items-center gap-2 transition-all ${theme === key ? "border-primary shadow-lg scale-105" : "border-border hover:border-primary/40"}`}>
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${def.gradientFrom} ${def.gradientTo} flex items-center justify-center text-3xl shadow-md`}>
                        {def.emoji}
                      </div>
                      <span className="text-lg font-black text-foreground">{def.label}</span>
                      {def.suggestedFor && (
                        <span className="text-xs font-bold text-muted-foreground">
                          {def.suggestedFor.join(" · ")}
                        </span>
                      )}
                      {theme === key && <span className="text-primary text-xl">✓</span>}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "points" && (
              <ManagePointsTab
                profile={profile}
                balance={computeBalance(
                  gameResults.filter(r => r.childId === profile.id),
                  rewardPurchases.filter(p => p.childId === profile.id),
                )}
                history={rewardPurchases.filter(p => p.childId === profile.id)}
                onAdjust={adjustPoints}
                onReset={resetPoints}
              />
            )}

            {activeTab === "pet" && (
              <PetTab profile={profile} onChoosePet={choosePet} />
            )}

            {activeTab !== "pet" && activeTab !== "points" && (
              <div className="flex gap-4 pt-2">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="flex-1 h-16 rounded-2xl text-2xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg transition-colors"
                  data-testid="button-save-profile">
                  Save Changes ✅
                </motion.button>
              </div>
            )}

            <div className="pt-4 border-t-4 border-border">
              <label className="block text-xl font-black text-foreground mb-3">🔒 Adult Passcode</label>
              {passcodeChanged && (
                <p className="mb-3 text-base font-black text-green-600">✅ Passcode updated!</p>
              )}
              <button type="button" onClick={() => { sounds.click(); setPasscodeChanged(false); setShowChangePasscode(true); }}
                className="w-full h-14 rounded-2xl text-lg font-black text-secondary hover:bg-secondary/10 border-4 border-secondary/40 transition-colors"
                data-testid="button-change-passcode">
                🔑 Change Passcode
              </button>
            </div>

            <div className="pt-4 border-t-4 border-border">
              {!confirmDelete ? (
                <button type="button" onClick={() => { sounds.click(); setConfirmDelete(true); }}
                  className="w-full h-14 rounded-2xl text-lg font-black text-red-600 hover:bg-red-50 border-4 border-red-200 transition-colors"
                  data-testid="button-confirm-delete">
                  🗑️ Delete Profile
                </button>
              ) : (
                <div className="bg-red-50 border-4 border-red-300 rounded-2xl p-5 text-center space-y-3">
                  <p className="text-xl font-black text-red-700">Delete {profile.name}'s profile? This cannot be undone.</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setConfirmDelete(false)}
                      className="flex-1 h-14 rounded-2xl border-4 border-border font-black text-lg text-muted-foreground hover:bg-muted transition-colors">
                      Cancel
                    </button>
                    <button type="button" onClick={handleDelete}
                      className="flex-1 h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-lg transition-colors"
                      data-testid="button-delete-profile">
                      Yes, Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ on, onToggle, title, subtitle, testId }: {
  on: boolean; onToggle: () => void; title: string; subtitle: string; testId: string;
}) {
  return (
    <button type="button" onClick={onToggle} role="switch" aria-checked={on}
      className={`w-full rounded-2xl border-4 flex items-center justify-between gap-4 px-5 py-4 text-left transition-all ${
        on ? "border-secondary bg-secondary/10" : "border-border bg-muted"
      }`}
      data-testid={testId}>
      <div className="min-w-0">
        <p className={`text-lg font-black ${on ? "text-secondary" : "text-foreground"}`}>{title}</p>
        <p className="text-sm font-bold text-muted-foreground">{subtitle}</p>
      </div>
      <span className={`relative w-14 h-8 rounded-full flex-shrink-0 transition-colors ${on ? "bg-green-500" : "bg-gray-300"}`}>
        <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${on ? "translate-x-6" : "translate-x-0"}`} />
      </span>
    </button>
  );
}

function VoiceSlider({ label, value, min, max, step, onChange, format, testId }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string; testId: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-base font-black text-foreground">{label}</span>
        <span className="text-sm font-bold text-muted-foreground">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary h-3 cursor-pointer"
        data-testid={testId} />
    </div>
  );
}

function VoiceSettingsSection() {
  const { voiceSettings, updateVoiceSettings } = useSoundContext();

  const preview = () => {
    sounds.pop();
    speakPreview("Hello! Let's learn together. Time to read and play.", voiceSettings);
  };

  const voiceOptions: { value: "female" | "male"; label: string; emoji: string }[] = [
    { value: "female", label: "British Female", emoji: "👩" },
    { value: "male", label: "British Male", emoji: "👨" },
  ];

  return (
    <div data-testid="voice-settings">
      <label className="block text-xl font-black text-foreground mb-3">Reading Voice 🗣️</label>
      <div className="rounded-2xl border-4 border-border bg-muted p-5 space-y-5">
        {/* Voice picker — only two choices, resolved to the best en-GB voice. */}
        <div>
          <span className="block text-base font-black text-foreground mb-2">Voice</span>
          <div className="grid grid-cols-2 gap-3">
            {voiceOptions.map(o => {
              const selected = voiceSettings.gender === o.value;
              return (
                <button key={o.value} type="button"
                  onClick={() => {
                    sounds.click();
                    updateVoiceSettings({ gender: o.value });
                    speakPreview("Hello! Let's learn together.", { ...voiceSettings, gender: o.value });
                  }}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-4 px-4 py-4 font-black transition-colors ${
                    selected
                      ? "border-primary bg-primary text-white shadow-md"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                  data-testid={`button-voice-${o.value}`}>
                  <span className="text-3xl">{o.emoji}</span>
                  <span className="text-base">🇬🇧 {o.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs font-bold text-muted-foreground">
            Uses your device's closest British voice. Default is British Female.
          </p>
        </div>

        <VoiceSlider label="Speed" value={voiceSettings.rate} min={0.5} max={1.4} step={0.05}
          onChange={v => updateVoiceSettings({ rate: v })} format={v => `${v.toFixed(2)}×`} testId="slider-rate" />
        <VoiceSlider label="Pitch" value={voiceSettings.pitch} min={0.5} max={1.8} step={0.05}
          onChange={v => updateVoiceSettings({ pitch: v })} format={v => v.toFixed(2)} testId="slider-pitch" />
        <VoiceSlider label="Volume" value={voiceSettings.volume} min={0} max={1} step={0.05}
          onChange={v => updateVoiceSettings({ volume: v })} format={v => `${Math.round(v * 100)}%`} testId="slider-volume" />

        <div className="flex flex-wrap gap-3 pt-1">
          <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={preview}
            className="h-14 px-6 rounded-full text-lg font-black bg-primary hover:bg-primary/90 text-white shadow-md transition-colors"
            data-testid="button-preview-voice">
            🔊 Preview Voice
          </motion.button>
          <button type="button"
            onClick={() => { sounds.click(); updateVoiceSettings(DEFAULT_VOICE_SETTINGS); }}
            className="h-14 px-6 rounded-full text-lg font-black border-4 border-border bg-card hover:bg-muted text-muted-foreground transition-colors"
            data-testid="button-reset-voice">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function PetTab({ profile, onChoosePet }: {
  profile: ChildProfile;
  onChoosePet: (childId: string, species: string, petName?: string) => void;
}) {
  const pet = profile.pet;
  const current = pet ? getSpecies(pet.species) : null;
  const [selected, setSelected] = useState<string | undefined>();
  const [petName, setPetName] = useState("");
  const [confirming, setConfirming] = useState(false);

  const adopt = () => {
    if (!selected) return;
    sounds.celebrate();
    onChoosePet(profile.id, selected, petName);
    setSelected(undefined);
    setPetName("");
    setConfirming(false);
  };

  // Changing an existing pet wipes care + growth progress (learning data is kept,
  // so the new pet re-grows from the child's lessons). Confirm first.
  const changePet = () => {
    if (!selected) return;
    sounds.click();
    setConfirming(true);
  };

  return (
    <div className="space-y-6" data-testid="pet-tab">
      {current && pet ? (
        <div className="flex items-center gap-4 bg-muted/50 rounded-3xl p-5">
          <div className="text-6xl">{current.emoji}</div>
          <div>
            <p className="text-2xl font-black text-foreground">{pet.petName || current.name}</p>
            <p className="text-base font-bold text-muted-foreground">{current.name} · grows as {profile.name} learns</p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border-4 border-amber-200 rounded-3xl p-5 text-center">
          <p className="text-lg font-black text-amber-800">{profile.name} doesn't have a pet yet 🐾</p>
          <p className="text-sm font-bold text-amber-700 mt-1">Adopt a little friend that grows with every lesson.</p>
        </div>
      )}

      <div>
        <label className="block text-xl font-black text-foreground mb-3">
          {current ? "Change Pet" : "Choose a Pet"}
        </label>
        <PetPicker selected={selected} onSelect={s => { setConfirming(false); setSelected(prev => prev === s ? undefined : s); }} compact />
      </div>

      {selected && (
        <div>
          <label className="block text-lg font-black text-foreground mb-2">Pet's Name <span className="text-sm font-bold text-muted-foreground">(optional)</span></label>
          <input value={petName} onChange={e => setPetName(e.target.value)} maxLength={16}
            placeholder={getSpecies(selected).name}
            className="w-full text-xl h-14 rounded-2xl px-5 border-4 border-border bg-background focus:outline-none focus:border-primary font-bold"
            data-testid="input-edit-pet-name" />
        </div>
      )}

      {current && confirming && (
        <div className="bg-red-50 border-4 border-red-300 rounded-2xl p-5 text-center space-y-3">
          <p className="text-lg font-black text-red-700">
            Switch to {selected ? getSpecies(selected).name : "this pet"}? {pet?.petName || current.name}'s care and growth will reset.
          </p>
          <p className="text-sm font-bold text-red-600">Don't worry — {profile.name}'s learning progress is kept, so the new pet grows back quickly.</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => { sounds.click(); setConfirming(false); }}
              className="flex-1 h-14 rounded-2xl border-4 border-border font-black text-lg text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="button" onClick={adopt}
              className="flex-1 h-14 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-lg transition-colors"
              data-testid="button-confirm-change-pet">
              Yes, Switch
            </button>
          </div>
        </div>
      )}

      {selected && !(current && confirming) && (
        <button type="button" onClick={current ? changePet : adopt}
          className="w-full h-16 rounded-2xl text-xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg transition-colors"
          data-testid="button-adopt-or-change-pet">
          {current ? `Switch to ${getSpecies(selected).name}` : `Adopt ${petName.trim() || getSpecies(selected).name}! 🎉`}
        </button>
      )}
    </div>
  );
}

function RewardsTab({
  profile, pointsEnabled, requireApproval, rewards,
  onTogglePoints, onToggleApproval, onAdd, onUpdate, onDelete,
}: {
  profile: ChildProfile;
  pointsEnabled: boolean;
  requireApproval: boolean;
  rewards: ShopReward[];
  onTogglePoints: () => void;
  onToggleApproval: () => void;
  onAdd: (childId: string, reward: Omit<ShopReward, "id">) => void;
  onUpdate: (childId: string, rewardId: string, updates: Partial<Omit<ShopReward, "id">>) => void;
  onDelete: (childId: string, rewardId: string) => void;
}) {
  const [name, setName] = useState("");
  const [cost, setCost] = useState("100");
  const [emoji, setEmoji] = useState(REWARD_EMOJIS[0]);
  const [description, setDescription] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const noEnter = (e: React.KeyboardEvent) => { if (e.key === "Enter") e.preventDefault(); };

  const handleAdd = () => {
    const trimmed = name.trim();
    const c = parseInt(cost, 10);
    if (!trimmed || !Number.isFinite(c) || c <= 0) return;
    sounds.pop();
    onAdd(profile.id, { name: trimmed, cost: c, emoji, description: description.trim() || undefined, active: true });
    setName(""); setCost("100"); setEmoji(REWARD_EMOJIS[0]); setDescription("");
  };

  return (
    <div className="space-y-6">
      <SettingToggle
        on={pointsEnabled}
        onToggle={onTogglePoints}
        title="🎁 Points & Rewards Shop"
        subtitle={`Show ${profile.name} a shop to spend earned points. Turn off to hide points & shop.`}
        testId="toggle-points-enabled"
      />

      {pointsEnabled ? (
        <>
          <SettingToggle
            on={requireApproval}
            onToggle={onToggleApproval}
            title="🔒 Require grown-up approval"
            subtitle="Points aren't spent until a grown-up enters the passcode to approve."
            testId="toggle-require-approval"
          />

          <PointsGuide />

          {/* Existing rewards */}
          <div>
            <h3 className="text-xl font-black text-foreground mb-3">Rewards ({rewards.length})</h3>
            {rewards.length === 0 ? (
              <p className="text-base font-bold text-muted-foreground bg-muted rounded-2xl p-5 text-center">
                No rewards yet. Add one below! 👇
              </p>
            ) : (
              <div className="space-y-3">
                {rewards.map(r => (
                  <div key={r.id} className={`rounded-2xl border-4 p-4 ${r.active ? "border-border bg-background" : "border-border bg-muted/60 opacity-70"}`}
                    data-testid={`reward-row-${r.id}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl flex-shrink-0">{r.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-black text-foreground truncate">{r.name}</p>
                        {r.description && <p className="text-sm font-bold text-muted-foreground truncate">{r.description}</p>}
                        <p className="text-sm font-black text-amber-600">💰 {r.cost} points</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <button type="button" onClick={() => { sounds.click(); onUpdate(profile.id, r.id, { active: !r.active }); }}
                          className={`px-3 py-1 rounded-full text-xs font-black border-2 transition-colors ${r.active ? "bg-green-100 text-green-700 border-green-300" : "bg-gray-100 text-gray-500 border-gray-300"}`}
                          data-testid={`toggle-reward-active-${r.id}`}>
                          {r.active ? "Active" : "Hidden"}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <input type="number" min={1} value={r.cost}
                        onChange={e => onUpdate(profile.id, r.id, { cost: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        onKeyDown={noEnter}
                        className="w-24 h-10 rounded-xl px-3 border-2 border-border bg-background font-black text-sm"
                        aria-label="Reward cost"
                        data-testid={`input-reward-cost-${r.id}`} />
                      {confirmDeleteId === r.id ? (
                        <div className="flex gap-2 flex-1">
                          <button type="button" onClick={() => setConfirmDeleteId(null)}
                            className="flex-1 h-10 rounded-xl border-2 border-border font-black text-sm text-muted-foreground hover:bg-muted">
                            Cancel
                          </button>
                          <button type="button" onClick={() => { sounds.click(); onDelete(profile.id, r.id); setConfirmDeleteId(null); }}
                            className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-sm"
                            data-testid={`confirm-delete-reward-${r.id}`}>
                            Delete
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => { sounds.click(); setConfirmDeleteId(r.id); }}
                          className="h-10 px-4 rounded-xl border-2 border-red-200 text-red-600 font-black text-sm hover:bg-red-50"
                          data-testid={`delete-reward-${r.id}`}>
                          🗑️ Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add reward */}
          <div className="bg-muted/50 rounded-2xl p-5 border-4 border-dashed border-border space-y-4">
            <h3 className="text-lg font-black text-foreground">➕ Add a new reward</h3>
            <input value={name} onChange={e => setName(e.target.value)} onKeyDown={noEnter}
              placeholder="Reward name (e.g. Ice cream)"
              className="w-full h-12 rounded-xl px-4 border-4 border-border bg-background font-bold text-base"
              data-testid="input-new-reward-name" />
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Short description (optional)"
              className="w-full rounded-xl px-4 py-2 border-4 border-border bg-background font-bold text-base resize-none"
              rows={2}
              data-testid="input-new-reward-description" />
            <div className="flex items-center gap-3">
              <label className="text-sm font-black text-foreground">Cost</label>
              <input type="number" min={1} value={cost} onChange={e => setCost(e.target.value)} onKeyDown={noEnter}
                className="w-28 h-12 rounded-xl px-4 border-4 border-border bg-background font-black text-base"
                data-testid="input-new-reward-cost" />
              <span className="text-sm font-black text-amber-600">points</span>
            </div>
            <div>
              <p className="text-sm font-black text-foreground mb-2">Pick an icon</p>
              <div className="grid grid-cols-8 gap-2">
                {REWARD_EMOJIS.map(em => (
                  <button key={em} type="button" onClick={() => { sounds.click(); setEmoji(em); }}
                    className={`text-2xl h-11 rounded-xl border-4 transition-all flex items-center justify-center ${emoji === em ? "border-primary bg-primary/10 scale-110" : "border-border hover:bg-muted"}`}>
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" onClick={handleAdd}
              disabled={!name.trim()}
              className="w-full h-14 rounded-2xl text-xl font-black bg-secondary hover:bg-secondary/90 text-white shadow-md transition-colors disabled:opacity-40"
              data-testid="button-add-reward">
              Add Reward 🎁
            </button>
          </div>
        </>
      ) : (
        <p className="text-base font-bold text-muted-foreground bg-muted rounded-2xl p-6 text-center">
          The Points & Rewards Shop is off. Turn it on above to give {profile.name} points to earn and rewards to spend them on.
        </p>
      )}

      <ResetPointsSection profile={profile} />
    </div>
  );
}

// Adult-only Reset Points control. Always shows a warning, then requires the
// adult passcode every time before zeroing the child's points. The action is
// logged to the Reward/Points History via resetPoints().
function ResetPointsSection({ profile }: { profile: ChildProfile }) {
  const { gameResults, rewardPurchases, resetPoints, verifyPasscode, hasPasscode } = useAppContext();
  const [stage, setStage] = useState<"idle" | "warn" | "passcode" | "done">("idle");

  const myResults = gameResults.filter(r => r.childId === profile.id);
  const myPurchases = rewardPurchases.filter(p => p.childId === profile.id);
  const balance = computeBalance(myResults, myPurchases);

  const doReset = () => {
    if (!resetPoints(profile.id)) return;
    sounds.celebrate();
    setStage("done");
  };

  return (
    <div className="pt-6 mt-2 border-t-4 border-border">
      <h3 className="text-lg font-black text-foreground mb-1">♻️ Reset Points</h3>
      <p className="text-sm font-bold text-muted-foreground mb-3">
        {profile.name} currently has <span className="font-black text-amber-600">{balance} points</span>. Resetting sets the balance to 0 and is saved in the Points History.
      </p>

      {stage === "done" ? (
        <p className="text-base font-black text-green-700 bg-green-50 border-4 border-green-200 rounded-2xl px-4 py-3"
          data-testid="reset-points-done">
          ✅ {profile.name}'s points were reset to 0.
        </p>
      ) : stage === "idle" ? (
        <button type="button" onClick={() => { sounds.click(); setStage("warn"); }}
          className="w-full h-14 rounded-2xl text-lg font-black text-red-600 hover:bg-red-50 border-4 border-red-200 transition-colors"
          data-testid="button-reset-points">
          ♻️ Reset Points to 0
        </button>
      ) : stage === "warn" ? (
        <div className="bg-red-50 border-4 border-red-300 rounded-2xl p-5 space-y-3">
          <p className="text-base font-black text-red-700">Are you sure you want to reset this child's points to 0? This cannot be undone.</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => { sounds.click(); setStage("idle"); }}
              className="flex-1 h-12 rounded-2xl border-4 border-border font-black text-base text-muted-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="button" onClick={() => { sounds.click(); if (hasPasscode) setStage("passcode"); else doReset(); }}
              className="flex-1 h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-base transition-colors"
              data-testid="button-reset-points-confirm">
              Yes, reset
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-muted/40 border-4 border-border rounded-2xl p-3">
          <p className="text-center text-sm font-black text-foreground mb-2">Enter the adult passcode to reset</p>
          <PasscodeEntry
            verify={verifyPasscode}
            onSuccess={doReset}
            onBack={() => { sounds.click(); setStage("idle"); }}
          />
        </div>
      )}
    </div>
  );
}

// Describe one history entry for the Point History list: a friendly label, the
// signed amount, and a colour tone. Handles adult adjustments, resets, and the
// four reward-purchase states.
function describeHistoryEntry(p: RewardPurchase): { label: string; amount: string; tone: string } {
  if (p.kind === "reset") {
    return { label: "♻️ Points reset to 0", amount: p.oldBalance ? `−${p.oldBalance}` : "—", tone: "text-red-600" };
  }
  if (p.kind === "adjust") {
    const added = p.pointsSpent < 0; // negative spent = points added
    const mag = Math.abs(p.pointsSpent);
    return added
      ? { label: "➕ Points added by adult", amount: `+${mag}`, tone: "text-green-600" }
      : { label: "➖ Points deducted by adult", amount: `−${mag}`, tone: "text-red-600" };
  }
  const status = p.status === "approved" ? "Bought"
    : p.status === "pending" ? "Pending"
    : p.status === "rejected" ? "Rejected"
    : "Cancelled";
  return {
    label: `${p.rewardEmoji} ${status}: ${p.rewardName}`,
    amount: p.status === "approved" ? `−${p.pointsSpent}` : "—",
    tone: p.status === "approved" ? "text-red-600" : "text-muted-foreground",
  };
}

function formatHistoryTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

const ADD_PRESETS = [10, 50, 100];

function ManagePointsTab({ profile, balance, history, onAdjust, onReset }: {
  profile: ChildProfile;
  balance: number;
  history: RewardPurchase[];
  onAdjust: (childId: string, delta: number) => boolean;
  onReset: (childId: string) => boolean;
}) {
  const [custom, setCustom] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const sorted = [...history].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const showFlash = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(prev => (prev === msg ? null : prev)), 2500);
  };

  const doAdjust = (delta: number) => {
    if (!onAdjust(profile.id, delta)) {
      showFlash(delta < 0 ? "Nothing to deduct — balance is already 0." : "Enter a valid amount.");
      return;
    }
    sounds.pop();
    showFlash(delta > 0 ? `Added ${delta} points ✅` : `Deducted ${Math.abs(delta)} points ✅`);
  };

  const customAmount = Math.max(0, Math.round(Number(custom)) || 0);

  const doReset = () => {
    if (onReset(profile.id)) {
      sounds.celebrate();
      showFlash("Points reset to 0 ✅");
    }
    setConfirmReset(false);
  };

  return (
    <div className="space-y-6">
      {/* Current balance */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-100 border-4 border-amber-200 rounded-3xl p-6 text-center">
        <p className="text-base font-black text-amber-700">{profile.name}'s Points Balance</p>
        <p className="text-5xl font-black text-amber-600 mt-1" data-testid="text-points-balance">{balance}</p>
      </div>

      {flash && (
        <p className="text-center text-base font-black text-green-700 bg-green-50 border-4 border-green-200 rounded-2xl px-4 py-3"
          data-testid="text-points-flash">
          {flash}
        </p>
      )}

      {/* Add */}
      <div>
        <h3 className="text-lg font-black text-foreground mb-2">➕ Add Points</h3>
        <div className="grid grid-cols-3 gap-3">
          {ADD_PRESETS.map(n => (
            <button key={n} type="button" onClick={() => doAdjust(n)}
              className="h-14 rounded-2xl text-lg font-black bg-green-500 hover:bg-green-600 text-white shadow-md transition-colors"
              data-testid={`button-add-${n}`}>
              +{n}
            </button>
          ))}
        </div>
      </div>

      {/* Deduct */}
      <div>
        <h3 className="text-lg font-black text-foreground mb-2">➖ Deduct Points</h3>
        <div className="grid grid-cols-3 gap-3">
          {ADD_PRESETS.map(n => (
            <button key={n} type="button" onClick={() => doAdjust(-n)}
              className="h-14 rounded-2xl text-lg font-black bg-red-500 hover:bg-red-600 text-white shadow-md transition-colors"
              data-testid={`button-deduct-${n}`}>
              −{n}
            </button>
          ))}
        </div>
      </div>

      {/* Custom amount */}
      <div>
        <h3 className="text-lg font-black text-foreground mb-2">✏️ Custom Amount</h3>
        <div className="flex flex-wrap items-stretch gap-3">
          <input
            type="number" min={1} inputMode="numeric" value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }}
            placeholder="Amount"
            className="flex-1 min-w-[120px] h-14 px-4 rounded-2xl border-4 border-border text-lg font-black focus:border-primary outline-none"
            data-testid="input-custom-points"
          />
          <button type="button" disabled={customAmount <= 0}
            onClick={() => { doAdjust(customAmount); setCustom(""); }}
            className="h-14 px-6 rounded-2xl text-lg font-black bg-green-500 hover:bg-green-600 text-white shadow-md transition-colors disabled:opacity-40"
            data-testid="button-custom-add">
            Add
          </button>
          <button type="button" disabled={customAmount <= 0}
            onClick={() => { doAdjust(-customAmount); setCustom(""); }}
            className="h-14 px-6 rounded-2xl text-lg font-black bg-red-500 hover:bg-red-600 text-white shadow-md transition-colors disabled:opacity-40"
            data-testid="button-custom-deduct">
            Deduct
          </button>
        </div>
      </div>

      {/* Reset */}
      <div className="pt-2">
        {confirmReset ? (
          <div className="bg-red-50 border-4 border-red-300 rounded-2xl p-5 space-y-3">
            <p className="text-base font-black text-red-700">Reset {profile.name}'s points to 0? This cannot be undone.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => { sounds.click(); setConfirmReset(false); }}
                className="flex-1 h-12 rounded-2xl border-4 border-border font-black text-base text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button type="button" onClick={doReset}
                className="flex-1 h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-base transition-colors"
                data-testid="button-reset-points-confirm">
                Yes, reset
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => { sounds.click(); setConfirmReset(true); }}
            className="w-full h-14 rounded-2xl text-lg font-black text-red-600 hover:bg-red-50 border-4 border-red-200 transition-colors"
            data-testid="button-reset-points">
            ♻️ Reset Points to 0
          </button>
        )}
      </div>

      {/* Point History */}
      <div className="pt-6 mt-2 border-t-4 border-border">
        <h3 className="text-lg font-black text-foreground mb-3">🧾 Point History</h3>
        {sorted.length === 0 ? (
          <p className="text-base font-bold text-muted-foreground bg-muted/40 rounded-2xl px-4 py-5 text-center">
            No points activity yet.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1" data-testid="list-point-history">
            {sorted.map(p => {
              const { label, amount, tone } = describeHistoryEntry(p);
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 bg-muted/40 rounded-2xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-base font-black text-foreground truncate">{label}</p>
                    <p className="text-xs font-bold text-muted-foreground">{formatHistoryTime(p.createdAt)}</p>
                  </div>
                  <span className={`text-lg font-black shrink-0 ${tone}`}>{amount}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
