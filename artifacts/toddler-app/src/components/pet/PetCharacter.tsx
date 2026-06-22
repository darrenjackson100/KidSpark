import React from "react";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// PetCharacter — a soft, illustrated, ALIVE pet drawn entirely in SVG.
// It is posed SITTING on the ground (big head, cuddly rounded body, two back
// feet planted at the bottom and two little front paws resting on the belly)
// so it reads as a real plush companion that owns the room — never a tiny,
// flat, floating icon. Identity comes from a per-species colour palette + ear
// style + a few signature features (beak, horn, trunk, spikes, panda patches,
// woolly crown) and a tail.
//
// Coordinate system (viewBox 0 0 120 138):
//   head   ~ circle (60, 45) r 33      → spans y 12 .. 78
//   body   ~ ellipse (60, 95) rx 41 ry 38
//   feet   ~ planted at the very bottom (y ~ 132) so the pet stays grounded.
// ---------------------------------------------------------------------------

export type PetExpression =
  | "happy" | "excited" | "neutral" | "sleepy" | "eat" | "drink" | "sad";

type EarStyle = "round" | "long" | "pointy" | "floppy" | "tiny" | "none";
type Feature = "beak" | "trunk" | "horn" | "spikes" | "patches" | "woolly";

interface PetLook {
  body: string;
  bodyDark: string;
  belly: string;
  ear: EarStyle;
  innerEar?: string;
  nose: string;
  feature?: Feature;
  accent?: string; // beak / horn colour
  tail?: boolean;
}

const DEFAULT_LOOK: PetLook = {
  body: "#e9a86a", bodyDark: "#cf8f50", belly: "#f6dcbe", ear: "round", nose: "#5b3b22", tail: true,
};

export const PET_LOOKS: Record<string, PetLook> = {
  puppy:     { body: "#d8a263", bodyDark: "#bd8649", belly: "#f3dcc0", ear: "floppy", innerEar: "#b9824c", nose: "#4a3322", tail: true },
  kitten:    { body: "#b7bdca", bodyDark: "#9aa1b0", belly: "#e7e9ef", ear: "pointy", innerEar: "#f4b8c4", nose: "#6b5560", tail: true },
  bunny:     { body: "#f0e8e2", bodyDark: "#ddd0c6", belly: "#ffffff", ear: "long", innerEar: "#f6c0cd", nose: "#e08aa0", tail: true },
  capybara:  { body: "#b18256", bodyDark: "#936a43", belly: "#cda176", ear: "tiny", nose: "#4a3322" },
  hamster:   { body: "#f0c987", bodyDark: "#dcae66", belly: "#fbeccd", ear: "round", innerEar: "#f3b8b0", nose: "#5b3b22" },
  guineapig: { body: "#cf9b5e", bodyDark: "#b5824a", belly: "#efd8b3", ear: "tiny", nose: "#5b3b22" },
  panda:     { body: "#f4f4f5", bodyDark: "#e2e2e6", belly: "#ffffff", ear: "round", innerEar: "#2b2b2b", nose: "#2b2b2b", feature: "patches" },
  fox:       { body: "#ef8b4d", bodyDark: "#d6743a", belly: "#fbe3cf", ear: "pointy", innerEar: "#fff1e6", nose: "#3d2a1c", tail: true },
  penguin:   { body: "#3d4a5c", bodyDark: "#2c3645", belly: "#ffffff", ear: "none", nose: "#f4a43a", feature: "beak", accent: "#f4a43a" },
  duckling:  { body: "#f7d65a", bodyDark: "#e7c143", belly: "#fbe9a0", ear: "none", nose: "#f08a2c", feature: "beak", accent: "#f3922f" },
  turtle:    { body: "#7bbf6a", bodyDark: "#5fa451", belly: "#cfe8b8", ear: "none", nose: "#3f6b33" },
  koala:     { body: "#aab2bb", bodyDark: "#8e98a3", belly: "#d9dee4", ear: "round", innerEar: "#cfd6dd", nose: "#3a3f47" },
  bearcub:   { body: "#a9743f", bodyDark: "#8c5e30", belly: "#d8b083", ear: "round", innerEar: "#caa074", nose: "#3a2618", tail: true },
  dragon:    { body: "#6cc6a0", bodyDark: "#4fa685", belly: "#bde6d4", ear: "pointy", innerEar: "#bde6d4", nose: "#2f6a52", feature: "spikes", accent: "#3f8f6e", tail: true },
  dino:      { body: "#8bd06a", bodyDark: "#6fb350", belly: "#d6efbf", ear: "tiny", nose: "#3f6b33", feature: "spikes", accent: "#5fa44a", tail: true },
  unicorn:   { body: "#f6e6f2", bodyDark: "#e7cfe0", belly: "#ffffff", ear: "pointy", innerEar: "#f6c0d6", nose: "#d98ab0", feature: "horn", accent: "#ffd25e", tail: true },
  chick:     { body: "#f9d94e", bodyDark: "#ecc73a", belly: "#fdeeb0", ear: "none", nose: "#f08a2c", feature: "beak", accent: "#f3922f" },
  lamb:      { body: "#f0ece6", bodyDark: "#ddd6cc", belly: "#fffaf3", ear: "floppy", innerEar: "#e9d4cf", nose: "#6b5560", feature: "woolly" },
  elephant:  { body: "#9aa6b4", bodyDark: "#808d9c", belly: "#c4ccd6", ear: "floppy", innerEar: "#b6bfca", nose: "#7c8896", feature: "trunk", accent: "#9aa6b4" },
  monkey:    { body: "#9b6b43", bodyDark: "#7f5634", belly: "#e2c39a", ear: "round", innerEar: "#e2c39a", nose: "#3a2618", tail: true },
};

