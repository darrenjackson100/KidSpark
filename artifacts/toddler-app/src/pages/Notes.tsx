import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext, ProgressNote } from "@/context/AppContext";
import { sounds } from "@/lib/sounds";

const CATEGORIES: { value: ProgressNote["category"]; label: string; color: string; bg: string }[] = [
  { value: "behaviour", label: "Behaviour", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  { value: "progress", label: "Progress", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  { value: "strength", label: "Strength", color: "text-green-600", bg: "bg-green-50 border-green-200" },
  { value: "challenge", label: "Challenge", color: "text-red-600", bg: "bg-red-50 border-red-200" },
  { value: "general", label: "General", color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
];

const OBSERVATIONS: { value: ProgressNote["observation"]; label: string; emoji: string; color: string }[] = [
  { value: "excellent", label: "Excellent", emoji: "🌟", color: "bg-green-500 text-white" },
  { value: "good", label: "Good", emoji: "👍", color: "bg-blue-500 text-white" },
  { value: "needs-practice", label: "Needs Practice", emoji: "💡", color: "bg-amber-500 text-white" },
];

function NoteForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<ProgressNote>;
  onSave: (data: { title: string; body: string; category: ProgressNote["category"]; observation?: ProgressNote["observation"] }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [category, setCategory] = useState<ProgressNote["category"]>(initial?.category ?? "general");
  const [observation, setObservation] = useState<ProgressNote["observation"] | undefined>(initial?.observation);

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ title, body, category, observation }); }} className="space-y-5">
      <div>
        <label className="block text-xl font-black text-foreground mb-2">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Great concentration today"
          className="w-full h-16 rounded-2xl border-4 border-border px-6 text-xl font-semibold bg-background focus:outline-none focus:border-primary"
          data-testid="input-note-title"
          required
        />
      </div>

      <div>
        <label className="block text-xl font-black text-foreground mb-2">Quick Observation</label>
        <div className="flex flex-wrap gap-3">
          {OBSERVATIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { sounds.click(); setObservation(observation === o.value ? undefined : o.value); }}
              className={`h-14 px-6 rounded-2xl border-4 text-lg font-black transition-all flex items-center gap-2 ${
                observation === o.value ? `${o.color} border-transparent` : "border-border text-muted-foreground hover:bg-muted"
              }`}
              data-testid={`button-obs-${o.value}`}
            >
              {o.emoji} {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xl font-black text-foreground mb-2">Category</label>
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => { sounds.click(); setCategory(c.value); }}
              className={`h-12 px-5 rounded-2xl border-4 text-base font-black transition-all ${
                category === c.value ? `${c.bg} ${c.color} border-current` : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xl font-black text-foreground mb-2">Notes</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your observations here..."
          rows={4}
          className="w-full rounded-2xl border-4 border-border px-6 py-4 text-xl font-semibold bg-background focus:outline-none focus:border-primary resize-none"
          data-testid="input-note-body"
          required
        />
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-16 rounded-2xl border-4 border-border text-xl font-black text-muted-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 h-16 rounded-2xl bg-accent text-white text-xl font-black hover:bg-accent/90 transition-colors shadow-md"
          data-testid="button-save-note"
        >
          Save Note
        </button>
      </div>
    </form>
  );
}

export default function Notes() {
  const [, setLocation] = useLocation();
  const { activeProfile, notes, addNote, updateNote, deleteNote } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<ProgressNote["category"] | "all">("all");

  if (!activeProfile) { setLocation("/"); return null; }

  const myNotes = notes
    .filter(n => n.childId === activeProfile.id)
    .filter(n => filterCat === "all" || n.category === filterCat)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getCatStyle = (cat: ProgressNote["category"]) =>
    CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[4];

  const getObsStyle = (obs?: ProgressNote["observation"]) =>
    OBSERVATIONS.find(o => o.value === obs);

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-5 mb-8 bg-card rounded-[2rem] p-6 border-4 border-card-border shadow-md">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.click(); setLocation("/home"); }}
            className="h-16 px-6 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground font-black text-xl border-4 border-border transition-colors"
          >
            ← Back
          </motion.button>
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-black text-foreground">Adult Notes</h1>
            <p className="text-xl font-bold text-muted-foreground">Notes for {activeProfile.name}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { sounds.pop(); setShowForm(true); setEditingId(null); }}
            className="h-16 px-8 rounded-2xl bg-primary text-white font-black text-xl shadow-md hover:bg-primary/90 transition-colors"
            data-testid="button-add-note"
          >
            + Add Note
          </motion.button>
        </header>

        <AnimatePresence>
          {(showForm || editingId) && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-card rounded-[2rem] p-8 border-4 border-card-border shadow-xl mb-8"
            >
              <h2 className="text-3xl font-black text-foreground mb-6">
                {editingId ? "Edit Note" : "New Note"}
              </h2>
              <NoteForm
                initial={editingId ? notes.find(n => n.id === editingId) : undefined}
                onSave={data => {
                  sounds.correct();
                  if (editingId) {
                    updateNote(editingId, data);
                    setEditingId(null);
                  } else {
                    addNote({ childId: activeProfile.id, ...data });
                    setShowForm(false);
                  }
                }}
                onCancel={() => { sounds.click(); setShowForm(false); setEditingId(null); }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setFilterCat("all")}
            className={`h-12 px-6 rounded-2xl border-4 text-base font-black transition-all ${
              filterCat === "all" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            All
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setFilterCat(c.value)}
              className={`h-12 px-6 rounded-2xl border-4 text-base font-black transition-all ${
                filterCat === c.value ? `${c.bg} ${c.color} border-current` : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {myNotes.length === 0 ? (
          <div className="bg-card rounded-[2rem] p-12 border-4 border-card-border shadow-md text-center">
            <div className="text-8xl mb-4">📝</div>
            <h2 className="text-4xl font-black text-foreground mb-2">No notes yet</h2>
            <p className="text-2xl font-bold text-muted-foreground">Tap "+ Add Note" to record your first observation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myNotes.map((note, i) => {
              const style = getCatStyle(note.category);
              const obsStyle = getObsStyle(note.observation);
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-[1.5rem] p-6 border-4 shadow-md ${style.bg}`}
                  data-testid={`note-item-${note.id}`}
                >
                  <div className="flex justify-between items-start mb-3 gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-2xl font-black text-foreground">{note.title}</h3>
                      {obsStyle && (
                        <span className={`text-sm font-black px-3 py-1 rounded-full ${obsStyle.color}`}>
                          {obsStyle.emoji} {obsStyle.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-black ${style.color} bg-white/60 px-3 py-1 rounded-full border-2 border-current`}>
                        {style.label}
                      </span>
                      <button
                        onClick={() => { sounds.click(); setEditingId(note.id); setShowForm(false); }}
                        className="h-10 w-10 rounded-xl bg-white/60 hover:bg-white border-2 border-current text-lg transition-colors"
                        title="Edit note"
                        data-testid={`button-edit-note-${note.id}`}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => { sounds.click(); if (confirm("Delete this note?")) deleteNote(note.id); }}
                        className="h-10 w-10 rounded-xl bg-white/60 hover:bg-red-100 border-2 border-red-300 text-lg transition-colors"
                        title="Delete note"
                        data-testid={`button-delete-note-${note.id}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-foreground/80 mb-3 leading-relaxed">{note.body}</p>
                  <p className="text-sm font-bold text-muted-foreground">
                    {new Date(note.createdAt).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    {" "}at{" "}
                    {new Date(note.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    {note.updatedAt && <span className="ml-2 opacity-70">(edited)</span>}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
