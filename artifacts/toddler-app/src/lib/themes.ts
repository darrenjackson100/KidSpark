export interface ThemeDef {
  label: string;
  emoji: string;
  bg: string;
  gradientFrom: string;
  gradientTo: string;
  suggestedFor?: ("girl" | "boy" | "neutral")[];
  vars: Record<string, string>;
}

export const THEMES: Record<string, ThemeDef> = {
  default: {
    label: "Sunshine", emoji: "☀️", bg: "bg-yellow-100", gradientFrom: "from-yellow-400", gradientTo: "to-orange-400",
    suggestedFor: ["neutral"],
    vars: {},
  },
  ocean: {
    label: "Ocean", emoji: "🌊", bg: "bg-blue-100", gradientFrom: "from-blue-400", gradientTo: "to-teal-500",
    suggestedFor: ["boy"],
    vars: { "--primary": "200 90% 50%", "--secondary": "180 70% 45%", "--accent": "160 70% 45%", "--background": "200 60% 96%", "--card": "200 40% 99%", "--card-border": "200 30% 90%", "--muted": "200 30% 91%" },
  },
  space: {
    label: "Space", emoji: "🚀", bg: "bg-indigo-100", gradientFrom: "from-indigo-500", gradientTo: "to-purple-600",
    suggestedFor: ["boy"],
    vars: { "--primary": "240 75% 60%", "--secondary": "270 65% 58%", "--accent": "50 90% 55%", "--background": "240 40% 96%", "--card": "240 25% 99%", "--card-border": "240 25% 90%", "--muted": "240 20% 91%" },
  },
  dino: {
    label: "Dinosaurs", emoji: "🦕", bg: "bg-lime-100", gradientFrom: "from-lime-500", gradientTo: "to-green-600",
    suggestedFor: ["boy", "neutral"],
    vars: { "--primary": "100 60% 40%", "--secondary": "50 70% 45%", "--accent": "160 60% 45%", "--background": "100 40% 95%", "--card": "100 25% 98%", "--card-border": "100 20% 89%", "--muted": "100 20% 91%" },
  },
  unicorn: {
    label: "Unicorn", emoji: "🦄", bg: "bg-fuchsia-100", gradientFrom: "from-pink-400", gradientTo: "to-purple-500",
    suggestedFor: ["girl"],
    vars: { "--primary": "290 65% 57%", "--secondary": "320 75% 63%", "--accent": "60 80% 55%", "--background": "300 60% 97%", "--card": "300 35% 99%", "--card-border": "300 30% 91%", "--muted": "300 25% 92%" },
  },
  rainbow: {
    label: "Rainbow", emoji: "🌈", bg: "bg-pink-100", gradientFrom: "from-pink-400", gradientTo: "to-rose-500",
    suggestedFor: ["girl", "neutral"],
    vars: { "--primary": "330 80% 56%", "--secondary": "280 70% 60%", "--accent": "30 90% 55%", "--background": "330 70% 97%", "--card": "330 40% 99%", "--card-border": "330 35% 91%", "--muted": "330 25% 92%" },
  },
  forest: {
    label: "Forest", emoji: "🌳", bg: "bg-emerald-100", gradientFrom: "from-emerald-500", gradientTo: "to-green-700",
    suggestedFor: ["neutral", "boy"],
    vars: { "--primary": "150 65% 40%", "--secondary": "100 55% 42%", "--accent": "50 80% 50%", "--background": "130 35% 95%", "--card": "130 20% 98%", "--card-border": "130 20% 88%", "--muted": "130 15% 90%" },
  },
  sunset: {
    label: "Sunset", emoji: "🌅", bg: "bg-orange-100", gradientFrom: "from-orange-400", gradientTo: "to-rose-500",
    suggestedFor: ["neutral", "girl"],
    vars: { "--primary": "20 85% 55%", "--secondary": "350 80% 58%", "--accent": "45 95% 55%", "--background": "30 80% 96%", "--card": "30 55% 99%", "--card-border": "30 40% 89%", "--muted": "30 30% 91%" },
  },
  animals: {
    label: "Animals", emoji: "🐾", bg: "bg-amber-100", gradientFrom: "from-amber-400", gradientTo: "to-orange-500",
    suggestedFor: ["neutral", "girl"],
    vars: { "--primary": "35 85% 50%", "--secondary": "100 55% 45%", "--accent": "200 70% 50%", "--background": "40 70% 96%", "--card": "40 50% 99%", "--card-border": "40 40% 89%", "--muted": "40 30% 91%" },
  },
  robots: {
    label: "Robots", emoji: "🤖", bg: "bg-slate-100", gradientFrom: "from-slate-500", gradientTo: "to-blue-600",
    suggestedFor: ["boy"],
    vars: { "--primary": "220 70% 55%", "--secondary": "190 60% 50%", "--accent": "50 90% 55%", "--background": "220 25% 95%", "--card": "220 15% 98%", "--card-border": "220 15% 88%", "--muted": "220 10% 90%" },
  },
};

export const GENDER_DEFAULT_THEME: Record<string, string> = {
  girl: "rainbow",
  boy: "ocean",
  neutral: "default",
};
