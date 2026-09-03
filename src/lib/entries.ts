import type { DiaryEntry } from "../types";

/**
 * Count consecutive days (including today) that have at least one entry.
 * If today has no entry, the streak is 0.
 */
export function computeStreak(entries: DiaryEntry[]): number {
  if (entries.length === 0) return 0;

  // Build a Set of dates (YYYY-MM-DD) that have at least one entry
  const entryDates = new Set(
    entries.map((e) => new Date(e.createdAt).toISOString().slice(0, 10))
  );

  const today = new Date().toISOString().slice(0, 10);
  if (!entryDates.has(today)) return 0;

  let streak = 0;
  const current = new Date(today);

  while (entryDates.has(current.toISOString().slice(0, 10))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

/**
 * Returns a map of mood -> count from all entries.
 */
export function computeMoodDistribution(
  entries: DiaryEntry[]
): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const entry of entries) {
    const mood = entry.mood.toLowerCase();
    distribution[mood] = (distribution[mood] ?? 0) + 1;
  }
  return distribution;
}

/**
 * Case-insensitive search across title, transcript, topics, mood, and peopleMentioned.
 */
export function searchEntries(
  entries: DiaryEntry[],
  query: string
): DiaryEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return entries;

  return entries.filter((entry) => {
    const searchable = [
      entry.title,
      entry.transcript,
      entry.mood,
      ...entry.topics,
      ...entry.peopleMentioned,
    ]
      .join(" ")
      .toLowerCase();
    return searchable.includes(q);
  });
}

/**
 * Total number of entries.
 */
export function getTotalEntries(entries: DiaryEntry[]): number {
  return entries.length;
}
