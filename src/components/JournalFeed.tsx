import { forwardRef } from "react";
import { AnimatePresence } from "framer-motion";
import type { DiaryEntry } from "../types";
import { EntryCard } from "./EntryCard";

interface JournalFeedProps {
  entries: DiaryEntry[];
  onEntrySelect: (entry: DiaryEntry) => void;
}

export const JournalFeed = forwardRef<HTMLDivElement, JournalFeedProps>(
  function JournalFeed({ entries, onEntrySelect }, ref) {
    return (
      <div ref={ref} className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {entries.map((entry, i) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              index={i}
              onSelect={onEntrySelect}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }
);
