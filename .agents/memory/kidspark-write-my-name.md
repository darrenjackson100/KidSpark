---
name: KidSpark "Write My Name" game
description: Design decisions and constraints for the WriteMyName handwriting game that replaced Trace the Letter.
---

# Write My Name (gameId "write-name")

Replaced the old "Trace the Letter" reading game. Lives at
`src/components/games/WriteMyName.tsx`, routed at `/reading/write-name`.

## Forgiving trace (never stuck at 80%)
- Completion is **coverage-based**, NOT ordered checkpoints. The dotted name is
  expanded into a dense point cloud; ink within `COVER_FRAC × letterSize` of a
  point marks it covered. Reaching `TRACE_DONE` (0.55) fraction = traced.
- **Why:** strict per-checkpoint tracing got toddlers stuck near the end. Order-
  independent coverage with a <100% threshold guarantees it can always complete.

## Points economy (max 2/attempt, not farmable)
- trace = +1, trace + free-write = +2. `points.ts` `breakdownGamePoints`
  special-cases `"write-name"` → `clamp(round(score),0,2)`, no multiplier/bonus.
- Stored `GameResult.score` is the ALREADY-EARNED value (0/1/2), `total`=2.
- Daily cap: only the first `DAILY_EARNING_LIMIT` (3) attempts **with score>0**
  per child per day earn points; later attempts still save but earn 0. Cap is
  computed by counting today's write-name results with `score>0` at save time.
- **Why:** prevent point farming by repeated trivial attempts.

## Persistence / localStorage
- Each attempt saves `GameResult.writeName {name, traced, freeWrote, image}`.
  `image` is a downscaled JPEG dataURL (white bg, width≤480, q0.7).
- `AppContext.pruneWriteNameImages` keeps only the most recent
  `MAX_WRITE_NAME_IMAGES` (12) free-write images per child; older write-name
  rows keep their flags/points but have `image` stripped to `undefined`.
- **Why:** base64 images in `kidspark_game_results` would otherwise bloat
  localStorage toward quota over time.

## Letter shapes
- `getLetterPath` (lib/letterPaths.ts) only has **lowercase** glyphs, so the
  trace guide renders `name.toLowerCase()`. Titles/history keep original casing.

## Touch
- `fixed inset-0`, `touchAction:"none"`, body `overflow:hidden` while mounted,
  pointer events with `setPointerCapture`. Two separate canvases (trace + empty
  free-write) plus an always-visible Clear button.
