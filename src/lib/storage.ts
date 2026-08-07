export interface DiaryEntry {
  id: string;
  text: string;
  title?: string;
  summary?: string;
  mood?: { emoji: string; label: string };
  topics?: string[];
  duration: number; // seconds
  people?: string[];
  actionItems?: string[];
  keyIdeas?: string[];
  createdAt: number; // timestamp ms
  updatedAt: number;
}

const STORAGE_KEY = "voice-diary-entries";

export function loadEntries(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DiaryEntry[];
  } catch {
    return [];
  }
}

export function saveEntries(entries: DiaryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function addEntry(
  text: string,
  meta?: Partial<Pick<DiaryEntry, "mood" | "topics" | "duration" | "title" | "summary" | "people" | "actionItems" | "keyIdeas">>
): DiaryEntry[] {
  const entries = loadEntries();
  const now = Date.now();
  const entry: DiaryEntry = {
    id: crypto.randomUUID(),
    text,
    createdAt: now,
    updatedAt: now,
    duration: 0,
    ...meta,
  };
  if (!entry.title) {
    entry.title = text.length > 60 ? text.slice(0, 57) + "..." : text;
  }
  entries.unshift(entry);
  saveEntries(entries);
  return entries;
}

export function updateEntry(id: string, text: string): DiaryEntry[] {
  const entries = loadEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return entries;
  entries[idx] = { ...entries[idx], text, updatedAt: Date.now() };
  saveEntries(entries);
  return entries;
}

export function deleteEntry(id: string): DiaryEntry[] {
  const entries = loadEntries().filter((e) => e.id !== id);
  saveEntries(entries);
  return entries;
}
