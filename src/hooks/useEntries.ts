import { useState, useEffect, useCallback } from "react";
import type { DiaryEntry } from "../types";

const STORAGE_KEY = "voice-diary-entries";

function loadEntries(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    // JSON parse error — corrupted data; return empty
    return [];
  }
}

function saveEntries(entries: DiaryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    if (
      err instanceof DOMException &&
      err.name === "QuotaExceededError"
    ) {
      throw new Error(
        "Storage is full. Please clear some entries to make room for new ones."
      );
    }
    throw err;
  }
}

export function useEntries() {
  const [entries, setEntries] = useState<DiaryEntry[]>(() => loadEntries());

  // Re-sync from localStorage if another tab modifies it
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setEntries(loadEntries());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const addEntry = useCallback((entry: DiaryEntry) => {
    setEntries((prev) => {
      const updated = [entry, ...prev];
      saveEntries(updated);
      return updated;
    });
  }, []);

  const getEntries = useCallback((): DiaryEntry[] => {
    return [...entries].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [entries]);

  return { entries, addEntry, getEntries };
}
