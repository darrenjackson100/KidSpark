import React, { useState } from "react";
import { speak } from "@/lib/speech";
import { useSoundContext } from "@/context/SoundContext";

interface SpeakerButtonProps {
  text: string;
  label?: string;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "default" | "overlay";
  className?: string;
}

export default function SpeakerButton({ text, label, size = "md", variant = "default", className = "" }: SpeakerButtonProps) {
  const { ttsEnabled } = useSoundContext();
  const [speaking, setSpeaking] = useState(false);

  if (!ttsEnabled) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSpeaking(true);
    speak(text);
    const ms = Math.max(1500, text.length * 70);
    setTimeout(() => setSpeaking(false), ms);
  };

  const sizeClasses = {
    xs: "w-11 h-11 text-xl",
    sm: "w-14 h-14 text-2xl",
    md: "w-18 h-18 text-3xl",
    lg: "w-20 h-20 text-4xl",
  };

  const variantClasses = {
    default: "bg-sky-100 hover:bg-sky-200 border-2 border-sky-300 text-sky-600",
    overlay: "bg-white/30 hover:bg-white/50 border-2 border-white/50 text-white",
  };

  const ariaLabel = label ?? `Hear: ${text}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full flex items-center justify-center transition-all flex-shrink-0 select-none shadow-sm ${speaking ? "scale-110 ring-2 ring-sky-400" : "active:scale-95"} ${className}`}
    >
      <span className={speaking ? "animate-pulse" : ""}>{speaking ? "🔊" : "🔈"}</span>
    </button>
  );
}
