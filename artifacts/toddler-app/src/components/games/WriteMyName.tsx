import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { useSoundContext } from "@/context/SoundContext";
import { speak, cancelSpeech } from "@/lib/speech";
import { sounds } from "@/lib/sounds";
import { getLetterPath, Pt } from "@/lib/letterPaths";
import { isValidChildName, NAME_ERROR_WRITE_GAME } from "@/lib/name";

// "Write My Name" — a gentle, forgiving handwriting activity.
//
// TOP box: the child's own name shown as a large dotted outline with a green
// start dot + arrow on each letter. Completion is COVERAGE based (how much of
// the dotted shape the child has inked over), NOT strict ordered checkpoints —
// so it can never get stuck at "80%". Reaching TRACE_DONE coverage counts as a
// successful trace.
//
// BOTTOM box: a completely empty area where the child writes the name on their
// own. Any ink here counts as a free-write attempt and is saved as an image.
//
// Scoring (max 2 points per attempt, NOT farmable): trace only = +1,
// trace + free-write = +2. Only the first 3 *earning* attempts per child per day
// award points; further attempts still save but earn 0.

const TRACE_DONE = 0.55;        // coverage fraction that counts as "traced"
const COVER_FRAC = 0.14;        // how close ink must be to the dotted path (× size)
const DAILY_EARNING_LIMIT = 3;  // earning attempts per child per day

function todayStr() { return new Date().toISOString().slice(0, 10); }

interface Layout { w: number; traceH: number; writeH: number; }

function computeLayout(): Layout {
  const vw = typeof window !== "undefined" ? window.innerWidth : 360;
  const vh = typeof window !== "undefined" ? window.innerHeight : 640;
  const w = Math.max(260, Math.min(vw - 24, 880));
  // Reserve room for: control bar, title, two labels, footer buttons, paddings.
  const avail = Math.max(260, vh - 320);
  const each = Math.max(110, Math.min(Math.floor(avail / 2), 240));
  return { w, traceH: each, writeH: each };
}

