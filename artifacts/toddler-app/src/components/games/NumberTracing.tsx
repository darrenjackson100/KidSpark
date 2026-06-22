import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const PRAISE = ["Wonderful! 🌟", "You're amazing! 🎉", "Great job! 🏆", "Brilliant! ✨", "Super star! ⭐"];

export default function NumberTracing() {
  const [, setLocation] = useLocation();
  const { activeProfile } = useAppContext();
  const ageRange = activeProfile?.ageRange ?? "3-4";
  const nums = ageRange === "3-4" ? NUMBERS.slice(0, 5) : ageRange === "5-6" ? NUMBERS.slice(0, 8) : NUMBERS;

  const [current, setCurrent] = useState(0);
  const [tapped, setTapped] = useState(false);
  const [praise, setPraise] = useState("");

  const handleTap = () => {
    if (tapped) return;
    sounds.correct();
    setTapped(true);
    setPraise(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
  };

  const handleNext = () => {
    sounds.pop();
    if (current < nums.length - 1) {
      setCurrent(c => c + 1);
      setTapped(false);
    } else {
      setLocation("/maths");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-3 sm:p-6">
      <div className="flex justify-between items-center gap-2 mb-8 max-w-2xl w-full">
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { sounds.click(); setLocation("/maths"); }}
          className="h-12 sm:h-16 px-4 sm:px-6 rounded-2xl border-4 border-border bg-muted hover:bg-muted/80 font-black text-base sm:text-xl text-muted-foreground transition-colors flex-shrink-0"
        >
          ← Back
        </motion.button>
        <div className="bg-card px-3 sm:px-8 py-2 sm:py-4 rounded-3xl border-4 border-card-border shadow-md flex-shrink min-w-0">
          <span className="text-base sm:text-2xl font-black text-muted-foreground whitespace-nowrap">{current + 1} / {nums.length}</span>
        </div>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl w-full bg-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 text-center shadow-2xl border-4 border-card-border"
      >
        <h1 className="text-2xl sm:text-4xl font-black text-foreground mb-2">Number Tracing</h1>
        <p className="text-xl sm:text-2xl font-bold text-muted-foreground mb-8">Tap the number to practise!</p>

        <motion.div
          key={nums[current]}
          whileTap={{ scale: 0.9 }}
          onClick={handleTap}
          className="cursor-pointer select-none relative flex items-center justify-center mx-auto w-40 h-40 sm:w-[200px] sm:h-[200px] max-w-full"
        >
          <span
            className="font-black select-none text-[6rem] sm:text-[10rem]"
            style={{
              lineHeight: 1,
              WebkitTextStroke: tapped ? "0px" : "5px",
              color: tapped ? "hsl(var(--primary))" : "transparent",
              WebkitTextStrokeColor: "hsl(var(--primary))",
              transition: "all 0.3s",
            }}
          >
            {nums[current]}
          </span>
        </motion.div>

        <AnimatePresence>
          {tapped && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-4xl font-black text-accent mt-4"
            >
              {praise}
            </motion.div>
          )}
        </AnimatePresence>

        {tapped && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className="mt-8 h-20 px-12 rounded-full text-3xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg transition-colors"
            data-testid="button-next-number"
          >
            {current < nums.length - 1 ? "Next Number →" : "All Done! 🎉"}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