export function getLook(species: string): PetLook {
  return PET_LOOKS[species] ?? DEFAULT_LOOK;
}

const EYES_OPEN = new Set<PetExpression>(["neutral", "eat", "drink", "sad"]);

export interface PetCharacterProps {
  species: string;
  expression?: PetExpression;
  className?: string;
}

export default function PetCharacter({ species, expression = "happy", className }: PetCharacterProps) {
  const look = getLook(species);
  const gid = `petbody-${species}`;
  const hid = `pethead-${species}`;
  const eyesOpen = EYES_OPEN.has(expression);
  const cheeks = expression === "happy" || expression === "excited" || expression === "neutral";
  const isBird = look.feature === "beak";

  return (
    <svg viewBox="0 0 120 138" className={className} style={{ width: "100%", height: "100%", overflow: "visible" }} aria-hidden>
      <defs>
        <radialGradient id={gid} cx="42%" cy="26%" r="85%">
          <stop offset="0%" stopColor={look.body} />
          <stop offset="100%" stopColor={look.bodyDark} />
        </radialGradient>
        <radialGradient id={hid} cx="40%" cy="28%" r="80%">
          <stop offset="0%" stopColor={look.body} />
          <stop offset="100%" stopColor={look.bodyDark} />
        </radialGradient>
      </defs>

      {/* tail (behind body) */}
      {look.tail && (
        <motion.path d="M94 104 q26 -2 19 -30 q-3 -11 -13 -9" fill="none" stroke={look.bodyDark}
          strokeWidth="14" strokeLinecap="round"
          style={{ transformBox: "fill-box", transformOrigin: "left bottom" } as React.CSSProperties}
          animate={{ rotate: [0, 6, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />
      )}

      {/* spikes / horn / woolly crown peeking from behind the head */}
      {look.feature === "spikes" && (
        <g fill={look.accent}>
          <path d="M60 6 L53 22 L67 22 Z" />
          <path d="M42 12 L37 26 L49 26 Z" />
          <path d="M78 12 L71 26 L83 26 Z" />
        </g>
      )}
      {look.feature === "horn" && (
        <g>
          <path d="M60 2 L53 26 L67 26 Z" fill={look.accent} stroke="#e9b53e" strokeWidth="1" />
          <path d="M60 6 L57 24 L63 24 Z" fill="#fff" opacity="0.45" />
        </g>
      )}
      {look.feature === "woolly" && (
        <g fill="#fffaf3" stroke={look.bodyDark} strokeWidth="0.6">
          {[[44, 16], [60, 9], [76, 16], [52, 10], [68, 10]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="10" />
          ))}
        </g>
      )}

      {/* ears (behind head) */}
      {renderEars(look)}

      {/* ===== BODY ===== */}
      <ellipse cx="60" cy="95" rx="41" ry="38" fill={`url(#${gid})`} />
      {/* belly patch */}
      <ellipse cx="60" cy="101" rx="26" ry="27" fill={look.belly} opacity="0.95" />
      {/* body highlight */}
      <ellipse cx="44" cy="74" rx="14" ry="10" fill="#fff" opacity="0.16" />

      {/* back feet planted on the floor */}
      <g>
        <ellipse cx="38" cy="129" rx="16" ry="9" fill={look.bodyDark} />
        <ellipse cx="82" cy="129" rx="16" ry="9" fill={look.bodyDark} />
        <ellipse cx="38" cy="128" rx="9" ry="5" fill={look.belly} opacity="0.85" />
        <ellipse cx="82" cy="128" rx="9" ry="5" fill={look.belly} opacity="0.85" />
      </g>

      {/* little front paws resting on the belly */}
      <g>
        <ellipse cx="40" cy="110" rx="10" ry="13" fill={look.body} />
        <ellipse cx="80" cy="110" rx="10" ry="13" fill={look.body} />
        <ellipse cx="40" cy="115" rx="5.5" ry="4" fill={look.belly} opacity="0.8" />
        <ellipse cx="80" cy="115" rx="5.5" ry="4" fill={look.belly} opacity="0.8" />
      </g>

      {/* penguin / bird wing flippers */}
      {isBird && (
        <g fill={look.bodyDark}>
          <ellipse cx="22" cy="92" rx="8" ry="20" transform="rotate(14 22 92)" />
          <ellipse cx="98" cy="92" rx="8" ry="20" transform="rotate(-14 98 92)" />
        </g>
      )}

      {/* ===== HEAD ===== */}
      <circle cx="60" cy="45" r="33" fill={`url(#${hid})`} />
      {/* head highlight */}
      <ellipse cx="48" cy="30" rx="13" ry="9" fill="#fff" opacity="0.2" />
      {/* muzzle for mammals */}
      {!isBird && (
        <ellipse cx="60" cy="56" rx="18" ry="14" fill={look.belly} opacity="0.55" />
      )}

      {/* panda eye patches */}
      {look.feature === "patches" && (
        <g fill="#2b2b2b">
          <ellipse cx="49" cy="44" rx="10" ry="12" transform="rotate(-12 49 44)" />
          <ellipse cx="71" cy="44" rx="10" ry="12" transform="rotate(12 71 44)" />
        </g>
      )}

      {/* EYES */}
      {eyesOpen ? (
        <OpenEyes sad={expression === "sad"} />
      ) : (
        <ClosedEyes sleepy={expression === "sleepy"} />
      )}

      {/* cheeks */}
      {cheeks && (
        <g fill="#f7a8be" opacity="0.7">
          <ellipse cx="40" cy="55" rx="6.5" ry="4.2" />
          <ellipse cx="80" cy="55" rx="6.5" ry="4.2" />
        </g>
      )}

      {/* nose (mammals only) */}
      {!isBird && look.feature !== "trunk" && (
        <ellipse cx="60" cy="55" rx="4" ry="3" fill={look.nose} />
      )}

      {/* MOUTH */}
      {!isBird && <Mouth expression={expression} />}

      {/* signature features in front */}
      {look.feature === "beak" && (
        <path d="M50 53 Q60 48 70 53 Q60 64 50 53 Z" fill={look.accent} stroke="#d77c20" strokeWidth="0.7" />
      )}
      {look.feature === "trunk" && (
        <path d="M60 56 Q56 82 62 96 Q68 102 72 94" fill="none" stroke={look.body} strokeWidth="11" strokeLinecap="round" />
      )}
    </svg>
  );
}

function renderEars(look: PetLook) {
  const { ear, body, bodyDark, innerEar } = look;
  const inner = innerEar ?? "#ffffff";
  switch (ear) {
    case "round":
      return (
        <g>
          <circle cx="34" cy="20" r="13" fill={body} />
          <circle cx="86" cy="20" r="13" fill={body} />
          <circle cx="34" cy="20" r="6.5" fill={inner} />
          <circle cx="86" cy="20" r="6.5" fill={inner} />
        </g>
      );
    case "long":
      return (
        <g>
          <ellipse cx="47" cy="8" rx="8" ry="22" fill={body} transform="rotate(-10 47 8)" />
          <ellipse cx="73" cy="8" rx="8" ry="22" fill={body} transform="rotate(10 73 8)" />
          <ellipse cx="47" cy="8" rx="3.6" ry="15" fill={inner} transform="rotate(-10 47 8)" />
          <ellipse cx="73" cy="8" rx="3.6" ry="15" fill={inner} transform="rotate(10 73 8)" />
        </g>
      );
    case "pointy":
      return (
        <g>
          <path d="M28 28 L33 2 L52 20 Z" fill={body} />
          <path d="M92 28 L87 2 L68 20 Z" fill={body} />
          <path d="M33 24 L35 11 L45 20 Z" fill={inner} />
          <path d="M87 24 L85 11 L75 20 Z" fill={inner} />
        </g>
      );
    case "floppy":
      return (
        <g>
          <ellipse cx="26" cy="40" rx="11" ry="19" fill={bodyDark} transform="rotate(20 26 40)" />
          <ellipse cx="94" cy="40" rx="11" ry="19" fill={bodyDark} transform="rotate(-20 94 40)" />
          <ellipse cx="26" cy="42" rx="5" ry="11" fill={inner} transform="rotate(20 26 42)" />
          <ellipse cx="94" cy="42" rx="5" ry="11" fill={inner} transform="rotate(-20 94 42)" />
        </g>
      );
    case "tiny":
      return (
        <g>
          <circle cx="42" cy="16" r="7" fill={body} />
          <circle cx="78" cy="16" r="7" fill={body} />
        </g>
      );
    default:
      return null;
  }
}

// Eyes sit on the head, centred at x 49 / 71, y ~46.
function OpenEyes({ sad }: { sad: boolean }) {
  const ry = sad ? 9 : 11;
  const pcy = sad ? 49 : 47;
  return (
    <motion.g
      style={{ transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties}
      animate={{ scaleY: [1, 1, 1, 0.1, 1] }}
      transition={{ duration: 4.4, repeat: Infinity, times: [0, 0.46, 0.9, 0.94, 0.98], ease: "easeInOut" }}
    >
      <ellipse cx="49" cy="45" rx="9" ry={ry} fill="#ffffff" />
      <ellipse cx="71" cy="45" rx="9" ry={ry} fill="#ffffff" />
      <motion.g
        animate={{ x: [0, 0, -2.8, -2.8, 0, 2.8, 2.8, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="49" cy={pcy} r="5" fill="#2a2230" />
        <circle cx="71" cy={pcy} r="5" fill="#2a2230" />
        <circle cx="51" cy={pcy - 1.8} r="1.9" fill="#ffffff" />
        <circle cx="73" cy={pcy - 1.8} r="1.9" fill="#ffffff" />
      </motion.g>
    </motion.g>
  );
}

function ClosedEyes({ sleepy }: { sleepy: boolean }) {
  // happy → upward smiling arcs (^_^); sleepy → gentle downward arcs.
  const d = sleepy
    ? ["M43 45 Q49 50 55 45", "M65 45 Q71 50 77 45"]
    : ["M43 47 Q49 40 55 47", "M65 47 Q71 40 77 47"];
  return (
    <g fill="none" stroke="#2a2230" strokeWidth="3.2" strokeLinecap="round">
      <path d={d[0]} />
      <path d={d[1]} />
    </g>
  );
}

function Mouth({ expression }: { expression: PetExpression }) {
  const stroke = "#7a4b56";
  switch (expression) {
    case "excited":
      return (
        <g>
          <path d="M51 60 Q60 75 69 60 Z" fill="#b5475a" />
          <ellipse cx="60" cy="69" rx="4.5" ry="3" fill="#f48aa0" />
        </g>
      );
    case "happy":
      return <path d="M50 61 Q60 71 70 61" fill="none" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />;
    case "neutral":
      return <path d="M54 62 Q60 67 66 62" fill="none" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" />;
    case "sleepy":
      return <ellipse cx="60" cy="63" rx="3.2" ry="3.4" fill={stroke} />;
    case "drink":
      return <ellipse cx="60" cy="63" rx="3.6" ry="4.4" fill={stroke} />;
    case "eat":
      return (
        <motion.ellipse
          cx="60" cy="63" rx="5.2" ry="3.2" fill={stroke}
          style={{ transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties}
          animate={{ scaleY: [1, 2.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
        />
      );
    case "sad":
      return (
        <g>
          <path d="M54 65 Q60 60 66 65" fill="none" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" />
          <motion.path d="M80 48 q-2 5 0 7 q2 -2 0 -7Z" fill="#7ec8f0"
            animate={{ opacity: [0, 1, 1, 0], y: [0, 6, 12, 16] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeIn" }} />
        </g>
      );
    default:
      return null;
  }
}
