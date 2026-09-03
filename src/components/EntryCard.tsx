import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import type { DiaryEntry } from "../types";
import { getMoodEmoji, getMoodColor, getMoodLabel } from "../lib/moods";

interface EntryCardProps {
  entry: DiaryEntry;
  index: number;
  onSelect: (entry: DiaryEntry) => void;
}

const MAX_VISIBLE_TOPICS = 3;

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function snippet(text: string, maxLen = 120): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}

export function EntryCard({ entry, index, onSelect }: EntryCardProps) {
  const visibleTopics = entry.topics.slice(0, MAX_VISIBLE_TOPICS);
  const remaining = entry.topics.length - MAX_VISIBLE_TOPICS;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: "easeOut",
      }}
      layout
      className="group rounded-2xl bg-paper-dark border border-border shadow-card p-5 sm:p-6 hover:shadow-card-hover hover:border-accent/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      tabIndex={0}
      role="button"
      aria-label={`View entry: ${entry.title}`}
      onClick={() => onSelect(entry)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(entry);
        }
      }}
    >
      {/* Top row: mood + date */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg leading-none" aria-hidden="true">
          {getMoodEmoji(entry.mood)}
        </span>
        <span
          className={`text-[11px] font-semibold uppercase tracking-wide font-sans ${getMoodColor(entry.mood)}`}
        >
          {getMoodLabel(entry.mood)}
        </span>
        <span className="text-text-muted/40 select-none" aria-hidden="true">
          ·
        </span>
        <span className="flex items-center gap-1 text-xs text-text-muted font-sans">
          <Clock size={11} aria-hidden="true" />
          <time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
        </span>
      </div>

      {/* Title */}
      <h3 className="font-heading text-lg text-text-primary truncate mb-2">
        {entry.title}
      </h3>

      {/* Topics */}
      {visibleTopics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {visibleTopics.map((topic) => (
            <span
              key={topic}
              className="inline-block px-2 py-0.5 rounded-md bg-accent/10 text-accent text-xs font-sans font-medium"
            >
              {topic}
            </span>
          ))}
          {remaining > 0 && (
            <span className="inline-block px-2 py-0.5 rounded-md bg-border text-text-muted text-xs font-sans font-medium">
              +{remaining} more
            </span>
          )}
        </div>
      )}

      {/* Transcript snippet */}
      {entry.transcript && (
        <p className="text-sm text-text-muted font-sans leading-relaxed line-clamp-2">
          {snippet(entry.transcript)}
        </p>
      )}
    </motion.article>
  );
}
