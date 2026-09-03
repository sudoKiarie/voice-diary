import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Clock, User, CheckSquare, Lightbulb } from "lucide-react";
import type { DiaryEntry } from "../types";
import { getMoodEmoji, getMoodColor, getMoodLabel } from "../lib/moods";

interface EntryDetailProps {
  entry: DiaryEntry;
  onClose: () => void;
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function EntryDetail({ entry, onClose }: EntryDetailProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Save active element before opening so we can return focus on close
  useEffect(() => {
    triggerRef.current = document.activeElement;
  }, []);

  // Focus trap + Escape handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key !== "Tab" || !overlayRef.current) return;

      const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  // Lock scroll + attach keyboard listener
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    // Focus close button on mount
    requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", handleKeyDown);
      // Return focus to trigger element
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [handleKeyDown]);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <motion.div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-detail-title"
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Panel */}
      <motion.div
        className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-paper border border-border shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Close button */}
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-paper-dark border border-border text-text-muted hover:text-text-primary hover:border-accent/30 hover:bg-accent-light/50 transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 active:scale-95"
          aria-label="Close entry detail"
        >
          <X size={16} />
        </button>

        <div className="p-6 sm:p-8">
          {/* Mood + Date header */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-3xl leading-none" aria-hidden="true">
              {getMoodEmoji(entry.mood)}
            </span>
            <div>
              <span
                className={`inline-block text-xs font-semibold uppercase tracking-wide font-sans ${getMoodColor(entry.mood)}`}
              >
                {getMoodLabel(entry.mood)}
              </span>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-text-muted font-sans">
                <Clock size={11} aria-hidden="true" />
                <time dateTime={entry.createdAt}>
                  {formatFullDate(entry.createdAt)} at {formatTime(entry.createdAt)}
                </time>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2
            id="entry-detail-title"
            className="font-heading text-2xl sm:text-3xl text-text-primary mb-5"
          >
            {entry.title}
          </h2>

          {/* Full transcript */}
          <section className="mb-6">
            <div className="max-h-48 overflow-y-auto rounded-xl bg-paper-dark p-4 border border-border text-sm text-text-primary font-sans leading-relaxed whitespace-pre-wrap">
              {entry.transcript}
            </div>
          </section>

          {/* AI Analysis sections */}
          <div className="space-y-4">
            {/* Topics */}
            {entry.topics.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 font-sans">
                  Topics
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {entry.topics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-block px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-xs font-sans font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* People mentioned */}
            {entry.peopleMentioned.length > 0 && (
              <section>
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 font-sans">
                  <User size={12} aria-hidden="true" />
                  People Mentioned
                </h3>
                <ul className="flex flex-wrap gap-1.5">
                  {entry.peopleMentioned.map((person) => (
                    <li
                      key={person}
                      className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-sans font-medium"
                    >
                      {person}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Action items */}
            {entry.actionItems.length > 0 && (
              <section>
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 font-sans">
                  <CheckSquare size={12} aria-hidden="true" />
                  Action Items
                </h3>
                <ul className="space-y-1.5">
                  {entry.actionItems.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-text-primary font-sans"
                    >
                      <span className="mt-0.5 flex-shrink-0 text-accent" aria-hidden="true">
                        <CheckSquare size={14} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Key ideas */}
            {entry.keyIdeas.length > 0 && (
              <section>
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 font-sans">
                  <Lightbulb size={12} aria-hidden="true" />
                  Key Ideas
                </h3>
                <ul className="space-y-1.5">
                  {entry.keyIdeas.map((idea, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-text-primary font-sans"
                    >
                      <span className="mt-0.5 flex-shrink-0 text-accent" aria-hidden="true">
                        <Lightbulb size={14} />
                      </span>
                      <span>{idea}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
