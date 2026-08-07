import { motion } from "framer-motion";
import { useState } from "react";
import {
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Lightbulb,
  ListChecks,
  FileText,
} from "lucide-react";
import type { DiaryEntry } from "../lib/storage";

interface SummaryCardProps {
  entry: DiaryEntry;
  onClose: () => void;
}

export default function SummaryCard({ entry, onClose }: SummaryCardProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  const durationStr = `${Math.floor(entry.duration / 60)}:${(entry.duration % 60).toString().padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-paper rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85dvh] overflow-y-auto px-6 pt-6 pb-8"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-border/50 hover:bg-border cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-ink-muted" />
        </button>

        {/* Title */}
        {entry.title && (
          <h2 className="journal-heading text-2xl text-ink mb-2 pr-8 leading-snug">
            {entry.title}
          </h2>
        )}

        {/* Date & Duration */}
        <div className="flex items-center gap-4 text-xs text-ink-muted font-sans mb-4">
          <span>
            {new Intl.DateTimeFormat("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(entry.createdAt))}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {durationStr}
          </span>
        </div>

        {/* Mood */}
        {entry.mood && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-sm font-sans text-accent mb-4">
            <span>{entry.mood.emoji}</span>
            <span>{entry.mood.label}</span>
          </div>
        )}

        {/* Summary */}
        {entry.summary && (
          <p className="font-sans text-base text-ink leading-relaxed mb-5">
            {entry.summary}
          </p>
        )}

        {/* Topics */}
        {entry.topics && entry.topics.length > 0 && (
          <div className="mb-5">
            <h4 className="font-sans text-xs uppercase tracking-wider text-ink-muted mb-2">
              Topics
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {entry.topics.map((topic) => (
                <span
                  key={topic}
                  className="px-2.5 py-1 rounded-md bg-paper-dark text-xs font-sans text-ink-muted border border-border"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* People */}
        {entry.people && entry.people.length > 0 && (
          <div className="mb-5">
            <h4 className="font-sans text-xs uppercase tracking-wider text-ink-muted mb-2 flex items-center gap-1.5">
              <User className="w-3 h-3" />
              People mentioned
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {entry.people.map((person) => (
                <span
                  key={person}
                  className="px-2.5 py-1 rounded-md bg-accent-light/20 text-xs font-sans text-accent border border-accent-light/30"
                >
                  {person}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Key Ideas */}
        {entry.keyIdeas && entry.keyIdeas.length > 0 && (
          <div className="mb-5">
            <h4 className="font-sans text-xs uppercase tracking-wider text-ink-muted mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3 h-3" />
              Key ideas
            </h4>
            <ul className="space-y-1">
              {entry.keyIdeas.map((idea, i) => (
                <li
                  key={i}
                  className="font-sans text-sm text-ink-muted flex gap-2"
                >
                  <span className="text-accent mt-0.5">•</span>
                  {idea}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {entry.actionItems && entry.actionItems.length > 0 && (
          <div className="mb-5">
            <h4 className="font-sans text-xs uppercase tracking-wider text-ink-muted mb-2 flex items-center gap-1.5">
              <ListChecks className="w-3 h-3" />
              Action items
            </h4>
            <ul className="space-y-1">
              {entry.actionItems.map((item, i) => (
                <li
                  key={i}
                  className="font-sans text-sm text-ink-muted flex gap-2"
                >
                  <span className="text-accent mt-0.5">☐</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Expandable Transcript */}
        <div className="border-t border-border pt-4 mt-2">
          <button
            onClick={() => setShowTranscript((s) => !s)}
            className="flex items-center gap-2 text-sm font-sans text-ink-muted hover:text-ink transition-colors cursor-pointer"
            aria-expanded={showTranscript}
          >
            <FileText className="w-4 h-4" />
            {showTranscript ? "Hide" : "Show"} original transcript
            {showTranscript ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          {showTranscript && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3"
            >
              <p className="font-sans text-sm text-ink-muted leading-relaxed whitespace-pre-wrap">
                {entry.text}
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
