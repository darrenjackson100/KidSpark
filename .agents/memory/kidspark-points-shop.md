---
name: KidSpark points & rewards shop
description: Balance-safety invariant and data model for the parent-controlled Points/Rewards Shop in toddler-app.
---

# Points / Rewards Shop

Spendable balance is derived, never stored: `balance = computeTotalPoints(results) − approved-spent`.
Pending requests (require-approval mode) do NOT deduct; only `status: "approved"` purchases count as spent.

## Invariant: enforce affordability in the context layer, not just the UI
**Rule:** `requestReward` (immediate-approve path) and `approvePurchase` must both guard
`available >= cost` themselves and re-verify inside the functional `setRewardPurchases(prev => …)`
updater. Both return `boolean`; callers must respect `false` (show the "keep learning" lock),
not assume success.
**Why:** balance is derived from the purchase list, so any path that appends an `approved`
purchase without checking can drive the derived balance negative. A UI-only check is bypassable
and races against stale closure state. The architect review failed the task on exactly this gap.
**How to apply:** keep the UI check for UX feedback, but treat the context return value as
authoritative. When adding new spend paths, re-run the affordability check inside the updater.

## Full set of context-layer guards (a later architect review added these)
- `requestReward(childId, reward)` must return `false` and create NO purchase unless ALL hold:
  profile exists AND `profile.pointsEnabled` AND reward is one of that child's own rewards AND
  `reward.active` AND affordable. UI filtering alone is not enough.
- Affordability also **reserves pending** requests: available = earned − (approved-spent + sum of
  pending costs), so a child can't queue more pending requests than their points cover.
- `cancelPurchase(id, childId)` takes the owning childId and only flips a purchase whose `childId`
  matches — one child can never cancel another's pending request.

## Reward-history labels must be consistent across all three surfaces
Shop.tsx, Progress.tsx, Class.tsx must use the SAME wording: Approved / Denied (status `rejected`)
/ Cancelled / Pending. (Shop once drifted to "Decided" for rejected — watch for this.) Each row
shows: reward name, cost, requested date, status, adult action date (`decidedAt`), remaining points
(`balanceAfter`, approved only).
