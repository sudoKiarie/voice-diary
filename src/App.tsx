import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEntries } from "./hooks/useEntries";
import { RecordingOrb } from "./components/RecordingOrb";
import { AnalysisOverlay } from "./components/AnalysisOverlay";
import { JournalFeed } from "./components/JournalFeed";
import { EntryDetail } from "./components/EntryDetail";
import { Greeting } from "./components/Greeting";
import { SearchBar } from "./components/SearchBar";
import { ReflectionStats } from "./components/ReflectionStats";
import { searchEntries } from "./lib/entries";
import type { DiaryEntry } from "./types";

export default function App() {
  const { entries, addEntry } = useEntries();
  const [analysisTranscript, setAnalysisTranscript] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const journalRef = useRef<HTMLElement>(null);

  const handleTranscriptionComplete = useCallback((transcript: string) => {
    setAnalysisTranscript(transcript);
  }, []);

  const handleAnalysisComplete = useCallback(
    (entry: DiaryEntry) => {
      addEntry(entry);
      setAnalysisTranscript(null);
      // Scroll to the journal section so the user sees their new card
      setTimeout(() => {
        journalRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    },
    [addEntry]
  );

  const handleAnalysisDismiss = useCallback(() => {
    setAnalysisTranscript(null);
  }, []);

  // ─── Journal entries sorted newest-first, then filtered ────
  const displayedEntries = useMemo(() => {
    const sorted = [...entries].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return searchQuery.trim()
      ? searchEntries(sorted, searchQuery.trim())
      : sorted;
  }, [entries, searchQuery]);

  return (
    <div className="paper-texture min-h-screen">
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Greeting Section */}
        <Greeting />

        {/* Recording Orb */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="mb-12 flex flex-col items-center"
        >
          <RecordingOrb onTranscriptionComplete={handleTranscriptionComplete} />
        </motion.section>

        {/* Journal Feed */}
        <motion.section
          ref={journalRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-2xl text-text-primary">
              Your Journal
            </h2>
            {entries.length > 0 && (
              <span className="text-sm text-text-muted font-sans">
                {displayedEntries.length}{" "}
                {searchQuery.trim()
                  ? `result${displayedEntries.length !== 1 ? "s" : ""}`
                  : `${entries.length === 1 ? "entry" : "entries"}`}
              </span>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <SearchBar onSearch={setSearchQuery} />
          </div>

          {displayedEntries.length === 0 ? (
            <div className="rounded-2xl bg-paper-dark p-8 shadow-card border border-border">
              <p className="text-text-muted text-sm font-sans text-center">
                {searchQuery.trim()
                  ? `No entries match "${searchQuery.trim()}". Try a different search.`
                  : "Your voice diary entries will appear here as beautiful journal cards."}
              </p>
            </div>
          ) : (
            <JournalFeed
              entries={displayedEntries}
              onEntrySelect={(entry) => setSelectedEntry(entry)}
            />
          )}
        </motion.section>

        {/* Stats Section */}
        <ReflectionStats entries={entries} />
      </main>

      {/* ── Analysis Overlay ─────────────────────────────────── */}
      <AnimatePresence>
        {analysisTranscript && (
          <AnalysisOverlay
            transcript={analysisTranscript}
            onComplete={handleAnalysisComplete}
            onDismiss={handleAnalysisDismiss}
          />
        )}
      </AnimatePresence>

      {/* ── Entry Detail Modal ───────────────────────────────── */}
      <AnimatePresence>
        {selectedEntry && (
          <EntryDetail
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
