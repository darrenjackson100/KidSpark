import React from "react";
import { motion } from "framer-motion";
import { PET_SPECIES } from "@/lib/pets";
import { sounds } from "@/lib/sounds";

export interface PetPickerProps {
  selected?: string;
  onSelect: (speciesId: string) => void;
  /** Smaller tiles for embedding in forms. */
  compact?: boolean;
}

// A friendly grid of all 20 pets the child can adopt. Each tile gently bobs so
// the menagerie feels alive and inviting.
export default function PetPicker({ selected, onSelect, compact = false }: PetPickerProps) {
  return (
    <div className={`grid gap-2 sm:gap-3 ${compact ? "grid-cols-4 sm:grid-cols-5" : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5"}`}>
      {PET_SPECIES.map((sp, i) => {
        const isSel = selected === sp.id;
        return (
          <motion.button
            key={sp.id}
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i * 0.025, 0.5), type: "spring", stiffness: 160 }}
            whileHover={{ scale: 1.06, y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.pop(); onSelect(sp.id); }}
            className={`relative rounded-2xl sm:rounded-3xl border-4 flex flex-col items-center justify-center transition-colors ${
              compact ? "p-1.5 gap-0.5" : "p-2 sm:p-3 gap-1"
            } ${isSel ? "border-primary bg-primary/10 shadow-lg" : "border-border bg-card hover:bg-muted"}`}
            data-testid={`pet-option-${sp.id}`}
          >
            <motion.span
              aria-hidden
              className={compact ? "text-3xl sm:text-4xl leading-none" : "text-4xl sm:text-5xl leading-none"}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.4 + (i % 4) * 0.3, repeat: Infinity, ease: "easeInOut", delay: (i % 5) * 0.2 }}
            >
              {sp.emoji}
            </motion.span>
            <span className={`font-black text-foreground leading-tight text-center ${compact ? "text-[10px]" : "text-xs sm:text-sm"}`}>
              {sp.name}
            </span>
            {!compact && (
              <span className="text-[10px] font-bold text-muted-foreground leading-tight text-center hidden sm:block">
                {sp.blurb}
              </span>
            )}
            {isSel && (
              <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-black shadow-md">
                ✓
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
