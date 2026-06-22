import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext, ShopReward, RewardPurchase } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";
import { computeBalance } from "@/lib/points";
import { PasscodeEntry } from "@/components/PasscodeGate";
import Confetti from "@/components/Confetti";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLES: Record<RewardPurchase["status"], { label: string; cls: string }> = {
  approved: { label: "Approved ✅", cls: "bg-green-100 text-green-700 border-green-300" },
  pending: { label: "Waiting ⏳", cls: "bg-amber-100 text-amber-700 border-amber-300" },
  rejected: { label: "Denied ✖", cls: "bg-red-100 text-red-600 border-red-300" },
  cancelled: { label: "Cancelled 🚫", cls: "bg-gray-100 text-gray-500 border-gray-300" },
};

export default function Shop() {
  const [, setLocation] = useLocation();
  const {
    activeProfile, gameResults, rewardPurchases,
    requestReward, approvePurchase, rejectPurchase, cancelPurchase,
    verifyPasscode, hasPasscode,
  } = useAppContext();

  const [celebration, setCelebration] = useState<{ reward: ShopReward; pending: boolean } | null>(null);
  const [lockMessage, setLockMessage] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  // The adult must re-enter the passcode for EVERY review, so this verification
  // flag is reset each time a request is opened and never persisted.
  const [reviewVerified, setReviewVerified] = useState(false);

  const openReview = (id: string) => { sounds.click(); setApprovingId(id); setReviewVerified(false); };
  const closeReview = () => { setApprovingId(null); setReviewVerified(false); };

  if (!activeProfile) { setLocation("/"); return null; }

  // A grown-up may have switched the shop off via Edit Profile.
  if (!(activeProfile.pointsEnabled ?? false)) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center text-center gap-5">
        <div className="text-6xl">🔒</div>
        <h1 className="text-3xl font-black text-foreground">The Rewards Shop is closed</h1>
        <p className="text-lg font-bold text-muted-foreground max-w-md">Ask a grown-up to turn on the Points & Rewards Shop in Edit Profile.</p>
        <button onClick={() => { sounds.click(); setLocation("/home"); }}
          className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-xl border-4 border-primary/70 shadow-md"
          data-testid="button-back-home">
          ← Back Home
        </button>
      </div>
    );
  }

  const myResults = gameResults.filter(r => r.childId === activeProfile.id);
  const myPurchases = rewardPurchases
    .filter(p => p.childId === activeProfile.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const balance = computeBalance(myResults, myPurchases);
  const rewards = (activeProfile.rewards ?? []).filter(r => r.active);
  const requireApproval = activeProfile.requireApproval ?? false;
  const pendingForApproval = myPurchases.filter(p => p.status === "pending");

  const pendingRewardIds = new Set(pendingForApproval.map(p => p.rewardId));

  const handleBuy = (reward: ShopReward) => {
    // The context layer is authoritative: it refuses (returns false) when the
    // child cannot afford the reward and never creates a pending request.
    const ok = requestReward(activeProfile.id, reward);
    if (!ok) {
      sounds.wrong();
      setLockMessage(true);
      setTimeout(() => setLockMessage(false), 2600);
      return;
    }
    sounds.celebrate();
    setCelebration({ reward, pending: requireApproval });
  };

  const approvingPurchase = pendingForApproval.find(p => p.id === approvingId) ?? null;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-5 md:p-10">
      <Confetti active={!!celebration && !celebration.pending} />
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="flex items-center gap-3 sm:gap-5 mb-6 bg-card rounded-[2rem] p-4 sm:p-6 border-4 border-card-border shadow-md">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.click(); setLocation("/home"); }}
            className="h-12 sm:h-16 px-4 sm:px-6 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground font-black text-base sm:text-xl border-4 border-border transition-colors flex-shrink-0"
            data-testid="button-back">
            ← Back
          </motion.button>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-foreground leading-tight">Rewards Shop 🎁</h1>
            <p className="text-base sm:text-xl font-bold text-muted-foreground truncate">Spend your points, {activeProfile.name}!</p>
          </div>
        </header>

        {/* Balance */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="mb-6 rounded-[2rem] p-5 sm:p-7 border-4 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 flex items-center justify-center gap-4 shadow-md text-center"
          data-testid="shop-balance">
          <span className="text-5xl sm:text-6xl">💰</span>
          <div>
            <div className="text-4xl sm:text-6xl font-black text-amber-600 leading-none">{balance}</div>
            <div className="text-base sm:text-xl font-black text-amber-700 mt-1">points to spend</div>
          </div>
        </motion.div>

        {/* Keep learning lock message */}
        <AnimatePresence>
          {lockMessage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-2xl p-4 border-4 border-orange-200 bg-orange-50 text-center"
              data-testid="lock-message">
              <p className="text-lg sm:text-xl font-black text-orange-700">You need more points to unlock this reward.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending approvals (grown-up) */}
        {requireApproval && pendingForApproval.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-foreground mb-3">⏳ Waiting for a grown-up</h2>
            <div className="space-y-3">
              {pendingForApproval.map(p => (
                <div key={p.id} className="rounded-2xl border-4 border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  data-testid={`pending-row-${p.id}`}>
                  <span className="text-3xl flex-shrink-0">{p.rewardEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-black text-foreground truncate">{p.rewardName}</p>
                    <p className="text-sm font-bold text-amber-700">💰 {p.pointsSpent} points · asked {formatDateTime(p.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => { sounds.click(); cancelPurchase(p.id, activeProfile?.id ?? ""); }}
                      className="h-12 px-4 rounded-2xl bg-card hover:bg-muted text-red-600 font-black text-base border-4 border-red-200 shadow-sm"
                      data-testid={`button-cancel-${p.id}`}>
                      ✖ Cancel
                    </button>
                    <button onClick={() => openReview(p.id)}
                      className="h-12 px-5 rounded-2xl bg-secondary hover:bg-secondary/90 text-white font-black text-base border-4 border-secondary/60 shadow-md flex items-center gap-1"
                      data-testid={`button-review-${p.id}`}>
                      🔒 Grown-up review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reward grid */}
        {rewards.length === 0 ? (
          <div className="rounded-[2rem] border-4 border-dashed border-border bg-muted/40 p-10 text-center">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-xl font-black text-foreground">No rewards yet!</p>
            <p className="text-base font-bold text-muted-foreground mt-1">Ask a grown-up to add some rewards in Edit Profile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {rewards.map((reward, i) => {
              const affordable = balance >= reward.cost;
              const isPending = pendingRewardIds.has(reward.id);
              return (
                <motion.div key={reward.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, type: "spring" }}
                  className={`rounded-[1.5rem] border-4 p-4 flex flex-col items-center text-center shadow-md ${
                    affordable ? "border-card-border bg-card" : "border-border bg-muted/50"
                  }`}
                  data-testid={`reward-card-${reward.id}`}>
                  <div className={`text-5xl mb-2 ${affordable ? "" : "grayscale opacity-60"}`}>{reward.emoji}</div>
                  <h3 className="text-lg font-black text-foreground leading-tight">{reward.name}</h3>
                  {reward.description && <p className="text-xs font-bold text-muted-foreground mt-1 line-clamp-2">{reward.description}</p>}
                  <div className="text-base font-black text-amber-600 my-2">💰 {reward.cost}</div>
                  <motion.button whileHover={affordable ? { scale: 1.05 } : undefined} whileTap={affordable ? { scale: 0.95 } : undefined}
                    onClick={() => handleBuy(reward)}
                    className={`w-full h-12 rounded-2xl font-black text-base border-4 transition-colors mt-auto ${
                      affordable
                        ? "bg-secondary hover:bg-secondary/90 text-white border-secondary/60"
                        : "bg-muted text-muted-foreground border-border cursor-not-allowed"
                    }`}
                    data-testid={`button-buy-${reward.id}`}>
                    {affordable ? (requireApproval ? "Ask 🙋" : "Get it! 🎉") : "Need more 🔒"}
                  </motion.button>
                  {isPending && <p className="text-xs font-black text-amber-600 mt-2">Already asked ⏳</p>}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* My reward history */}
        {myPurchases.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-foreground mb-3">📜 My Rewards</h2>
            <div className="space-y-2">
              {myPurchases.map(p => (
                <div key={p.id} className="rounded-2xl border-4 border-card-border bg-card p-3 sm:p-4 flex items-center gap-3"
                  data-testid={`history-row-${p.id}`}>
                  <span className="text-2xl sm:text-3xl flex-shrink-0">{p.rewardEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black text-foreground truncate">{p.rewardName}</p>
                    <p className="text-xs font-bold text-muted-foreground">💰 {p.pointsSpent} · asked {formatDateTime(p.createdAt)}</p>
                    {p.decidedAt && (
                      <p className="text-xs font-bold text-muted-foreground">
                        {p.status === "cancelled" ? "Cancelled" : p.status === "rejected" ? "Denied" : "Approved"} {formatDateTime(p.decidedAt)}
                        {p.status === "approved" && p.balanceAfter !== undefined && ` · ${p.balanceAfter} left`}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black border-2 flex-shrink-0 ${STATUS_STYLES[p.status].cls}`}>
                    {STATUS_STYLES[p.status].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Celebration modal */}
      <AnimatePresence>
        {celebration && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
            onClick={() => { sounds.click(); setCelebration(null); }}>
            <motion.div initial={{ scale: 0.7, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.7, opacity: 0 }}
              className="bg-card rounded-[2rem] border-4 border-card-border shadow-2xl p-8 max-w-sm w-full text-center"
              onClick={e => e.stopPropagation()}
              data-testid="celebration-modal">
              <motion.div animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.8 }}
                className="text-7xl mb-3">{celebration.reward.emoji}</motion.div>
              {celebration.pending ? (
                <>
                  <h2 className="text-3xl font-black text-amber-600 mb-2">Reward request sent! 🙋</h2>
                  <p className="text-lg font-bold text-muted-foreground">Waiting for adult approval.</p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-black text-secondary mb-2">Reward unlocked! 🎉</h2>
                  <p className="text-lg font-bold text-muted-foreground">You got <span className="font-black text-foreground">{celebration.reward.name}</span>!</p>
                </>
              )}
              <button onClick={() => { sounds.click(); setCelebration(null); }}
                className="mt-5 w-full h-14 rounded-2xl bg-primary text-white font-black text-xl border-4 border-primary/70 shadow-md"
                data-testid="button-close-celebration">
                Yay! 🌟
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grown-up approval (passcode) modal */}
      <AnimatePresence>
        {approvingPurchase && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-[2rem] border-4 border-card-border shadow-2xl max-w-md w-full p-6"
              data-testid="approval-modal">
              <div className="text-center mb-4">
                <div className="text-5xl mb-2">{approvingPurchase.rewardEmoji}</div>
                <h2 className="text-2xl font-black text-foreground">Review {approvingPurchase.rewardName}</h2>
                <p className="text-base font-bold text-muted-foreground">{approvingPurchase.pointsSpent} points · approving spends them, denying keeps them.</p>
              </div>
              {hasPasscode && !reviewVerified ? (
                // Passcode is required for BOTH approve and deny, every single
                // time — even if the adult unlocked another area earlier.
                <PasscodeEntry
                  verify={verifyPasscode}
                  onSuccess={() => setReviewVerified(true)}
                  onBack={closeReview}
                />
              ) : (
                <div className="space-y-3">
                  <button onClick={() => { const ok = approvePurchase(approvingPurchase.id); if (ok) sounds.celebrate(); else sounds.wrong(); closeReview(); }}
                    className="w-full h-14 rounded-2xl bg-secondary text-white font-black text-xl border-4 border-secondary/60 shadow-md"
                    data-testid="button-approve">
                    ✅ Approve reward
                  </button>
                  <button onClick={() => { sounds.click(); rejectPurchase(approvingPurchase.id); closeReview(); }}
                    className="w-full h-12 rounded-2xl border-4 border-red-200 text-red-600 font-black text-base hover:bg-red-50"
                    data-testid="button-reject">
                    ✖ Deny request
                  </button>
                  <button onClick={closeReview}
                    className="w-full h-12 rounded-2xl border-4 border-border bg-muted hover:bg-muted/70 text-muted-foreground font-black text-base"
                    data-testid="button-review-cancel">
                    ← Back
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
