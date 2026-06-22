const HOME_REWARDS: string[] = [
  "Choose a bedtime story",
  "Pick a film",
  "Extra TV time",
  "Extra tablet time",
  "Choose dinner",
  "Trip to the park",
  "Small toy",
  "Ice cream treat",
];

const SCHOOL_REWARDS: string[] = [
  "Teacher helper",
  "Line leader",
  "Extra reading time",
  "Golden time",
  "Classroom reward",
  "Sticker prize",
  "Homework pass",
  "Choose a classroom activity",
];

const CUSTOM_EXAMPLES: { label: string; points: number }[] = [
  { label: "Stay up 15 minutes later", points: 800 },
  { label: "New toy", points: 3000 },
  { label: "Family trip", points: 5000 },
];

const SETUP_STEPS: string[] = [
  "Open the child's profile",
  "Click Edit",
  "Open Rewards & Shop Settings",
  "Add, edit, remove, or disable rewards",
  "Set your own point values",
];

export function PointsGuide() {
  return (
    <div className="rounded-2xl border-4 border-secondary/30 bg-secondary/5 p-4 sm:p-5 space-y-5"
      data-testid="points-guide">
      {/* How points are earned */}
      <div className="space-y-2 text-sm sm:text-base font-bold text-muted-foreground leading-relaxed">
        <p>Children earn <span className="font-black text-secondary">+5 points</span> for every correct answer. Wrong answers earn nothing.</p>
        <p>At the end of each game there is an accuracy bonus — but only good, accurate play is rewarded:</p>
        <ul className="space-y-1 pl-1">
          {[
            { range: "0–25%", bonus: "+0" },
            { range: "26–49%", bonus: "+5" },
            { range: "50–69%", bonus: "+15" },
            { range: "70–89%", bonus: "+30" },
            { range: "90–99%", bonus: "+50" },
            { range: "100%", bonus: "+75" },
          ].map(b => (
            <li key={b.range} className="flex items-center gap-2">
              <span className="text-secondary flex-shrink-0">•</span>
              <span className="flex-1">{b.range} correct</span>
              <span className="font-black text-amber-600">{b.bonus} bonus</span>
            </li>
          ))}
        </ul>
        <p>The same rules apply to every game, including the Daily Challenge and Timed Play. A low score earns very little (1 out of 20 correct = just 5 points), so points reflect real effort.</p>
        <p>As a rough guide, a child may earn around <span className="font-black text-secondary">100–300 points</span> during 30 minutes of accurate learning. Use this when setting reward prices.</p>
      </div>

      {/* Custom rewards explanation */}
      <div className="rounded-xl bg-card border-2 border-card-border p-4 space-y-3">
        <p className="text-base sm:text-lg font-black text-foreground">🎨 Custom Rewards</p>
        <p className="text-sm font-bold text-muted-foreground leading-relaxed">
          Parents and teachers can create their own rewards and choose exactly how many points they cost.
        </p>
        <div>
          <p className="text-sm font-black text-foreground mb-1.5">To create or edit rewards:</p>
          <ol className="space-y-1">
            {SETUP_STEPS.map((step, i) => (
              <li key={step} className="flex gap-2 text-sm font-bold text-muted-foreground">
                <span className="font-black text-secondary flex-shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-sm font-bold text-muted-foreground leading-relaxed">
          This allows every family, classroom, or child to have personalised rewards.
        </p>
      </div>

      {/* Example reward ideas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-card border-2 border-card-border p-3">
          <p className="text-sm font-black text-foreground mb-2">🏠 Home Rewards</p>
          <ul className="space-y-1">
            {HOME_REWARDS.map(r => (
              <li key={r} className="text-sm font-bold text-muted-foreground flex gap-2">
                <span className="text-secondary flex-shrink-0">•</span><span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-card border-2 border-card-border p-3">
          <p className="text-sm font-black text-foreground mb-2">🏫 School Rewards</p>
          <ul className="space-y-1">
            {SCHOOL_REWARDS.map(r => (
              <li key={r} className="text-sm font-bold text-muted-foreground flex gap-2">
                <span className="text-secondary flex-shrink-0">•</span><span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Custom point-value examples */}
      <div>
        <p className="text-sm sm:text-base font-black text-foreground mb-1">💡 Set any point value you want</p>
        <p className="text-sm font-bold text-muted-foreground mb-2 leading-relaxed">
          Parents and teachers can create unlimited custom rewards and assign any point value. For example:
        </p>
        <div className="space-y-1.5">
          {CUSTOM_EXAMPLES.map(p => (
            <div key={p.label}
              className="flex items-center gap-2 bg-card rounded-xl px-3 py-2 border-2 border-card-border">
              <span className="flex-1 min-w-0 text-sm font-bold text-foreground truncate">{p.label}</span>
              <span className="text-sm font-black text-amber-600 flex-shrink-0">{p.points} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing note */}
      <p className="text-xs sm:text-sm font-bold text-muted-foreground bg-amber-50 border-2 border-amber-200 rounded-xl p-3 leading-relaxed">
        ℹ️ There is no correct price. Every child earns points at different speeds. A typical child may earn approximately <span className="font-black text-amber-700">100–300 points</span> during 30 minutes of accurate learning, which can help you estimate suitable reward values.
      </p>
    </div>
  );
}
