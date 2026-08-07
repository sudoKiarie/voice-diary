import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";

const EXAMPLE_QUERIES = [
  "What did I say about my startup?",
  "When did I last talk about Sarah?",
  "Show ideas about AI.",
  "What was I worried about?",
];

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      {/* Search icon */}
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted/60 pointer-events-none" />

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search your memories..."
        className="w-full pl-11 pr-10 py-3 bg-paper-dark border border-border rounded-xl font-sans text-sm text-ink placeholder:text-ink-muted/40 outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10 transition-all"
        aria-label="Search memories"
      />

      {/* Clear button */}
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-border hover:bg-border/80 cursor-pointer transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3 h-3 text-ink-muted" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Example queries (only when empty) */}
      {!value && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => onChange(q)}
              className="px-2.5 py-1 rounded-full bg-border/50 border border-border text-[11px] font-sans text-ink-muted hover:text-ink hover:bg-border/80 cursor-pointer transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
