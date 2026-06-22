import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { computeTotalPoints, computeSpentPoints } from "@/lib/points";
import { makeNewPet, CARE_TIMESTAMP_FIELD, getSpecies, buildPetContext, unlockedAccessories, type CareAction } from "@/lib/pets";

// A custom reward a grown-up creates for a child to spend points on.
export interface ShopReward {
  id: string;
  name: string;
  cost: number;
  description?: string;
  emoji: string;
  active: boolean;
}

// A record of a child spending (or requesting to spend) points on a reward, OR
// an adult resetting the child's points to zero (kind: "reset"). Both live in
// the same Reward/Points History list.
export interface RewardPurchase {
  id: string;
  childId: string;
  rewardId: string;
  rewardName: string;
  rewardEmoji: string;
  pointsSpent: number;
  createdAt: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  decidedAt?: string;
  // Remaining balance after this purchase was approved.
  balanceAfter?: number;
  // Present only on adult points-adjustment log entries ("reset" zeroes the
  // balance; "adjust" adds or deducts a fixed amount).
  kind?: "purchase" | "reset" | "adjust";
  childName?: string;
  oldBalance?: number;
  newBalance?: number;
}

// A single entry in the pet's care/achievement timeline (kept small & capped).
export interface PetHistoryEntry {
  id: string;
  type: "adopt" | "care" | "milestone";
  label: string;
  emoji: string;
  at: string;
}

// The child's virtual pet. Growth/XP and accessory unlocks are NOT stored here —
// they are derived from the child's learning data (see lib/pets.ts) so the pet
// can only truly grow by learning. What IS stored is the species, name, the care
// timestamps (needs decay from these), equipped accessories and a short history.
export interface PetState {
  species: string;
  petName?: string;
  acquiredAt: string;
  lastFedTime: string;
  lastWaterTime: string;
  lastBathTime: string;
  lastSleepTime: string;
  lastPlayTime: string;
  accessoriesEquipped: string[];
  history: PetHistoryEntry[];
}

export interface ChildProfile {
  id: string;
  name: string;
  ageRange: "3-4" | "5-6" | "7-8";
  mode: "parent" | "teacher";
  avatarEmoji?: string;
  // An uploaded photo (downscaled JPEG/PNG/WEBP data URL). When set it is shown
  // in place of the emoji avatar; the emoji is kept as a fallback.
  avatarPhoto?: string;
  gender?: "girl" | "boy" | "neutral";
  theme?: string;
  createdAt: string;
  lastPlayedAt?: string;
  streakDays?: number;
  streakLastDate?: string;
  // Rewards Shop — only shown to the child when a grown-up enables it.
  pointsEnabled?: boolean;
  requireApproval?: boolean;
  rewards?: ShopReward[];
  // Virtual pet companion (optional — adopted at sign-up or later).
  pet?: PetState;
}

export interface QuestionRecord {
  questionId: string;
  questionText: string;
  childAnswerText: string;
  correctAnswerText: string;
  isCorrect: boolean;
  explanation?: string;
}

// Details captured by the "Write My Name" handwriting activity.
export interface WriteNameAttempt {
  name: string;        // the name the child practised (original capitalisation)
  traced: boolean;     // did they trace the dotted name?
  freeWrote: boolean;  // did they also write it themselves in the free box?
  image?: string;      // downscaled JPEG dataURL of the free-write attempt
}

export interface GameResult {
  id: string;
  childId: string;
  gameId: string;
  gameName: string;
  category: "maths" | "animals" | "reading" | "science" | "colours" | "health";
  score: number;
  total: number;
  stars: number;
  ageRange: string;
  playedAt: string;
  timeTakenSeconds?: number;
  questionHistory?: QuestionRecord[];
  writeName?: WriteNameAttempt;
}

export interface ProgressNote {
  id: string;
  childId: string;
  title: string;
  body: string;
  category: "behaviour" | "progress" | "strength" | "challenge" | "general";
  observation?: "excellent" | "good" | "needs-practice";
  createdAt: string;
  updatedAt?: string;
}

