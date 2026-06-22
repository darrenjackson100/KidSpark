// Child-name rules. Names must be letters and spaces only (Unicode letters are
// allowed, e.g. "José", "Zoë") so every reading, writing, tracing and speech
// activity works correctly. Numbers, symbols, punctuation and emoji are not
// allowed.

// A valid name has at least one letter and contains only letters and single
// spaces between words.
const VALID_NAME = /^\p{L}+(?: \p{L}+)*$/u;

// True when `raw` (after trimming/collapsing spaces) is letters-and-spaces only.
export function isValidChildName(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const cleaned = raw.trim().replace(/\s+/g, " ");
  return cleaned.length > 0 && VALID_NAME.test(cleaned);
}

// Tidy a valid name: trim, collapse runs of spaces, and capitalise each word
// ("oliver james" → "Oliver James"). Returns the input trimmed if it is not a
// valid letters-only name, so it never mangles something we'd reject anyway.
export function normalizeChildName(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (!VALID_NAME.test(cleaned)) return cleaned;
  return cleaned
    .split(" ")
    .map(w => w.charAt(0).toLocaleUpperCase() + w.slice(1).toLocaleLowerCase())
    .join(" ");
}

// User-facing messages (kept here so they stay consistent across the app).
export const NAME_ERROR_CREATE = "Please enter a real name using letters only.";
export const NAME_ERROR_EXISTING =
  "This name contains numbers or symbols. Please update it to a name using letters only.";
export const NAME_ERROR_WRITE_GAME =
  "Please update this child's name before using Write My Name.";
