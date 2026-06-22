import { GameResult, RewardPurchase } from "@/context/AppContext";

export interface PointsBreakdown {
  correctPoints: number;
  scoreBonus: number;
  total: number;
}

// Unified points-earning rules (one scheme for every game, including the Daily
// Challenge and Timed Play):
//  • +5 for every correct answer, +0 for wrong answers
//  • a single tiered accuracy bonus based on the percentage score:
//      0–25% → +0,  26–49% → +5,  50–69% → +15,
//      70–89% → +30, 90–99% → +50, 100% → +75
// Low scores therefore earn very little (e.g. 1/20 = 5 points), while only
// strong, accurate play earns a meaningful bonus. gameId no longer affects the
// score — it is kept in the signature only so existing callers stay unchanged.
function scoreBonusFor(score: number, total: number): number {
  if (total <= 0) return 0;
  const pct = Math.floor((score / total) * 100);
  if (pct >= 100) return 75;
  if (pct >= 90) return 50;
  if (pct >= 70) return 30;
  if (pct >= 50) return 15;
  if (pct >= 26) return 5;
  return 0;
}

// "Write My Name" is a repeatable handwriting activity, so it is deliberately
// kept OUTSIDE the score×5 + accuracy-bonus economy: its stored score already
// IS the points earned (0, 1 or 2), capped here so it can never be farmed for
// large amounts. The daily-attempt cap is enforced by the game itself.
const WRITE_NAME_MAX_POINTS = 2;

export function breakdownGamePoints(opts: { score: number; total: number; stars: number; gameId: string }): PointsBreakdown {
  if (opts.gameId === "write-name") {
    const total = Math.max(0, Math.min(WRITE_NAME_MAX_POINTS, Math.round(opts.score)));
    return { correctPoints: total, scoreBonus: 0, total };
  }
  const correctPoints = opts.score * 5;
  const scoreBonus = scoreBonusFor(opts.score, opts.total);
  return { correctPoints, scoreBonus, total: correctPoints + scoreBonus };
}

export function computeGamePoints(opts: { score: number; total: number; stars: number; gameId: string }): number {
  return breakdownGamePoints(opts).total;
}

export function computeTotalPoints(results: GameResult[]): number {
  return results.reduce((sum, r) => sum + computeGamePoints({ score: r.score, total: r.total, stars: r.stars, gameId: r.gameId }), 0);
}

// Spent points only count once a purchase has been approved (pending requests
// are reserved against the child but do not deduct until a grown-up approves).
export function computeSpentPoints(purchases: RewardPurchase[]): number {
  return purchases.filter(p => p.status === "approved").reduce((sum, p) => sum + p.pointsSpent, 0);
}

// Spendable balance = points earned from games − points already spent.
export function computeBalance(results: GameResult[], purchases: RewardPurchase[]): number {
  return computeTotalPoints(results) - computeSpentPoints(purchases);
}

export interface MilestoneBadge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  requiredQuestions?: number;
  requiredGames?: number;
  requiredPoints?: number;
}

export const MILESTONE_BADGES: MilestoneBadge[] = [
  { id: "q5",    emoji: "🌱", title: "First 5 Questions",   description: "Answered 5 questions!",     requiredQuestions: 5 },
  { id: "q10",   emoji: "⭐", title: "10 Question Star",     description: "Answered 10 questions!",    requiredQuestions: 10 },
  { id: "q25",   emoji: "🦸", title: "25 Question Hero",     description: "Answered 25 questions!",    requiredQuestions: 25 },
  { id: "q50",   emoji: "🏅", title: "50 Question Champion", description: "Answered 50 questions!",    requiredQuestions: 50 },
  { id: "q100",  emoji: "🏆", title: "100 Question Master",  description: "Answered 100 questions!",   requiredQuestions: 100 },
  { id: "g5",    emoji: "🎮", title: "5 Games Completed",    description: "Completed 5 games!",        requiredGames: 5 },
  { id: "g10",   emoji: "🎯", title: "10 Games Completed",   description: "Completed 10 games!",       requiredGames: 10 },
  { id: "g25",   emoji: "🚀", title: "25 Games Completed",   description: "Completed 25 games!",       requiredGames: 25 },
  { id: "g50",   emoji: "👑", title: "50 Games Completed",   description: "Completed 50 games!",       requiredGames: 50 },
  { id: "p100",  emoji: "💎", title: "100 Points",           description: "Earned 100 points!",        requiredPoints: 100 },
  { id: "p500",  emoji: "💫", title: "500 Points",           description: "Earned 500 points!",        requiredPoints: 500 },
  { id: "p1000", emoji: "🌟", title: "1,000 Points",         description: "Earned 1,000 points!",      requiredPoints: 1000 },
  { id: "p5000", emoji: "🔥", title: "5,000 Points",         description: "Earned 5,000 points!",      requiredPoints: 5000 },
];

export function getEarnedMilestoneBadges(results: GameResult[]): MilestoneBadge[] {
  const totalQ = results.reduce((s, r) => s + r.total, 0);
  const totalG = results.length;
  const totalP = computeTotalPoints(results);
  return MILESTONE_BADGES.filter(b =>
    (b.requiredQuestions === undefined || totalQ >= b.requiredQuestions) &&
    (b.requiredGames === undefined || totalG >= b.requiredGames) &&
    (b.requiredPoints === undefined || totalP >= b.requiredPoints)
  );
}

export function getNextMilestone(results: GameResult[]): { badge: MilestoneBadge; progress: number; target: number } | null {
  const totalQ = results.reduce((s, r) => s + r.total, 0);
  const totalG = results.length;
  const totalP = computeTotalPoints(results);
  for (const b of MILESTONE_BADGES) {
    if (b.requiredQuestions !== undefined && totalQ < b.requiredQuestions)
      return { badge: b, progress: totalQ, target: b.requiredQuestions };
    if (b.requiredGames !== undefined && totalG < b.requiredGames)
      return { badge: b, progress: totalG, target: b.requiredGames };
    if (b.requiredPoints !== undefined && totalP < b.requiredPoints)
      return { badge: b, progress: totalP, target: b.requiredPoints };
  }
  return null;
}
