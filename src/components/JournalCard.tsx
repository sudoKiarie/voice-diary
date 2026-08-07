import { motion } from "framer-motion";
import { Clock, Mic } from "lucide-react";
import type { DiaryEntry } from "../lib/storage";

interface JournalCardProps {
  entry: DiaryEntry;
  index: number;
  onClick: () => void;
}

export default function JournalCard({
  entry,
  index,
  onClick,
}: JournalCardProps) {
  const dateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(entry.createdAt));

  const durationStr = `${Math.floor(entry.duration / 60)}:${(entry.duration % 60).toString().padStart(2, "0")}`;

  const preview =
    entry.summary ||
    (entry.text.length > 120 ? entry.text.slice(0, 117) + "..." : entry.text);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="entry-card p-5 cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={`Entry: ${entry.title || "Untitled"}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Top row: title + mood */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="journal-heading text-lg text-ink leading-snug flex-1">
          {entry.title || "Untitled entry"}
        </h3>
        {entry.mood && (
          <span
            className="text-lg flex-shrink-0"
            aria-label={`Mood: ${entry.mood.label}`}
            title={entry.mood.label}
          >
            {entry.mood.emoji}
          </span>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-3 text-xs text-ink-muted font-sans mb-2.5">
        <span>{dateStr}</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {durationStr}
        </span>
        <span className="flex items-center gap-1">
          <Mic className="w-3 h-3" />
          Voice
        </span>
      </div>

      {/* Preview */}
      <p className="font-sans text-sm text-ink-muted leading-relaxed line-clamp-2">
        {preview}
      </p>

      {/* Topics */}
      {entry.topics && entry.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {entry.topics.slice(0, 3).map((topic) => (
            <span
              key={topic}
              className="px-2 py-0.5 rounded text-[10px] font-sans uppercase tracking-wider bg-accent/8 text-accent border border-accent/15"
            >
              {topic}
            </span>
          ))}
        </div>
      )}
    </motion.article>
  );
}
