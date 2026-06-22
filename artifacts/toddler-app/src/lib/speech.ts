// Calm, child-friendly British text-to-speech.
//
// Responsibilities:
//  1. normalizeSpeech() — turn maths symbols and stray punctuation into words a
//     screen-reader voice says naturally ("5 - 1" → "5 take away 1").
//  2. Voice selection — strongly prefer a British (en-GB) female voice, but let a
//     grown-up override the voice and tune rate / pitch / volume (persisted).
//  3. Shared speakQuestion() / speakAnswer() helpers so every game speaks through
//     one place, always with standard English pronunciation. This is also the
//     single seam where an AI voice provider can be dropped in later without
//     touching any game.
//
// AI voice is intentionally NOT wired up yet (user chose browser voice for now).

export type VoiceGender = "female" | "male";

const FEMALE_HINTS = [
  "female",
  // Common en-GB female voices across browsers / OSes
  "hazel", "susan", "sonia", "libby", "serena", "stephanie", "kate",
  // Apple / cross-platform female voices that read English well
  "samantha", "fiona", "karen", "victoria", "moira", "tessa", "catherine",
  "amelie", "amy", "emma", "google uk english female",
];

const MALE_HINTS = [
  "male",
  // Common en-GB male voices across browsers / OSes
  "george", "daniel", "oliver", "arthur", "ryan", "thomas", "graham",
  // Apple / cross-platform male voices that read English well
  "alex", "fred", "aaron", "gordon", "rishi", "google uk english male",
];

export interface VoiceSettings {
  gender: VoiceGender; // British Female / British Male (resolved to best en-GB voice)
  rate: number;        // 0.5 – 1.2 (calm, child-friendly default)
  pitch: number;       // 0.5 – 1.6
  volume: number;      // 0 – 1
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  gender: "female", // British Female by default
  rate: 0.85, // a little slower than normal, easy for children to follow
  pitch: 1.1, // gentle, friendly
  volume: 1,
};

const STORAGE_KEY = "kidspark_voice";

let _settings: VoiceSettings = loadSettings();
let _voiceCache: SpeechSynthesisVoice | null | undefined = undefined;
let _speechEnabled = true;

function loadSettings(): VoiceSettings {
  if (typeof localStorage === "undefined") return { ...DEFAULT_VOICE_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_VOICE_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<VoiceSettings>;
    return {
      gender: parsed.gender === "male" ? "male" : "female",
      rate: clamp(parsed.rate, 0.5, 1.4, DEFAULT_VOICE_SETTINGS.rate),
      pitch: clamp(parsed.pitch, 0.5, 1.8, DEFAULT_VOICE_SETTINGS.pitch),
      volume: clamp(parsed.volume, 0, 1, DEFAULT_VOICE_SETTINGS.volume),
    };
  } catch {
    return { ...DEFAULT_VOICE_SETTINGS };
  }
}

function clamp(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function getVoiceSettings(): VoiceSettings {
  return { ..._settings };
}

export function setVoiceSettings(partial: Partial<VoiceSettings>): VoiceSettings {
  const genderChanged = partial.gender !== undefined && partial.gender !== _settings.gender;
  _settings = {
    gender: partial.gender !== undefined ? partial.gender : _settings.gender,
    rate: partial.rate !== undefined ? clamp(partial.rate, 0.5, 1.4, _settings.rate) : _settings.rate,
    pitch: partial.pitch !== undefined ? clamp(partial.pitch, 0.5, 1.8, _settings.pitch) : _settings.pitch,
    volume: partial.volume !== undefined ? clamp(partial.volume, 0, 1, _settings.volume) : _settings.volume,
  };
  if (genderChanged) _voiceCache = undefined; // re-resolve the en-GB voice for the new gender
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_settings)); } catch { /* ignore */ }
  return { ..._settings };
}

// Speech can be turned off (TTS toggle). Kept as a module flag so the shared
// speak* helpers can self-guard without every caller threading the context.
export function setSpeechEnabled(enabled: boolean): void {
  _speechEnabled = enabled;
  if (!enabled) cancelSpeech();
}

function norm(lang: string): string {
  return lang.replace("_", "-").toLowerCase();
}

function matchesHints(v: SpeechSynthesisVoice, hints: string[]): boolean {
  const name = v.name.toLowerCase();
  return hints.some(h => name.includes(h));
}

