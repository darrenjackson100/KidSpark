---
name: KidSpark points balance is derived, never stored
description: How spendable points work in toddler-app and the correct way to adjust/reset them.
---

# KidSpark points balance is a derived value

A child's spendable balance is computed on the fly: `computeBalance(results, purchases) = computeTotalPoints(gameResults) - computeSpentPoints(approved purchases)`. There is no stored `balance` field anywhere.

**Rule:** to change a child's balance (e.g. adult "Reset Points to 0"), do NOT mutate or delete `gameResults` and do NOT invent a balance field. Instead append a `RewardPurchase` with `status:"approved"` whose `pointsSpent` offsets the current balance (for a reset: `pointsSpent = current balance`, `balanceAfter:0`, `kind:"reset"`).

**Why:** keeping balance derived means the same record doubles as the audit log shown in the Reward/Points History (Shop.tsx + Progress.tsx both read `rewardName/pointsSpent/status/balanceAfter`), and future game earnings still accrue correctly because they raise `computeTotalPoints` while the reset stays a past approved spend. Only `approved` purchases count toward spent; `pending` are reserved but not deducted.

**How to apply:** any new "give/take points" feature should follow this offset-entry pattern, not a stored counter. Reset/adjust entries carry extra optional fields (`kind`, `childName`, `oldBalance`, `newBalance`) that history rendering ignores safely. Adult add/deduct (`adjustPoints`) appends an `kind:"adjust"` entry: `pointsSpent = -applied` (negative spent → adds, positive → deducts), deduction clamped to current balance so it never goes negative.

**Gotcha — never derive a function's return value from inside a `setState(prev => …)` updater.** `adjustPoints`/`resetPoints` return a success boolean the UI uses for messaging. React may defer or double-invoke the updater, so a flag mutated inside it is unreliable. Decide the outcome up front from the current `gameResults`/`rewardPurchases` closure snapshot, return that, and let the updater only build the next state.
