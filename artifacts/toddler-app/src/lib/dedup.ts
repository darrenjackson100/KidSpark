// Shared helpers for ensuring a generated set of questions/rounds has no
// duplicates within a single game session (unless the pool is exhausted).

function optionText(o: { label?: unknown; labelText?: string }): string {
  if (o.labelText) return o.labelText;
  if (typeof o.label === "string") return o.label;
  if (typeof o.label === "number") return String(o.label);
  return "";
}

interface KeyableQuestion {
  questionText?: string;
  prompt?: unknown;
  options: { isCorrect: boolean; label?: unknown; labelText?: string }[];
}

// Stable signature for a question, independent of option order. Two questions
// with the same text, same options, and same correct answer are "identical".
export function questionKey(q: KeyableQuestion): string {
  const opts = q.options
    .map((o) => `${optionText(o)}:${o.isCorrect ? 1 : 0}`)
    .sort()
    .join(",");
  const promptStr = typeof q.prompt === "string" ? q.prompt : "";
  return `${q.questionText ?? ""}|${promptStr}|${opts}`;
}

// Generic unique-set builder. Calls `gen(i)` for each slot, retrying until the
// generated item has a key not seen before, or until `maxAttempts` is reached
// (at which point a duplicate is accepted — the pool is effectively exhausted).
export function buildUnique<T>(
  count: number,
  gen: (i: number) => T,
  keyOf: (item: T) => string,
  maxAttempts = 40,
): T[] {
  const out: T[] = [];
  const used = new Set<string>();
  for (let i = 0; i < count; i++) {
    let item = gen(i);
    let attempts = 0;
    while (used.has(keyOf(item)) && attempts < maxAttempts) {
      item = gen(i);
      attempts++;
    }
    used.add(keyOf(item));
    out.push(item);
  }
  return out;
}

// Convenience wrapper for GameEngine-style question generators.
export function buildUniqueQuestions<T extends KeyableQuestion>(
  count: number,
  gen: (i: number) => T,
  maxAttempts = 40,
): T[] {
  return buildUnique<T>(count, gen, questionKey, maxAttempts);
}
