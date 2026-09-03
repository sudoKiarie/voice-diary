import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getMoodEmoji, getMoodLabel } from "../lib/moods";
import type { DiaryEntry } from "../types";

type OverlayState = "analyzing" | "complete" | "error";

interface AnalysisOverlayProps {
  transcript: string;
  onComplete: (entry: DiaryEntry) => void;
  onDismiss: () => void;
}

export function AnalysisOverlay({
  transcript,
  onComplete,
  onDismiss,
}: AnalysisOverlayProps) {
  const [overlayState, setOverlayState] = useState<OverlayState>("analyzing");
  const [errorMessage, setErrorMessage] = useState("");
  const [preview, setPreview] = useState<{
    title: string;
    mood: string;
  } | null>(null);
  const hasCalledRef = useRef(false);

  useEffect(() => {
    if (hasCalledRef.current) return;
    hasCalledRef.current = true;

    async function analyze() {
      try {
        const { data, error } = await supabase.functions.invoke(
          "analyze-entry",
          { body: { transcript } }
        );

        if (error || !data) {
          throw new Error(
            error?.message || "We couldn't analyze that — try again?"
          );
        }

        if (data.error) {
          throw new Error(data.error);
        }

        const entry: DiaryEntry = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          transcript,
          title: data.title || "Untitled Entry",
          mood: data.mood || "neutral",
          topics: data.topics || [],
          peopleMentioned: data.peopleMentioned || [],
          actionItems: data.actionItems || [],
          keyIdeas: data.keyIdeas || [],
        };

        setPreview({ title: entry.title, mood: entry.mood });
        setOverlayState("complete");

        // Brief celebration pause, then hand off the entry
        await new Promise((r) => setTimeout(r, 2200));
        onComplete(entry);
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
        setOverlayState("error");
      }
    }

    analyze();
  }, [transcript, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md rounded-2xl bg-paper border border-border shadow-card p-8"
      >
        {/* ── Analyzing state ─────────────────────────────── */}
        {overlayState === "analyzing" && (
          <div className="flex flex-col items-center text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 size={48} className="text-accent" aria-hidden="true" />
            </motion.div>

            <h3 className="mt-6 font-heading text-xl text-text-primary">
              Reflecting on your entry…
            </h3>
            <p className="mt-2 text-sm text-text-muted font-sans leading-relaxed">
              Our AI is reading your words and pulling out the key moments,
              mood, and themes.
            </p>

            {/* Transcript snippet */}
            <blockquote className="mt-6 w-full rounded-xl bg-paper-dark border border-border p-4 text-left">
              <p className="text-text-muted text-xs font-sans line-clamp-4 italic leading-relaxed">
                &ldquo;{transcript.slice(0, 280)}
                {transcript.length > 280 && "…"}&rdquo;
              </p>
            </blockquote>
          </div>
        )}

        {/* ── Complete state ──────────────────────────────── */}
        <AnimatePresence>
          {overlayState === "complete" && preview && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 18,
                  delay: 0.1,
                }}
              >
                <CheckCircle2
                  size={56}
                  className="text-emerald-500"
                  aria-hidden="true"
                />
              </motion.div>

              <h3 className="mt-5 font-heading text-xl text-text-primary">
                Entry saved!
              </h3>

              <div className="mt-4 flex items-center gap-2 text-accent">
                <span className="text-2xl" aria-hidden="true">
                  {getMoodEmoji(preview.mood)}
                </span>
                <span className="font-heading text-lg text-text-primary">
                  {preview.title}
                </span>
              </div>

              <p className="mt-2 text-sm text-text-muted">
                {getMoodLabel(preview.mood)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error state ─────────────────────────────────── */}
        {overlayState === "error" && (
          <div className="flex flex-col items-center text-center">
            <AlertTriangle size={48} className="text-red-400" aria-hidden="true" />

            <h3 className="mt-5 font-heading text-xl text-text-primary">
              Couldn&apos;t analyze this entry
            </h3>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              {errorMessage}
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onDismiss}
                className="px-5 py-2.5 rounded-xl bg-paper-dark border border-border text-text-primary text-sm font-medium font-sans hover:bg-paper-dark/80 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
              >
                Save anyway
              </button>
              <button
                onClick={() => {
                  // Re-trigger by remounting — dismiss so user can re-record
                  onDismiss();
                }}
                className="px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium font-sans hover:bg-accent/90 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer active:scale-[0.97]"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
