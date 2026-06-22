import React from "react";
import { motion, AnimatePresence, type TargetAndTransition, type Transition } from "framer-motion";
import { getSpecies } from "@/lib/pets";
import PetCharacter, { type PetExpression } from "@/components/pet/PetCharacter";

export type PetAction = "idle" | "eat" | "drink" | "bath" | "sleep" | "play" | "celebrate" | "tap";

// Body animation per action — applied to the whole pet character.
const BODY_ANIM: Record<PetAction, TargetAndTransition> = {
  idle:      { y: [0, -6, 0], scaleY: [1, 0.97, 1], scaleX: [1, 1.03, 1] },
  eat:       { scale: [1, 1.1, 0.96, 1.08, 1], rotate: [0, -3, 3, 0] },
  drink:     { y: [0, 5, 0], rotate: [0, -5, 0] },
  bath:      { rotate: [0, -7, 7, -7, 7, 0], y: [0, -3, 0] },
  sleep:     { rotate: [0, 4, 4, 4], scaleY: [1, 0.95, 1, 0.95] },
  play:      { y: [0, -26, 0], rotate: [0, 10, -10, 0] },
  celebrate: { y: [0, -32, 0], scale: [1, 1.16, 1], rotate: [0, 7, -7, 0] },
  tap:       { rotate: [0, -12, 12, -7, 7, 0], scale: [1, 1.08, 1] },
};

const BODY_TIMING: Record<PetAction, Transition> = {
  idle:      { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
  eat:       { duration: 0.6, repeat: 3, ease: "easeInOut" },
  drink:     { duration: 0.7, repeat: 3, ease: "easeInOut" },
  bath:      { duration: 0.8, repeat: 3, ease: "easeInOut" },
  sleep:     { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
  play:      { duration: 0.7, repeat: 3, ease: "easeOut" },
  celebrate: { duration: 0.7, repeat: 2, ease: "easeOut" },
  tap:       { duration: 0.5, ease: "easeOut" },
};

// Map an action to the character's facial expression.
const ACTION_EXPRESSION: Partial<Record<PetAction, PetExpression>> = {
  eat: "eat", drink: "drink", bath: "happy", sleep: "sleepy",
  play: "excited", celebrate: "excited", tap: "excited",
};

// Floating particle emoji per action.
const PARTICLES: Partial<Record<PetAction, string[]>> = {
  eat:       ["😋", "❤️", "✨"],
  drink:     ["💧", "💧", "✨"],
  bath:      ["🫧", "🫧", "🫧"],
  play:      ["🎾", "⭐", "❤️"],
  celebrate: ["🎉", "✨", "⭐", "❤️"],
  tap:       ["❤️", "✨"],
};

export interface PetAvatarProps {
  species: string;
  /** Growth-stage size multiplier. */
  scale?: number;
  /** Base size in rem (before growth scale). */
  sizeRem?: number;
  action?: PetAction;
  /** Expression to use while idle (e.g. sleepy/sad when needs are low). */
  mood?: PetExpression;
  /** Replays particles when this number changes (e.g. on a care tap). */
  burst?: number;
  onTap?: () => void;
}

export default function PetAvatar({
  species, scale = 1, sizeRem = 7, action = "idle", mood = "happy", burst = 0, onTap,
}: PetAvatarProps) {
  const sp = getSpecies(species);
  const box = sizeRem * scale; // rem
  const particles = PARTICLES[action];
  const expression: PetExpression = action === "idle" ? mood : (ACTION_EXPRESSION[action] ?? "happy");

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`Play with ${sp.name}`}
      data-testid="pet-avatar"
      className="relative inline-flex items-end justify-center select-none focus:outline-none cursor-pointer"
      style={{ width: `${box}rem`, height: `${box}rem` }}
    >
      {/* soft ground shadow */}
      <motion.span
        aria-hidden
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-[50%] bg-black/20 blur-[3px]"
        style={{ width: `${box * 0.66}rem`, height: `${box * 0.11}rem` }}
        animate={{ scaleX: action === "play" || action === "celebrate" ? [1, 0.8, 1] : [1, 1.04, 1] }}
        transition={BODY_TIMING[action]}
      />

      {/* the illustrated pet body */}
      <motion.div
        key={action}
        aria-hidden
        className="absolute left-1/2 bottom-0"
        style={{ width: `${box}rem`, height: `${box}rem`, x: "-50%", transformOrigin: "center bottom", zIndex: 10 }}
        animate={BODY_ANIM[action]}
        transition={BODY_TIMING[action]}
      >
        <PetCharacter species={species} expression={expression} />
      </motion.div>

      {/* sleeping zZz */}
      {action === "sleep" && (
        <span aria-hidden className="absolute -translate-x-1/2" style={{ top: "-6%", left: "70%", zIndex: 40 }}>
          {["💤", "💤"].map((z, i) => (
            <motion.span key={i} className="absolute leading-none" style={{ fontSize: `${box * 0.24}rem` }}
              initial={{ opacity: 0, y: 0, x: 0 }}
              animate={{ opacity: [0, 1, 0], y: -box * 0.6 * 16, x: box * 0.25 * 16 }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}>
              {z}
            </motion.span>
          ))}
        </span>
      )}

      {/* action particles */}
      <AnimatePresence>
        {particles && (
          <span key={`${action}-${burst}`} aria-hidden className="pointer-events-none absolute inset-0 z-40">
            {particles.map((p, i) => {
              const angle = (i / particles.length) * Math.PI - Math.PI / 2;
              return (
                <motion.span key={i} className="absolute left-1/2 top-1/4 leading-none"
                  style={{ fontSize: `${box * 0.26}rem` }}
                  initial={{ x: "-50%", y: 0, scale: 0, opacity: 0 }}
                  animate={{ x: `calc(-50% + ${Math.cos(angle) * box * 14}px)`, y: -box * 12 - i * 6, scale: [0, 1.2, 1, 0], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.3, ease: "easeOut", delay: i * 0.08 }}>
                  {p}
                </motion.span>
              );
            })}
          </span>
        )}
      </AnimatePresence>
    </button>
  );
}
