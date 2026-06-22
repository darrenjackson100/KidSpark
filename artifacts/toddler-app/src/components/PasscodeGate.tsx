import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";

const MAX_LEN = 4;

function NumberPad({
  value,
  onChange,
  onSubmit,
  accent = "bg-primary hover:bg-primary/90",
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  accent?: string;
}) {
  const press = (d: string) => {
    if (value.length >= MAX_LEN) return;
    sounds.click();
    onChange(value + d);
  };
  const del = () => {
    if (!value.length) return;
    sounds.click();
    onChange(value.slice(0, -1));
  };

  return (
    <div className="w-full">
      {/* Entry display */}
      <div className="flex justify-center gap-4 mb-8" aria-hidden>
        {Array.from({ length: MAX_LEN }, (_, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full border-4 transition-colors ${
              i < value.length ? "bg-primary border-primary" : "bg-transparent border-border"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xs mx-auto">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(d => (
          <motion.button
            key={d}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => press(d)}
            className="h-20 rounded-3xl bg-muted hover:bg-muted/70 border-4 border-border text-4xl font-black text-foreground transition-colors"
            data-testid={`button-pad-${d}`}
          >
            {d}
          </motion.button>
        ))}
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={del}
          className="h-20 rounded-3xl bg-muted hover:bg-muted/70 border-4 border-border text-3xl font-black text-muted-foreground transition-colors"
          data-testid="button-pad-delete"
        >
          ⌫
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => press("0")}
          className="h-20 rounded-3xl bg-muted hover:bg-muted/70 border-4 border-border text-4xl font-black text-foreground transition-colors"
          data-testid="button-pad-0"
        >
          0
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => { if (value.length) { sounds.pop(); onSubmit(); } }}
          disabled={!value.length}
          className={`h-20 rounded-3xl text-3xl font-black text-white shadow-lg transition-colors disabled:opacity-40 ${accent}`}
          data-testid="button-pad-enter"
        >
          ✓
        </motion.button>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card rounded-[2.5rem] shadow-2xl p-8 border-4 border-card-border"
      >
        {children}
      </motion.div>
    </div>
  );
}

export function PasscodeEntry({
  verify,
  onSuccess,
  onBack,
}: {
  verify: (code: string) => boolean;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (verify(value)) {
      sounds.correct();
      onSuccess();
    } else {
      sounds.wrong();
      setError(true);
      setValue("");
    }
  };

  return (
    <Shell>
      <div className="text-center mb-6">
        <div className="text-7xl mb-3">🔒</div>
        <h1 className="text-3xl font-black text-foreground mb-1">Enter Adult Passcode</h1>
        <p className="text-lg font-bold text-muted-foreground">Grown-ups only — please enter your passcode.</p>
      </div>

      <NumberPad value={value} onChange={(v) => { setValue(v); setError(false); }} onSubmit={submit} />

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 text-center text-lg font-black text-red-600"
            data-testid="text-passcode-error"
          >
            ❌ Wrong passcode. Please try again.
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => { sounds.click(); onBack(); }}
        className="mt-7 w-full h-14 rounded-2xl border-4 border-border bg-muted hover:bg-muted/70 text-xl font-black text-muted-foreground transition-colors"
        data-testid="button-passcode-back"
      >
        ← Back
      </button>
    </Shell>
  );
}

export function PasscodeCreate({
  title = "Create an Adult Passcode",
  subtitle = "Choose a 1–4 digit passcode to protect grown-up areas like progress, notes and settings.",
  onDone,
  onBack,
}: {
  title?: string;
  subtitle?: string;
  onDone: (code: string) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [first, setFirst] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (step === "create") {
      sounds.pop();
      setFirst(value);
      setValue("");
      setError(null);
      setStep("confirm");
    } else {
      if (value === first) {
        sounds.celebrate();
        onDone(value);
      } else {
        sounds.wrong();
        setError("Passcodes did not match. Let's try again.");
        setFirst("");
        setValue("");
        setStep("create");
      }
    }
  };

  return (
    <Shell>
      <div className="text-center mb-6">
        <div className="text-7xl mb-3">{step === "create" ? "🔑" : "✅"}</div>
        <h1 className="text-3xl font-black text-foreground mb-1">
          {step === "create" ? title : "Confirm Passcode"}
        </h1>
        <p className="text-lg font-bold text-muted-foreground">
          {step === "create" ? subtitle : "Enter the same passcode again to confirm."}
        </p>
      </div>

      <NumberPad
        value={value}
        onChange={(v) => { setValue(v); setError(null); }}
        onSubmit={submit}
        accent="bg-secondary hover:bg-secondary/90"
      />

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 text-center text-lg font-black text-red-600"
            data-testid="text-passcode-create-error"
          >
            ❌ {error}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => { sounds.click(); onBack(); }}
        className="mt-7 w-full h-14 rounded-2xl border-4 border-border bg-muted hover:bg-muted/70 text-xl font-black text-muted-foreground transition-colors"
        data-testid="button-passcode-create-back"
      >
        ← Back
      </button>
    </Shell>
  );
}

// Wraps adult-only routes. Verification is per-mount (local state) and is NOT
// remembered across navigations: every time an adult-only route is opened the
// passcode must be entered again, so children cannot wander into progress,
// notes, scores or settings by clicking around. If no passcode exists yet (e.g.
// profiles created before this feature), the adult is prompted to create one.
export default function PasscodeGate({ children }: { children: React.ReactNode }) {
  const { hasPasscode, verifyPasscode, setPasscode } = useAppContext();
  const [, setLocation] = useLocation();
  const [verified, setVerified] = useState(false);

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else setLocation("/home");
  };

  if (verified) return <>{children}</>;

  if (!hasPasscode) {
    return (
      <PasscodeCreate
        title="Set an Adult Passcode"
        subtitle="Protect grown-up areas with a 1–4 digit passcode. You'll need it to view progress, notes and settings."
        onDone={(code) => { setPasscode(code); setVerified(true); }}
        onBack={goBack}
      />
    );
  }

  return <PasscodeEntry verify={verifyPasscode} onSuccess={() => setVerified(true)} onBack={goBack} />;
}
