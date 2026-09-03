import { useState, useRef, useCallback, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [value, setValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setValue(next);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        onSearch(next);
      }, 300);
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    setValue("");
    onSearch("");
  }, [onSearch]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search your journal…"
        aria-label="Search your journal entries"
        className="w-full rounded-xl bg-paper-dark border border-border pl-11 pr-10 py-3 text-sm font-sans text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors duration-200"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors duration-150 cursor-pointer p-1 rounded-md focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
