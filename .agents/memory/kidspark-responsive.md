---
name: KidSpark responsive patterns
description: Mobile-first layout conventions and overflow gotchas for the toddler-app (KidSpark) game/dashboard screens.
---

# KidSpark (toddler-app) responsiveness

Mobile-first convention used throughout: base classes target small phones (~360-390px), `sm:` overrides scale up. Common shape: `text-4xl sm:text-6xl`, `p-4 sm:p-6`/`p-6 sm:p-12`, `h-12 sm:h-16`/`h-16 sm:h-20`, `gap-3 sm:gap-6`, button rows `flex-col sm:flex-row`, add `min-w-0`/`break-words`/`flex-shrink-0` to prevent overflow.

## Gotcha: per-question progress dots overflow with variable question counts
**Rule:** Any UI that renders one element per question (e.g. progress dots `Array.from({length: questions.length})`) must NOT assume a small fixed count. Daily Challenge uses 20 questions, which overflows the header on phones.
**Why:** Standard games are ~10 questions so a fixed dot row looked fine; Daily Challenge (20) and Timed Play silently broke the mobile layout.
**How to apply:** Render the dot row as `hidden sm:flex flex-wrap` and always show a numeric `current / total` counter that works at any count. Same fix lives in GameEngine, and the analogous header counters in DailyChallenge/TimedPlay.

## Gotcha: non-wrapping emoji rows overflow narrow phones in counting games
**Rule:** When rendering `Array.from({length: n})` emoji groups inside a `flex` row, enlarging emoji `text-*` sizes can overflow a 320px screen if the row can't wrap. Multiplication renders `a` groups of `b` emojis; for age 7-8, `b` can reach ~10.
**Why:** A single `flex gap-1` row with no `flex-wrap`/`max-w` runs off-screen once emojis are big enough.
**How to apply:** Give each inner emoji group `flex-wrap` + a `max-w-[...]` so emojis wrap within their box. Counting games (CountObjects/AnimalCounting) already wrap via `flex-wrap max-w-md sm:max-w-xl`; MatchNumbers answer-card groups use `break-all`.

## Gotcha: AnimatePresence mode="wait" holds stale content for state-driven detail panels
**Rule:** Don't wrap a single keyed `motion.div` in `AnimatePresence mode="wait"` when its content is read from component state that changes on each interaction (e.g. a "tap a tile → big detail card updates" pattern). The exit animation snapshots the OLD subtree and the swap can visibly stick on the previous selection.
**Why:** PhonicsSoundBoard's detail card kept showing the first phoneme after tapping a new tile even though the tile highlight (driven by the same state) updated — caught by e2e, not typecheck.
**How to apply:** For "selection updates a detail view" use a plain `motion.div key={selected.id}` with just `initial`/`animate` (it remounts cleanly each change). Reserve `AnimatePresence` for enter/exit of items entering/leaving a list, not for re-rendering one always-present panel.

## Spec constraint: the 5 dashboard stat cards must stay identical-size
The Home stats row (Points/Stars/Badges/Streak/Games) intentionally stays `grid-cols-5` at all widths (with reduced mobile padding/text) rather than collapsing to fewer columns. The product spec requires the five cards be identical size and centered, so a 3+2 reflow is wrong even though it would be roomier at 320px.