// Interpolate points from a→b so fast strokes still register coverage.
function interpolate(a: Pt, b: Pt, step: number): Pt[] {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  if (dist <= step) return [b];
  const n = Math.ceil(dist / step);
  const out: Pt[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
}

export default function WriteMyName() {
  const [, setLocation] = useLocation();
  const { activeProfile, addGameResult, gameResults } = useAppContext();
  const { ttsEnabled } = useSoundContext();

  // Without a profile there is no name to write — bail back to games.
  const name = (activeProfile?.name ?? "").trim();

  const [layout, setLayout] = useState<Layout>(computeLayout);
  const [traced, setTraced] = useState(false);
  const [freeWrote, setFreeWrote] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);
  const [lastEarned, setLastEarned] = useState<number | null>(null);
  const [tries, setTries] = useState(0);

  const tracedRef = useRef(false);
  const freeWroteRef = useRef(false);
  const startRef = useRef<number>(Date.now());

  const guideRef = useRef<HTMLCanvasElement | null>(null);
  const traceInkRef = useRef<HTMLCanvasElement | null>(null);
  const writeRef = useRef<HTMLCanvasElement | null>(null);

  // Coverage model: dense dotted-path points + a covered flag per point.
  const pathPtsRef = useRef<Pt[]>([]);
  const coveredRef = useRef<Uint8Array>(new Uint8Array(0));
  const coveredCountRef = useRef(0);
  const coverRadiusRef = useRef(0);

  // Per-canvas drawing state.
  const traceDrawingRef = useRef(false);
  const traceLastRef = useRef<Pt | null>(null);
  const writeDrawingRef = useRef(false);
  const writeLastRef = useRef<Pt | null>(null);

  // Lock page scroll while writing.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (!activeProfile) setLocation("/");
  }, [activeProfile, setLocation]);

  useEffect(() => {
    const onResize = () => setLayout(computeLayout());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Build the dotted-name guide + coverage model for the current size.
  const buildGuide = useCallback(() => {
    const guide = guideRef.current;
    const gctx = guide?.getContext("2d");
    if (!gctx) return;
    const W = layout.w, H = layout.traceH;
    gctx.clearRect(0, 0, W, H);

    const chars = (name || "?").split("");
    const n = Math.max(1, chars.length);
    const colW = W / n;
    const side = Math.min(colW * 0.94, H * 0.94);
    coverRadiusRef.current = side * COVER_FRAC;

    const dense: Pt[] = [];

    chars.forEach((ch, i) => {
      if (ch.trim() === "") return; // skip spaces
      const strokes = getLetterPath(ch.toLowerCase());
      const originX = i * colW + (colW - side) / 2;
      const originY = (H - side) / 2;
      const scaled = strokes.map(s => s.map(p => ({ x: originX + p.x * side, y: originY + p.y * side })));

      // Wide light "road".
      gctx.lineCap = "round";
      gctx.lineJoin = "round";
      gctx.strokeStyle = "rgba(99,102,241,0.16)";
      gctx.lineWidth = side * COVER_FRAC * 1.6;
      for (const s of scaled) {
        gctx.beginPath();
        s.forEach((pt, j) => (j === 0 ? gctx.moveTo(pt.x, pt.y) : gctx.lineTo(pt.x, pt.y)));
        gctx.stroke();
      }
      // Dashed centre line.
      gctx.strokeStyle = "rgba(99,102,241,0.75)";
      gctx.lineWidth = Math.max(2, side * 0.03);
      gctx.setLineDash([side * 0.07, side * 0.07]);
      for (const s of scaled) {
        gctx.beginPath();
        s.forEach((pt, j) => (j === 0 ? gctx.moveTo(pt.x, pt.y) : gctx.lineTo(pt.x, pt.y)));
        gctx.stroke();
      }
      gctx.setLineDash([]);

      // Start dot + direction arrow on the first stroke of each letter.
      const first = scaled[0];
      if (first && first.length > 1) {
        const a = first[0];
        const b = first[Math.min(3, first.length - 1)];
        gctx.fillStyle = "#22c55e";
        gctx.beginPath();
        gctx.arc(a.x, a.y, side * 0.07, 0, Math.PI * 2);
        gctx.fill();
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        const ax = a.x + Math.cos(ang) * side * 0.2;
        const ay = a.y + Math.sin(ang) * side * 0.2;
        const hh = side * 0.09;
        gctx.fillStyle = "#16a34a";
        gctx.beginPath();
        gctx.moveTo(ax, ay);
        gctx.lineTo(ax - Math.cos(ang - 0.5) * hh, ay - Math.sin(ang - 0.5) * hh);
        gctx.lineTo(ax - Math.cos(ang + 0.5) * hh, ay - Math.sin(ang + 0.5) * hh);
        gctx.closePath();
        gctx.fill();
      }

      for (const s of scaled) for (const pt of s) dense.push(pt);
    });

    pathPtsRef.current = dense;
    coveredRef.current = new Uint8Array(dense.length);
    coveredCountRef.current = 0;
  }, [layout, name]);

  // Reset both canvases + the attempt state for a fresh try.
  const resetAttempt = useCallback(() => {
    const tctx = traceInkRef.current?.getContext("2d");
    if (tctx) tctx.clearRect(0, 0, layout.w, layout.traceH);
    const wctx = writeRef.current?.getContext("2d");
    if (wctx) wctx.clearRect(0, 0, layout.w, layout.writeH);
    coveredRef.current = new Uint8Array(pathPtsRef.current.length);
    coveredCountRef.current = 0;
    traceLastRef.current = null;
    writeLastRef.current = null;
    tracedRef.current = false;
    freeWroteRef.current = false;
    setTraced(false);
    setFreeWrote(false);
    setProgress(0);
    setStatus("");
    startRef.current = Date.now();
  }, [layout]);

  useEffect(() => { buildGuide(); resetAttempt(); }, [buildGuide, resetAttempt]);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>, h: number): Pt => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * layout.w,
      y: ((e.clientY - rect.top) / rect.height) * h,
    };
  };

  const inkLine = (ctx: CanvasRenderingContext2D | null | undefined, last: Pt | null, pt: Pt, h: number) => {
    if (!ctx) return;
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = Math.max(6, h * 0.05);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (last) ctx.moveTo(last.x, last.y); else ctx.moveTo(pt.x, pt.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  // Mark dotted-path points near the inked path as covered (forgiving).
  const markCoverage = (last: Pt | null, pt: Pt) => {
    const r = coverRadiusRef.current;
    const dense = pathPtsRef.current;
    const cov = coveredRef.current;
    if (dense.length === 0 || r <= 0) return;
    const samples = last ? interpolate(last, pt, r * 0.6) : [pt];
    for (const q of samples) {
      for (let i = 0; i < dense.length; i++) {
        if (cov[i]) continue;
        if (Math.hypot(dense[i].x - q.x, dense[i].y - q.y) <= r) {
          cov[i] = 1;
          coveredCountRef.current += 1;
        }
      }
    }
    const prog = coveredCountRef.current / dense.length;
    setProgress(prog);
    if (prog >= TRACE_DONE && !tracedRef.current) {
      tracedRef.current = true;
      setTraced(true);
      sounds.correct();
      setStatus("Great tracing! ✅");
    }
  };

  // --- Trace canvas handlers ---
  const onTraceDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    traceDrawingRef.current = true;
    const pt = pointFromEvent(e, layout.traceH);
    traceLastRef.current = null;
    inkLine(traceInkRef.current?.getContext("2d"), null, pt, layout.traceH);
    markCoverage(null, pt);
    traceLastRef.current = pt;
  };
  const onTraceMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!traceDrawingRef.current) return;
    e.preventDefault();
    const pt = pointFromEvent(e, layout.traceH);
    inkLine(traceInkRef.current?.getContext("2d"), traceLastRef.current, pt, layout.traceH);
    markCoverage(traceLastRef.current, pt);
    traceLastRef.current = pt;
  };
  const endTrace = () => { traceDrawingRef.current = false; traceLastRef.current = null; };

  // --- Free-write canvas handlers ---
  const onWriteDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    writeDrawingRef.current = true;
    const pt = pointFromEvent(e, layout.writeH);
    writeLastRef.current = null;
    inkLine(writeRef.current?.getContext("2d"), null, pt, layout.writeH);
    writeLastRef.current = pt;
    if (!freeWroteRef.current) { freeWroteRef.current = true; setFreeWrote(true); }
  };
  const onWriteMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!writeDrawingRef.current) return;
    e.preventDefault();
    const pt = pointFromEvent(e, layout.writeH);
    inkLine(writeRef.current?.getContext("2d"), writeLastRef.current, pt, layout.writeH);
    writeLastRef.current = pt;
  };
  const endWrite = () => { writeDrawingRef.current = false; writeLastRef.current = null; };

  const clearAll = () => {
    sounds.click();
    resetAttempt();
  };

  const hearName = () => { sounds.pop(); if (name) speak(name); };

  // Downscaled JPEG of the free-write canvas (white background for JPEG).
  const exportWriting = (): string | undefined => {
    if (!freeWroteRef.current) return undefined;
    const c = writeRef.current;
    if (!c) return undefined;
    const scale = Math.min(1, 480 / c.width);
    const off = document.createElement("canvas");
    off.width = Math.max(1, Math.round(c.width * scale));
    off.height = Math.max(1, Math.round(c.height * scale));
    const o = off.getContext("2d");
    if (!o) return undefined;
    o.fillStyle = "#ffffff";
    o.fillRect(0, 0, off.width, off.height);
    o.drawImage(c, 0, 0, off.width, off.height);
    try { return off.toDataURL("image/jpeg", 0.7); } catch { return undefined; }
  };

  // Save the current attempt. Returns the points earned (after the daily cap),
  // or null when there was no activity worth saving.
  const saveAttempt = (): number | null => {
    if (!activeProfile) return null;
    const didTrace = tracedRef.current;
    const didWrite = freeWroteRef.current;
    if (!didTrace && !didWrite) return null;

    const base = didTrace ? (didWrite ? 2 : 1) : 0;
    const today = todayStr();
    const earnedToday = gameResults.filter(r =>
      r.childId === activeProfile.id &&
      r.gameId === "write-name" &&
      r.score > 0 &&
      r.playedAt.slice(0, 10) === today
    ).length;
    const earned = earnedToday >= DAILY_EARNING_LIMIT ? 0 : base;
    // Stars reflect effort (so a capped attempt still feels rewarding).
    const stars = didTrace && didWrite ? 3 : didTrace ? 2 : 1;

    addGameResult({
      childId: activeProfile.id,
      gameId: "write-name",
      gameName: "Write My Name",
      category: "reading",
      score: earned,
      total: 2,
      stars,
      timeTakenSeconds: Math.round((Date.now() - startRef.current) / 1000),
      writeName: { name, traced: didTrace, freeWrote: didWrite, image: exportWriting() },
    });
    return earned;
  };

  const onNextTry = () => {
    sounds.pop();
    cancelSpeech();
    const earned = saveAttempt();
    if (earned !== null) {
      setLastEarned(earned);
      setTries(t => t + 1);
    }
    resetAttempt();
  };

  const onFinish = () => {
    sounds.celebrate();
    cancelSpeech();
    const earned = saveAttempt();
    if (earned !== null) { setLastEarned(earned); setTries(t => t + 1); }
    setDone(true);
  };

  const leave = () => { sounds.click(); cancelSpeech(); setLocation("/reading"); };

  const hasActivity = traced || freeWrote;
  const progPct = Math.min(100, Math.round(progress * 100));

  // The game only works with a real letters-only name. If the active child's
  // name is invalid (e.g. an older profile with numbers/symbols), block the
  // game and send the adult to fix it in profile settings.
  if (!isValidChildName(activeProfile?.name)) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-4 text-center">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-card rounded-[2.5rem] p-8 shadow-2xl border-4 border-card-border">
          <div className="text-7xl mb-4">✏️</div>
          <h1 className="text-2xl font-black text-foreground mb-3">Name Needs Fixing</h1>
          <p className="text-lg font-bold text-muted-foreground mb-8" data-testid="text-write-name-blocked">
            {NAME_ERROR_WRITE_GAME}
          </p>
          <div className="flex flex-col gap-3">
            {activeProfile && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => { sounds.click(); setLocation(`/edit-profile/${activeProfile.id}`); }}
                className="h-14 rounded-full text-lg font-black bg-primary hover:bg-primary/90 text-white shadow-lg transition-colors"
                data-testid="button-edit-name">
                ✏️ Edit Name
              </motion.button>
            )}
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={leave}
              className="h-14 rounded-full text-lg font-black border-4 border-border bg-muted hover:bg-muted/80 text-foreground transition-colors"
              data-testid="button-back-games">
              ← Back to Games
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-4 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl w-full bg-card rounded-[3rem] p-8 sm:p-12 shadow-2xl border-4 border-card-border">
          <div className="text-8xl mb-4">🏆</div>
          <h1 className="text-4xl font-black text-foreground mb-3">Brilliant, {name}!</h1>
          <p className="text-2xl font-bold text-muted-foreground mb-2">
            You practised writing your name {tries} {tries === 1 ? "time" : "times"}!
          </p>
          {lastEarned !== null && (
            <p className="text-xl font-black text-amber-600 mb-8" data-testid="text-final-points">
              {lastEarned > 0 ? `You earned ${lastEarned} point${lastEarned === 1 ? "" : "s"} ⭐` : "No points this time — try again tomorrow! 🌙"}
            </p>
          )}
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={leave}
            className="h-16 px-8 rounded-full text-xl font-black border-4 border-border bg-muted hover:bg-muted/80 text-foreground transition-colors"
            data-testid="button-back-games">
            ← Back to Games
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden" style={{ touchAction: "none" }}>
      {/* Sticky control bar — close + Clear always visible. */}
      <div className="flex-shrink-0 flex justify-between items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 border-b-4 border-card-border bg-card">
        <button type="button" onClick={leave}
          className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl border-4 border-border bg-muted hover:bg-muted/80 font-black text-xl text-muted-foreground transition-colors flex items-center justify-center flex-shrink-0"
          aria-label="Close" data-testid="button-close-write">
          ✕
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base sm:text-2xl font-black text-foreground truncate">Write My Name</h1>
          <button type="button" onClick={hearName}
            className="h-9 sm:h-10 px-3 rounded-full text-xs sm:text-sm font-black bg-primary hover:bg-primary/90 text-white shadow-md transition-colors flex-shrink-0"
            data-testid="button-hear-name">
            🔊 Hear
          </button>
        </div>
        <button type="button" onClick={clearAll}
          className="h-11 sm:h-12 px-4 sm:px-6 rounded-2xl border-4 border-border bg-muted hover:bg-muted/80 font-black text-base sm:text-xl text-muted-foreground transition-colors flex-shrink-0"
          data-testid="button-clear-write">
          ↺ Clear
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-start px-3 sm:px-5 py-2 overflow-hidden">
        {/* Trace area */}
        <div className="w-full flex items-center justify-between max-w-[880px] mb-1">
          <p className="text-sm sm:text-base font-black text-foreground">✏️ Trace your name</p>
          <span className="text-xs sm:text-sm font-black text-muted-foreground" data-testid="text-trace-progress">{progPct}%</span>
        </div>
        <div className="relative rounded-2xl bg-muted/40 border-4 border-dashed border-primary/40 overflow-hidden flex-shrink-0"
          style={{ width: layout.w, height: layout.traceH }}>
          <canvas ref={guideRef} width={layout.w} height={layout.traceH}
            className="absolute inset-0 pointer-events-none" style={{ width: layout.w, height: layout.traceH }} />
          <canvas ref={traceInkRef} width={layout.w} height={layout.traceH}
            className="absolute inset-0" style={{ width: layout.w, height: layout.traceH, touchAction: "none" }}
            onPointerDown={onTraceDown} onPointerMove={onTraceMove}
            onPointerUp={endTrace} onPointerLeave={endTrace} onPointerCancel={endTrace}
            data-testid="canvas-trace" />
        </div>

        {/* Free-write area */}
        <div className="w-full flex items-center justify-between max-w-[880px] mt-2 mb-1">
          <p className="text-sm sm:text-base font-black text-foreground">🖊️ Now write it yourself</p>
          {freeWrote && <span className="text-xs sm:text-sm font-black text-green-600">✅ Nice writing!</span>}
        </div>
        <div className="relative rounded-2xl bg-white border-4 border-dashed border-accent/50 overflow-hidden flex-shrink-0"
          style={{ width: layout.w, height: layout.writeH }}>
          <canvas ref={writeRef} width={layout.w} height={layout.writeH}
            className="absolute inset-0" style={{ width: layout.w, height: layout.writeH, touchAction: "none" }}
            onPointerDown={onWriteDown} onPointerMove={onWriteMove}
            onPointerUp={endWrite} onPointerLeave={endWrite} onPointerCancel={endWrite}
            data-testid="canvas-write" />
        </div>

        {/* Status + footer buttons */}
        <div className="flex-1 min-h-0 w-full max-w-[880px] flex flex-col items-center justify-center gap-2 mt-2">
          <p className="text-sm sm:text-base font-black text-accent text-center min-h-[1.25rem]" data-testid="text-status">
            {status || (hasActivity ? "" : "Trace the dotted name, then write it yourself!")}
          </p>
          <div className="flex gap-3 w-full max-w-md">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={onNextTry}
              className="flex-1 h-14 sm:h-16 rounded-full text-base sm:text-xl font-black border-4 border-border bg-muted hover:bg-muted/80 text-foreground transition-colors"
              data-testid="button-next-try">
              ↻ Next Try
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={onFinish}
              className="flex-1 h-14 sm:h-16 rounded-full text-base sm:text-xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg transition-colors"
              data-testid="button-finish">
              Finish ✓
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
