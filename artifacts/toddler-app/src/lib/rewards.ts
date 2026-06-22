import { ShopReward } from "@/context/AppContext";

// Emoji choices a grown-up can pick when creating a custom reward.
export const REWARD_EMOJIS = [
  "⭐", "🎁", "📖", "📺", "🍦", "🍕", "🌙", "🏞️",
  "🧸", "🎮", "🎬", "🎨", "🍪", "🚲", "🎈", "🍭",
  "🐶", "⚽", "🎢", "🏆", "💎", "🦄", "🎉", "🛝",
];

// Seeded the first time a grown-up turns the Rewards Shop on, so there is
// something to spend points on straight away. Fully editable afterwards.
export const DEFAULT_REWARDS: Omit<ShopReward, "id">[] = [
  { name: "Gold Sticker",       emoji: "⭐", cost: 50,  description: "A shiny sticker just for you!",        active: true },
  { name: "Extra Bedtime Story",emoji: "📖", cost: 100, description: "One extra story before bed",          active: true },
  { name: "15 Min Screen Time", emoji: "📺", cost: 150, description: "15 extra minutes of screen time",     active: true },
  { name: "Ice Cream Treat",    emoji: "🍦", cost: 200, description: "A yummy ice cream",                    active: true },
  { name: "Pick Dinner",        emoji: "🍕", cost: 250, description: "Choose what's for dinner tonight",     active: true },
  { name: "Stay Up Late",       emoji: "🌙", cost: 300, description: "Stay up 15 minutes later",             active: true },
  { name: "Trip to the Park",   emoji: "🏞️", cost: 400, description: "A fun trip to the park",               active: true },
  { name: "New Toy",            emoji: "🧸", cost: 500, description: "A small new toy or surprise",          active: true },
];

export function makeDefaultRewards(): ShopReward[] {
  return DEFAULT_REWARDS.map(r => ({ ...r, id: Math.random().toString(36).substr(2, 9) }));
}
