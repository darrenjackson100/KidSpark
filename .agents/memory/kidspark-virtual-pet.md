---
name: KidSpark Virtual Pet
description: Education-first design invariants for the toddler-app virtual pet — what is derived vs stored, and why.
---

# KidSpark Virtual Pet — design invariants

The pet feature is deliberately **education-first and non-farmable**. The whole
architecture hinges on a derived-vs-stored split. Preserve it on any change.

## What is STORED on `pet` (per child profile, in `kidspark_profiles`)
- species id, pet name, equipped accessory ids, per-care-action timestamps, and a
  capped care `history` array. That's it.

## What is DERIVED (never stored, never farmable)
- **XP / growth stage**: computed from learning only. There are **20 stages**
  ("Tiny Baby"→"Fully Grown", `GROWTH_STAGES` in pets.ts). XP =
  `correct*2 + games*5 + daily*12 + streakDays*6 + badges*15` (correct = per-result
  correct-answer count). Growth is intentionally SLOW (full-grown ~8400 XP over
  weeks); a single game gives tiny growth. Tapping care buttons does NOT add XP.
- **Care needs** (hunger/thirst/cleanliness/energy/happiness/learning): computed
  from saved timestamps + current time (`computePetNeeds`). NO background timers /
  setInterval — decay is purely timestamp math evaluated on render.
- **Accessory unlocks**: still derived in the data model (`isAccessoryUnlocked` /
  `unlockedAccessories`) and `setPetEquipped` is retained in AppContext, but the
  accessory/Dress-Up UI was REMOVED in the simplification (see below) — the equip
  plumbing is currently dead UI-wise.

**Why:** the product requirement is that growth and unlocks reward *learning*, not
repetitive tapping. Storing XP/stage/unlocked-lists would make them farmable and
would drift from the true learning state. Keep growth purely a pure-function read
over learning data.

## Care actions
- `petCareAction` only stamps one timestamp field + appends a history entry. It must
  never touch anything growth/unlock related.

## Equip guard
- `setPetEquipped` (AppContext) defensively filters incoming ids to the child's
  currently-unlocked set (`buildPetContext` + `unlockedAccessories`) before
  persisting — guards against tampered/legacy localStorage equipping locked/invalid
  accessories. UI already gates this, but persistence re-validates.

## Change-pet flow
- `choosePet` replaces the pet via `makeNewPet` (resets care timestamps/history),
  but learning data (game results, streak, badges, points) is untouched — so a
  re-adopted/switched pet instantly reflects the child's real learning progress.
  EditProfile's Pet tab warns the user that switching resets the pet but keeps learning.

## Avatar animation typing gotcha
- `PetAvatar` per-action animation maps must be typed `Record<PetAction,
  TargetAndTransition>` and timing maps `Record<PetAction, Transition>` (imported
  from framer-motion). Plain `object` fails typecheck against framer's `animate`/
  `transition` prop types.

## Current room design — RICH cosy room + status bars, but still no tabs/Dress-Up/XP
- The pet went through a SIMPLIFY pass then a partial REVERSAL. Two wins from the
  simplify were KEPT permanently; the "strip the room bare" part was reversed by a
  later brief. Current invariants (do not break unless the user explicitly asks):
  - **Home dashboard** = exactly TWO large cards: "Rewards Shop" (`card-rewards-shop`,
    only when `pointsEnabled`, points balance → /shop) + "My Pet" (`card-my-pet`,
    name + mood + stage label → /pet). The old 5 stat cards stay GONE.
  - **PetRoom has NO tabs** — `GrowthTab`/`StyleTab` were deleted and stay deleted.
    **No XP numbers anywhere** — header shows only `{mood} · {stage.label}`.
  - **6-button care bar**: Feed/Water/Bath/Sleep(label "Rest")/Play + Learn
    (`button-care-<action>` + `button-care-learn`), consistent sizing
    `basis-[28%] sm:basis-[14%]`. NO Dress Up button (`button-care-dress` stays GONE).
  - **No accessories ON the pet, ever** — `PetAvatar` has no SLOT_POS/getAccessory/
    equipped rendering and no accessory stickers in the room. (The equip data model in
    pets.ts/AppContext still exists but is UI-dead — see above.)
- **Status bars are BACK** (reversal): a 6-card "How is {petName} feeling?" grid below
  the care bar, always visible, driven by `needs` via `NEED_META.map` — icon chip +
  label + `%` + colored fill bar (`need-<key>` testids). NOTE: need % is NOT XP, so
  showing it does not violate the "no XP numbers" rule.
- **Room is RICH again** (reversal): DECOR fields `box/boxLid/posters/plush` were
  RE-ADDED (plus new `quilt/pillow/crate`) to `DecorDef` + all 3 theme families.
  Scene now layers: striped wall + picture-rail + window/curtains + 2 framed posters
  (hung either side of centre) + plush shelf + bookshelf + floor lamp + wood floor +
  child's bed (back-left) + pet bed (front-left) + food/water bowls + toy box (back-
  right) + storage crate + rug + dual warm-light/vignette overlays.