// Pick the best en-GB voice for the requested gender. The UI only ever offers
// "British Female" / "British Male"; this maps that choice to whatever the
// device actually provides, degrading gracefully to the closest en-GB / English
// voice when an exact gender match is not installed.
function findVoiceForGender(gender: VoiceGender): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const wanted = gender === "male" ? MALE_HINTS : FEMALE_HINTS;
  const avoid = gender === "male" ? FEMALE_HINTS : MALE_HINTS;
  const gb = voices.filter(v => norm(v.lang).startsWith("en-gb"));

  // 1. British + requested gender
  const gbWanted = gb.find(v => matchesHints(v, wanted));
  if (gbWanted) return gbWanted;
  // 2. British voice that is NOT clearly the other gender
  const gbNeutral = gb.find(v => !matchesHints(v, avoid));
  if (gbNeutral) return gbNeutral;
  // 3. Any British voice
  if (gb.length) return gb[0];
  // 4. Any English voice of the requested gender
  const en = voices.filter(v => norm(v.lang).startsWith("en"));
  const enWanted = en.find(v => matchesHints(v, wanted));
  if (enWanted) return enWanted;
  // 5. Any English voice
  return en[0] ?? null;
}

// Resolve the voice to use for this utterance from the saved gender choice.
function resolveVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  if (_voiceCache === undefined) _voiceCache = findVoiceForGender(_settings.gender);
  return _voiceCache;
}

export function warmupVoices(onReady?: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const load = () => { _voiceCache = findVoiceForGender(_settings.gender); onReady?.(); };
  if (window.speechSynthesis.getVoices().length > 0) {
    load();
  } else {
    window.speechSynthesis.addEventListener("voiceschanged", load, { once: true });
  }
}

// Convert maths symbols and awkward punctuation into spoken words. Symbols that
// sit between numbers are the priority ("5 × 4" → "5 times 4"); we keep the
// replacements digit-aware where a bare symbol could appear inside ordinary
// words (e.g. a hyphen in "low-sugar").
export function normalizeSpeech(text: string): string {
  return text
    // A "?" that stands for a missing number in a maths expression — i.e. it sits
    // next to a maths operator (+ - × ÷ * =) — should be read as "what number",
    // never "question mark". A "?" ending an ordinary sentence ("What animal is
    // this?") is NOT adjacent to an operator, so it is left untouched and the
    // voice just uses it for natural intonation.
    .replace(/([+\-×÷*=])\s*\?/g, "$1 what number")
    .replace(/\?\s*([+\-×÷*=])/g, "what number $1")
    // multiplication: ×, ✕ or * between numbers
    .replace(/(\d)\s*[×✕*]\s*(\d)/g, "$1 times $2")
    // division: ÷ or / between numbers
    .replace(/(\d)\s*[÷/]\s*(\d)/g, "$1 divided by $2")
    // subtraction: hyphen / minus / en- / em-dash between numbers
    .replace(/(\d)\s*[-−–—]\s*(\d)/g, "$1 take away $2")
    // addition
    .replace(/(\d)\s*\+\s*(\d)/g, "$1 plus $2")
    // equals (number followed by =)
    .replace(/(\d)\s*=\s*/g, "$1 equals ")
    // any remaining standalone maths symbols
    .replace(/[×✕]/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/[−]/g, " minus ")
    .replace(/=/g, " equals ")
    .replace(/\+/g, " plus ")
    // stray dashes between words become a gentle pause
    .replace(/\s+[–—]\s+/g, ", ")
    // a "_" stands for a missing letter/number — say "blank", not "underscore"
    .replace(/_/g, " blank ")
    // tidy whitespace
    .replace(/\s{2,}/g, " ")
    .trim();
}

interface SpeakOptions {
  normalize?: boolean;          // run maths-symbol normalisation (default true)
  settings?: Partial<VoiceSettings>; // one-off overrides (used by the preview button)
}

function utter(text: string, opts: SpeakOptions = {}): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const value = (opts.normalize === false ? text : normalizeSpeech(text)).trim();
  if (!value) return;
  window.speechSynthesis.cancel();
  const s = { ..._settings, ...opts.settings };
  const u = new SpeechSynthesisUtterance(value);
  u.lang = "en-GB";
  u.rate = s.rate;
  u.pitch = s.pitch;
  u.volume = s.volume;
  // For a one-off preview the caller may pass a different gender; otherwise use
  // the saved (cached) voice.
  const voice = opts.settings?.gender !== undefined && opts.settings.gender !== _settings.gender
    ? findVoiceForGender(opts.settings.gender) ?? resolveVoice()
    : resolveVoice();
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}

// Low-level speak (kept for existing callers). Respects the TTS on/off flag.
export function speak(text: string): void {
  if (!_speechEnabled) return;
  utter(text);
}

// Shared helpers every game should use. -------------------------------------

// A question / prompt — normalises maths symbols so "7 + ? = 10" is spoken as
// "seven plus what number equals ten".
export function speakQuestion(text: string): void {
  if (!_speechEnabled) return;
  utter(text, { normalize: true });
}

// An answer / feedback line.
export function speakAnswer(text: string): void {
  if (!_speechEnabled) return;
  utter(text, { normalize: true });
}

// Speak a preview using settings that may not be saved yet (voice picker UI).
export function speakPreview(text: string, settings: Partial<VoiceSettings>): void {
  utter(text, { normalize: true, settings });
}

export function cancelSpeech(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}
