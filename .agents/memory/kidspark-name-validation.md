---
name: KidSpark child-name validation
description: Child names must be letters+spaces only, gated at three points, because learning activities depend on it.
---

# KidSpark child names are letters-and-spaces only

Validation + normalization live in `src/lib/name.ts`: `isValidChildName` (regex `^\p{L}+(?: \p{L}+)*$/u`, trims/collapses spaces, rejects digits/symbols/emoji/empty) and `normalizeChildName` (title-cases each word, e.g. `oliver james` → `Oliver James`). Shared error message constants live there too.

**Rule:** every place that accepts or consumes a child name must use these helpers. There are three gates:
1. Create (`Welcome.tsx`) — block creation + show `NAME_ERROR_CREATE`; store `normalizeChildName(name)`.
2. Edit (`EditProfile.tsx`) — existing invalid names are NOT deleted, but the profile tab shows `NAME_ERROR_EXISTING` and `handleSave` is blocked until corrected; saves store the normalized name.
3. Write My Name game (`WriteMyName.tsx`) — if `activeProfile.name` is invalid, render a block screen (`NAME_ERROR_WRITE_GAME`) with an "Edit Name" button to `/edit-profile/:id`, placed AFTER all hooks to avoid conditional-hook violations.

**Why:** the handwriting/tracing/speech activities (especially Write My Name) only work with real letter names; legacy profiles may already contain numbers/symbols, so we gate at point-of-use rather than mass-editing or deleting them.

**How to apply:** any new name-input or name-consuming feature should reuse `isValidChildName`/`normalizeChildName`, not re-implement a regex.
