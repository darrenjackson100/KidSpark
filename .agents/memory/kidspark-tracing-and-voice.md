---
name: KidSpark voice / pronunciation policy
description: Speech pronunciation policy (no phonics anywhere) for the toddler-app.
---

# Voice / pronunciation policy

- All letters are spoken with **standard English** via the browser TTS (the letter NAME, e.g. "B" → "bee"). There is NO custom phonics-sound speech anywhere — no "buh"/"sss"/"aaa", no repeated letters.
- **Why:** users found phonics-sound speech wrong/annoying; they want plain letter names everywhere (questions, answers, all games). Phonics settings/UI/gating were fully removed (no `phonicsEnabled` profile flag, no toggle, no PhonicsGate).
- **How to apply:** every game speaks the plain displayed text through the shared `speak()` / `speakAnswer()` helpers in `lib/speech.ts`. Do NOT reintroduce a per-option "speakText" override or any helper that maps a letter to a phonics spelling. To force a letter NAME (not a word sound) for a lowercase tile, speak `letter.toUpperCase()`.
- **Note:** `lib/phonics.ts` is kept ONLY as a data source for the "Build the Word" reading game (CVC_WORDS/PHONEMES) — it is not phonics-sound speech and must stay.

# Tracing

- The old path-based "Trace the Letter" game was removed and replaced by "Write My Name". See [kidspark-write-my-name.md](kidspark-write-my-name.md) for the current handwriting game's design (forgiving coverage model, not ordered checkpoints).