interface AppContextType {
  profiles: ChildProfile[];
  activeProfile: ChildProfile | null;
  gameResults: GameResult[];
  notes: ProgressNote[];
  addProfile: (profile: Omit<ChildProfile, "id" | "createdAt">) => void;
  editProfile: (id: string, updates: Partial<Omit<ChildProfile, "id" | "createdAt">>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (profileId: string | null) => void;
  addGameResult: (result: Omit<GameResult, "id" | "playedAt" | "ageRange">) => void;
  addNote: (note: Omit<ProgressNote, "id" | "createdAt">) => void;
  updateNote: (id: string, updates: Partial<Pick<ProgressNote, "title" | "body" | "category" | "observation">>) => void;
  deleteNote: (id: string) => void;
  // Rewards Shop
  rewardPurchases: RewardPurchase[];
  addReward: (childId: string, reward: Omit<ShopReward, "id">) => void;
  updateReward: (childId: string, rewardId: string, updates: Partial<Omit<ShopReward, "id">>) => void;
  deleteReward: (childId: string, rewardId: string) => void;
  requestReward: (childId: string, reward: ShopReward) => boolean;
  approvePurchase: (id: string) => boolean;
  rejectPurchase: (id: string) => void;
  cancelPurchase: (id: string, childId: string) => void;
  resetPoints: (childId: string) => boolean;
  adjustPoints: (childId: string, delta: number) => boolean;
  // Virtual pet
  choosePet: (childId: string, species: string, petName?: string) => void;
  petCareAction: (childId: string, action: CareAction) => void;
  setPetEquipped: (childId: string, equipped: string[]) => void;
  // Adult passcode protecting parent/teacher-only areas.
  hasPasscode: boolean;
  adultUnlocked: boolean;
  setPasscode: (code: string) => void;
  verifyPasscode: (code: string) => boolean;
  unlockAdult: () => void;
  lockAdult: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function todayStr() { return new Date().toISOString().slice(0, 10); }

const MAX_WRITE_NAME_IMAGES = 12;

// Keep only the most recent free-write images per child; strip base64 image
// data from older write-name results so localStorage doesn't bloat over time.
// History rows are preserved (flags/points stay), only the heavy image is dropped.
function pruneWriteNameImages(results: GameResult[], childId: string): GameResult[] {
  let kept = 0;
  return results
    .slice()
    .reverse()
    .map(r => {
      if (r.childId !== childId || r.gameId !== "write-name" || !r.writeName?.image) return r;
      if (kept < MAX_WRITE_NAME_IMAGES) { kept++; return r; }
      return { ...r, writeName: { ...r.writeName, image: undefined } };
    })
    .reverse();
}

function calcStreak(lastDate: string | undefined, currentStreak: number): number {
  if (!lastDate) return 1;
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (lastDate === today) return currentStreak;
  if (lastDate === yesterday) return (currentStreak || 0) + 1;
  return 1;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<ChildProfile[]>(() => {
    try { const s = localStorage.getItem("kidspark_profiles"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [activeProfileId, setActiveProfileId] = useState<string | null>(() => localStorage.getItem("kidspark_active_profile"));
  const [gameResults, setGameResults] = useState<GameResult[]>(() => {
    try { const s = localStorage.getItem("kidspark_game_results"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [notes, setNotes] = useState<ProgressNote[]>(() => {
    try { const s = localStorage.getItem("kidspark_notes"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [rewardPurchases, setRewardPurchases] = useState<RewardPurchase[]>(() => {
    try { const s = localStorage.getItem("kidspark_reward_purchases"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [passcode, setPasscodeState] = useState<string | null>(() => localStorage.getItem("kidspark_passcode"));
  // Session-only flag: cleared on full page reload so a child cannot wander in.
  const [adultUnlocked, setAdultUnlocked] = useState(false);

  useEffect(() => { localStorage.setItem("kidspark_profiles", JSON.stringify(profiles)); }, [profiles]);
  useEffect(() => {
    if (activeProfileId) localStorage.setItem("kidspark_active_profile", activeProfileId);
    else localStorage.removeItem("kidspark_active_profile");
  }, [activeProfileId]);
  useEffect(() => { localStorage.setItem("kidspark_game_results", JSON.stringify(gameResults)); }, [gameResults]);
  useEffect(() => { localStorage.setItem("kidspark_notes", JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem("kidspark_reward_purchases", JSON.stringify(rewardPurchases)); }, [rewardPurchases]);
  useEffect(() => {
    if (passcode) localStorage.setItem("kidspark_passcode", passcode);
    else localStorage.removeItem("kidspark_passcode");
  }, [passcode]);

  const addProfile = (profile: Omit<ChildProfile, "id" | "createdAt">) => {
    const np: ChildProfile = { ...profile, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    setProfiles(prev => [...prev, np]);
    setActiveProfileId(np.id);
  };
  const editProfile = (id: string, updates: Partial<Omit<ChildProfile, "id" | "createdAt">>) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };
  const deleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    if (activeProfileId === id) setActiveProfileId(null);
  };

  const addGameResult = (result: Omit<GameResult, "id" | "playedAt" | "ageRange">) => {
    const profile = profiles.find(p => p.id === result.childId);
    const nr: GameResult = { ...result, id: Math.random().toString(36).substr(2, 9), ageRange: profile?.ageRange ?? "5-6", playedAt: new Date().toISOString() };
    setGameResults(prev => pruneWriteNameImages([...prev, nr], result.childId));
    setProfiles(prev => prev.map(p => {
      if (p.id !== result.childId) return p;
      const today = todayStr();
      const newStreak = calcStreak(p.streakLastDate, p.streakDays ?? 0);
      return { ...p, lastPlayedAt: new Date().toISOString(), streakDays: newStreak, streakLastDate: today };
    }));
  };

  const addNote = (note: Omit<ProgressNote, "id" | "createdAt">) => {
    setNotes(prev => [...prev, { ...note, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() }]);
  };
  const updateNote = (id: string, updates: Partial<Pick<ProgressNote, "title" | "body" | "category" | "observation">>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
  };
  const deleteNote = (id: string) => { setNotes(prev => prev.filter(n => n.id !== id)); };

  // ---- Rewards Shop ----
  const addReward = (childId: string, reward: Omit<ShopReward, "id">) => {
    const nr: ShopReward = { ...reward, id: Math.random().toString(36).substr(2, 9) };
    setProfiles(prev => prev.map(p => p.id === childId ? { ...p, rewards: [...(p.rewards ?? []), nr] } : p));
  };
  const updateReward = (childId: string, rewardId: string, updates: Partial<Omit<ShopReward, "id">>) => {
    setProfiles(prev => prev.map(p => p.id === childId
      ? { ...p, rewards: (p.rewards ?? []).map(r => r.id === rewardId ? { ...r, ...updates } : r) }
      : p));
  };
  const deleteReward = (childId: string, rewardId: string) => {
    setProfiles(prev => prev.map(p => p.id === childId
      ? { ...p, rewards: (p.rewards ?? []).filter(r => r.id !== rewardId) }
      : p));
  };

  // Create a reward purchase. When approval is required the request is stored
  // as "pending" (no deduction). Otherwise it is approved immediately — but the
  // context layer is authoritative: it refuses (returns false) if the child
  // cannot afford it, so the spendable balance can never go negative even if a
  // caller skips the UI check. Affordability is re-verified inside the
  // functional updater to stay atomic against the latest purchase list.
  const requestReward = (childId: string, reward: ShopReward): boolean => {
    const profile = profiles.find(p => p.id === childId);
    // The context layer is authoritative: a request is only ever valid when the
    // shop is enabled for this profile and the reward is one of the child's own
    // active rewards. UI normally filters these, but we re-check here so a stray
    // caller can never create an invalid request.
    if (!profile || !profile.pointsEnabled) return false;
    const owned = (profile.rewards ?? []).find(r => r.id === reward.id);
    if (!owned || !owned.active) return false;
    const requireApproval = !!profile.requireApproval;
    const myResults = gameResults.filter(r => r.childId === childId);
    const earned = computeTotalPoints(myResults);

    // A request — pending or immediate — is only allowed when the child can
    // afford it. Pending requests are reserved against the balance so a child
    // can never stack more pending requests than their points cover.
    const reserved = (list: RewardPurchase[]) =>
      computeSpentPoints(list) +
      list.filter(p => p.status === "pending").reduce((s, p) => s + p.pointsSpent, 0);
    if (earned - reserved(rewardPurchases.filter(p => p.childId === childId)) < reward.cost) {
      return false;
    }

    const now = new Date().toISOString();
    const status: RewardPurchase["status"] = requireApproval ? "pending" : "approved";
    setRewardPurchases(prev => {
      const mine = prev.filter(p => p.childId === childId);
      const available = earned - reserved(mine);
      if (available < reward.cost) return prev;
      const purchase: RewardPurchase = {
        id: Math.random().toString(36).substr(2, 9),
        childId,
        rewardId: reward.id,
        rewardName: reward.name,
        rewardEmoji: reward.emoji,
        pointsSpent: reward.cost,
        createdAt: now,
        status,
        decidedAt: status === "approved" ? now : undefined,
        balanceAfter: status === "approved" ? available - reward.cost : undefined,
      };
      return [...prev, purchase];
    });
    return true;
  };

  // Approve a pending request. Returns false (and does nothing) if the child
  // can no longer afford it. Deduction happens here by flipping to "approved".
  // The affordability check is re-run atomically inside the functional updater.
  const approvePurchase = (id: string): boolean => {
    const p = rewardPurchases.find(x => x.id === id);
    if (!p || p.status !== "pending") return false;
    const myResults = gameResults.filter(r => r.childId === p.childId);
    const earned = computeTotalPoints(myResults);
    const available = earned - computeSpentPoints(rewardPurchases.filter(x => x.childId === p.childId));
    if (available < p.pointsSpent) return false;
    setRewardPurchases(prev => {
      const tgt = prev.find(x => x.id === id);
      if (!tgt || tgt.status !== "pending") return prev;
      const avail = earned - computeSpentPoints(prev.filter(x => x.childId === tgt.childId));
      if (avail < tgt.pointsSpent) return prev;
      return prev.map(x => x.id === id
        ? { ...x, status: "approved", decidedAt: new Date().toISOString(), balanceAfter: avail - tgt.pointsSpent }
        : x);
    });
    return true;
  };
  const rejectPurchase = (id: string) => {
    setRewardPurchases(prev => prev.map(x => x.id === id && x.status === "pending"
      ? { ...x, status: "rejected", decidedAt: new Date().toISOString() }
      : x));
  };
  // A child may cancel their OWN still-pending request. We require the caller to
  // pass the owning childId and verify it matches the purchase, so one child can
  // never cancel another's request. No points were ever deducted, so we simply
  // flip it to "cancelled" and keep it for the history.
  const cancelPurchase = (id: string, childId: string) => {
    setRewardPurchases(prev => prev.map(x => x.id === id && x.childId === childId && x.status === "pending"
      ? { ...x, status: "cancelled", decidedAt: new Date().toISOString() }
      : x));
  };

  // Adult-only: reset a child's spendable points to 0. We never delete game
  // results (the learning history stays intact); instead we append an
  // "approved" reset entry that spends the entire current balance, so
  // computeBalance naturally returns 0 afterwards while future earnings still
  // accrue. The entry is also a permanent audit log (child name, old/new
  // balance, time, action) shown in the Reward/Points History.
  const resetPoints = (childId: string): boolean => {
    const profile = profiles.find(p => p.id === childId);
    if (!profile) return false;
    const myResults = gameResults.filter(r => r.childId === childId);
    const earned = computeTotalPoints(myResults);
    const balance = earned - computeSpentPoints(rewardPurchases.filter(p => p.childId === childId));
    const now = new Date().toISOString();
    setRewardPurchases(prev => {
      const mine = prev.filter(p => p.childId === childId);
      const bal = earned - computeSpentPoints(mine);
      const spend = Math.max(0, bal);
      const entry: RewardPurchase = {
        id: Math.random().toString(36).substr(2, 9),
        childId,
        rewardId: "__points_reset__",
        rewardName: "Points reset by adult",
        rewardEmoji: "♻️",
        pointsSpent: spend,
        createdAt: now,
        status: "approved",
        decidedAt: now,
        balanceAfter: 0,
        kind: "reset",
        childName: profile.name,
        oldBalance: spend,
        newBalance: 0,
      };
      // After the reset the child's balance is 0, so any still-pending reward
      // requests can no longer be afforded — invalidate them so a grown-up
      // can't approve a request the child can't pay for.
      const cleared = prev.map(p =>
        p.childId === childId && p.status === "pending"
          ? { ...p, status: "cancelled" as const, decidedAt: now }
          : p
      );
      return [...cleared, entry];
    });
    void balance;
    return true;
  };

  // Adult-only: add or deduct a fixed number of points (delta > 0 adds, delta < 0
  // deducts). Like resetPoints we never touch game results; we append an offset
  // "adjust" entry so the derived balance changes:
  //   • adding stores a NEGATIVE pointsSpent (reduces total spent → raises balance)
  //   • deducting stores a POSITIVE pointsSpent, clamped to the current balance so
  //     it can never go negative.
  // The entry doubles as a permanent audit record (name, old/new balance, time).
  const adjustPoints = (childId: string, delta: number): boolean => {
    const amount = Math.round(delta);
    if (!Number.isFinite(amount) || amount === 0) return false;
    const profile = profiles.find(p => p.id === childId);
    if (!profile) return false;
    // Decide the outcome up front from the current snapshot so the boolean we
    // return is deterministic — we must NOT rely on a flag mutated inside the
    // setState updater (React may defer or double-invoke it).
    const earned = computeTotalPoints(gameResults.filter(r => r.childId === childId));
    const oldBalance = Math.max(0, earned - computeSpentPoints(rewardPurchases.filter(p => p.childId === childId)));
    // For a deduction, never remove more than the child currently has.
    const applied = amount > 0 ? amount : -Math.min(oldBalance, -amount);
    if (applied === 0) return false; // nothing to deduct (balance already 0)
    const newBalance = oldBalance + applied;
    const now = new Date().toISOString();
    setRewardPurchases(prev => {
      const entry: RewardPurchase = {
        id: Math.random().toString(36).substr(2, 9),
        childId,
        rewardId: applied > 0 ? "__points_add__" : "__points_deduct__",
        rewardName: applied > 0 ? "Points added by adult" : "Points deducted by adult",
        rewardEmoji: applied > 0 ? "➕" : "➖",
        // pointsSpent is the offset against the balance: negative to add, positive
        // to deduct (computeSpentPoints sums these for approved entries).
        pointsSpent: -applied,
        createdAt: now,
        status: "approved",
        decidedAt: now,
        balanceAfter: newBalance,
        kind: "adjust",
        childName: profile.name,
        oldBalance,
        newBalance,
      };
      // A deduction may drop the balance below an outstanding pending request —
      // invalidate any now-unaffordable pending requests so a grown-up can't
      // approve a request the child can no longer pay for.
      let running = 0;
      const cleared = prev.map(p => {
        if (p.childId !== childId || p.status !== "pending") return p;
        running += p.pointsSpent;
        return running > newBalance ? { ...p, status: "cancelled" as const, decidedAt: now } : p;
      });
      return [...cleared, entry];
    });
    return true;
  };

  // ---- Virtual pet ----
  // Adopt a pet (or change to a new one). This resets the pet's care + growth
  // state with a fresh history, but the child's learning data (game results,
  // points, streak) is untouched — so a re-adopted pet instantly reflects all
  // the learning that already happened via its derived XP/growth.
  const choosePet = (childId: string, species: string, petName?: string) => {
    setProfiles(prev => prev.map(p => p.id === childId ? { ...p, pet: makeNewPet(species, petName) } : p));
  };

  // A care action refills one need by stamping its timestamp with "now" and
  // appends a short history note. Care NEVER grows the pet (growth is learning).
  const petCareAction = (childId: string, action: CareAction) => {
    const now = new Date().toISOString();
    setProfiles(prev => prev.map(p => {
      if (p.id !== childId || !p.pet) return p;
      const field = CARE_TIMESTAMP_FIELD[action];
      const entry: PetHistoryEntry = {
        id: Math.random().toString(36).substr(2, 9),
        type: "care",
        label: `${p.pet.petName ?? getSpecies(p.pet.species).name} was cared for`,
        emoji: getSpecies(p.pet.species).emoji,
        at: now,
      };
      const history = [...p.pet.history, entry].slice(-40);
      return { ...p, pet: { ...p.pet, [field]: now, history } };
    }));
  };

  const setPetEquipped = (childId: string, equipped: string[]) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== childId || !p.pet) return p;
      // Defensive: only persist accessory IDs that exist in the catalog AND are
      // unlocked by this child's derived learning context — guards against
      // tampered/legacy localStorage equipping locked or invalid accessories.
      const ctx = buildPetContext(gameResults.filter(r => r.childId === childId), p.streakDays ?? 0);
      const allowed = new Set(unlockedAccessories(ctx).map(a => a.id));
      const valid = equipped.filter(id => allowed.has(id));
      return { ...p, pet: { ...p.pet, accessoriesEquipped: valid } };
    }));
  };

  const setPasscode = (code: string) => { setPasscodeState(code); };
  const verifyPasscode = (code: string) => passcode !== null && code === passcode;
  const unlockAdult = () => setAdultUnlocked(true);
  const lockAdult = () => setAdultUnlocked(false);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || null;

  return (
    <AppContext.Provider value={{ profiles, activeProfile, gameResults, notes, addProfile, editProfile, deleteProfile, setActiveProfile: setActiveProfileId, addGameResult, addNote, updateNote, deleteNote, rewardPurchases, addReward, updateReward, deleteReward, requestReward, approvePurchase, rejectPurchase, cancelPurchase, resetPoints, adjustPoints, choosePet, petCareAction, setPetEquipped, hasPasscode: passcode !== null, adultUnlocked, setPasscode, verifyPasscode, unlockAdult, lockAdult }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
