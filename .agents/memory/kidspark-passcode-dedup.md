---
name: KidSpark passcode gate & question dedup
description: Non-obvious decisions behind the adult-passcode gating and no-repeat-question systems in toddler-app.
---

# Adult passcode gate

- `adultUnlocked` is **in-memory session state** in AppContext (resets on every full page reload); only the passcode itself persists (localStorage `kidspark_passcode`). Reload deliberately re-locks adult routes.
- Adult-only routes (Notes, Learners, Progress, GameReview, EditProfile, Classroom) are wrapped in `<PasscodeGate>` in App.tsx. Games / Daily Challenge / Timed Play stay open — never lock the whole app.
- Passcode is 1–4 digits, so entry/confirm need an explicit ✓ submit button (can't auto-submit on fixed length).

**Rule:** After creating the passcode during first-time setup (Welcome), you MUST also call `unlockAdult()`.
**Why:** An adult just set the code; without unlocking, navigating to any adult route immediately throws up the lock screen they just configured. An e2e test caught exactly this regression.
**How to apply:** Any new flow that *creates* the passcode (setup, migration) should unlock the session; flows that only *change* it run from an already-unlocked context.

- Gating is client-side localStorage only — appropriate child-safety UX, not hard security (devtools can bypass). That's acceptable for this product.

# EditProfile rules-of-hooks

**Rule:** EditProfile returns `null` when the profile id isn't found. Keep that guard in a thin wrapper component (`EditProfile`) that does the lookup + `useEffect(redirect)` + early return, and put ALL stateful hooks in an inner `EditProfileInner({ profile })`.
**Why:** Hooks placed after the conditional return risk "rendered fewer hooks than expected" crashes if profile goes missing on a later render.

# No-repeat questions

- Shared util `src/lib/dedup.ts`: `questionKey` (questionText + prompt-if-string + sorted `optionText:isCorrect`), `buildUnique`/`buildUniqueQuestions` (retry-with-maxAttempts, falls back to allowing dupes only when the pool is exhausted).
- 10-question inline games wrap their generator in `buildUniqueQuestions(10, i => …)`. Mixed pools (Daily Challenge 20, Timed Play 300) dedup inside `buildMixedQuestions` in questionBank.tsx.
- DiceFlash can't use questionKey (no options) — it builds the full pool of distinct rounds, shuffles, picks 10, and only repeats after the pool is exhausted; prefers no back-to-back same total. Every loop iteration consumes one item so it always terminates in 10 steps (no unbounded retry).

**Rule (freeze bug, fixed):** Any "generate N distinct distractor options around a target" helper must use BOUNDED loops, never `while(set.size < k)` with a narrow random range.
**Why:** DiceFlash `makeChoices(total)` looped `while(size<4)` drawing distractors in `total±2`. When `total===1` only {2,3} are valid, so the set capped at 3 and spun forever — froze the whole tab (a die showing 1 is common for ages 3-4 / 5-6). Loops elsewhere (generateRounds) were already bounded; this was the real culprit.
**How to apply:** Enumerate candidates into an array, shuffle, take what you need, then pad from a bounded sequential fallback. Verify the smallest possible target still yields k distinct options.

- A `GameErrorBoundary` (class component) wraps `<Router/>` in App.tsx so a thrown render error shows "Oops, this game needs fixing." + Back (resets to BASE_URL) instead of a blank app. NOTE: error boundaries do NOT catch infinite loops/freezes — only thrown errors. Fixing the loop is what unfreezes; the boundary is for crashes.