- **Room objects stay NON-interactive decor** (`RoomDecor`, `pointer-events-none`);
  the only clickable target in `pet-scene` is the pet (cuddle). `reactByAction` maps
  eat→food, drink→water, sleep→petbed, play→toybox.
- Decor families (girl/boy/neutral) derive from `theme.suggestedFor[0]`
  (`familyOf` → `DECOR` map).
- **Bubble-vs-decor corridor rule:** wall decor must stay in the top corners / sides,
  leaving the vertical centre strip clear, because the speech bubble rises above the
  pet's head as it grows. Posters are deliberately split to either side of centre and
  kept small for this reason.

## Illustrated pet (revamp) — SVG/scene rules
- The main pet is an illustrated parametric SVG (`PetCharacter.tsx`), NOT an emoji.
  `PetAvatar` wraps it; `PetRoom` RoomTab is a cosy CSS/SVG bedroom (decor-only, see
  "Room interaction model" above — care is via the bottom bar, not scene objects).
- **Never animate an SVG geometry attribute (`ry`/`rx`/`r`/`cx`/`cy`) directly via
  framer-motion keyframes.** On first paint the attribute renders as `undefined`,
  throwing `<ellipse> attribute ry: Expected length, "undefined"` (a runtime browser
  error, invisible to typecheck/curl — only e2e/console catches it). Instead keep the
  geometry static (e.g. `ry="3"`) and animate `scaleY`/`scaleX` with
  `style={{ transformBox:"fill-box", transformOrigin:"center" }}`.
  **Why:** framer doesn't seed an initial geometry value from the JSX attr for
  keyframe arrays; the static-attr-only render happens before animation starts.
- **Scene layering (decor-only model):** every scene layer is non-interactive
  (`pointer-events-none`) — wall, floor, rug, furniture/RoomDecor, lamp, window,
  posters, warm-light/vignette. Pet wrapper `z-10`, speech bubble/badges `z-30`,
  full-bleed lighting/vignette overlays `z-[8]`. Any full-bleed overlay MUST sit below
  the pet (`z < 10`) or it tints/darkens the pet. Since nothing in the scene is
  clickable anymore, the only interactive target inside `pet-scene` is the pet itself
  (cuddle) — no more click-occlusion bugs that needed Playwright force/dispatch.

## "Premium pet" revamp — grounded sitting plush, never a floating blob
- The pet is posed **sitting on the floor**: viewBox `0 0 120 138`, a distinct head
  CIRCLE (~cy45 r33) stacked on a rounded body ELLIPSE (~cy95) with a belly patch,
  **two planted back feet** at the very bottom (~y129) and two little front paws, plus
  a tail and per-species ears/features. Face (eyes/mouth/cheeks/nose) lives ON THE
  HEAD. This reads as a real cuddly pet; a single body-blob with tiny side-nub feet
  reads as "flat/legless/floating" — the exact complaint that triggered the redo.
- **Grounding rule:** feet reach the bottom of the viewBox AND `PetAvatar` is
  `items-end` + `bottom-0` with its own stationary ground-shadow span. Do NOT put a
  contact shadow *inside* the SVG — it rides along with jump/play transforms and the
  pet looks like its shadow flies with it.
- **Never fake-walk by sliding the pet across the room** (explicit user ban). Keep the
  pet centered/stationary and make it feel alive purely via intrinsic idle in
  `PetAvatar` (breathe y-bob + scale, blink via eye-group scaleY, look-around via pupil
  x-shift) and the tail sway. The old RoomTab idle `x: ["-22%","22%"]` pacing was the
  thing that looked cheap.
## Speech CONTENT must match the lowest status bar
- The resting bubble text is derived from the SINGLE lowest need (`needs` min via
  `NEED_META.sort`), speaking that need's first-person line (`NEED_SPEECH`) whenever
  the lowest bar is `< 60`; only when every bar is near-full does it rotate cheerful
  `HAPPY_LINES`. **Why:** a brief explicitly requires "pet speech must MATCH the lowest
  bar" — do NOT use a low threshold that lets the pet stay generically happy while a
  bar is visibly mid/low. Care taps still briefly show a transient `toast` (`toast ??
  speech`) that reverts after the action timeout — that's fine, it's tap feedback.

## Speech bubble geometry — must sit above the pet, never clip/cover face
- The bubble lives in the SAME `relative` wrapper as `PetAvatar` (`absolute bottom-full
  mb-2 left-1/2 -translate-x-1/2`), so it always follows + scales with the pet and sits
  directly above its head. Do NOT pin it to the scene top (`top-[6%]`) — that drifts away
  from the pet as it grows.
- **`PetAvatar`'s box is a REAL layout box of `sizeRem * scale` rem** (the button sets
  width/height), so a big stage genuinely takes that much vertical space. The scene is
  `overflow-hidden`, so if `sizeRem*maxScale + bubbleHeadroom` exceeds the scene's
  min-height the bubble clips at the top. Current safe combo: `sizeRem=10`, max scale
  1.70 → 17rem box, scene `clamp(24rem,62vh,34rem)`, pet anchored `bottom-[7%]` →
  ~1.8rem headroom for the bubble at the 24rem floor. If you raise sizeRem or scale,
  raise the scene min-height in lockstep.
