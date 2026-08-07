import { motion } from "framer-motion";
import { Sparkles, BookOpen, Brain, TrendingUp } from "lucide-react";
import type { DiaryEntry } from "../lib/storage";

interface DailyReflectionProps {
  entries: DiaryEntry[];
}

export default function DailyReflection({ entries }: DailyReflectionProps) {
  if (entries.length === 0) return null;

  // Compute stats
  const totalEntries = entries.length;

  const moodCounts: Record<string, { emoji: string; count: number }> = {};
  for (const e of entries) {
    if (e.mood) {
      const key = e.mood.label;
      if (!moodCounts[key])
        moodCounts[key] = { emoji: e.mood.emoji, count: 0 };
      moodCounts[key].count++;
    }
  }
  const mostCommonMood = Object.values(moodCounts).sort(
    (a, b) => b.count - a.count
  )[0];

  const topicCounts: Record<string, number> = {};
  for (const e of entries) {
    if (e.topics) {
      for (const t of e.topics) {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      }
    }
  }
  const mostCommonTopic = Object.entries(topicCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const totalDuration = entries.reduce((s, e) => s + e.duration, 0);
  const avgDuration = totalDuration / totalEntries;
  const avgDurStr = `${Math.floor(avgDuration / 60)}m ${Math.floor(avgDuration % 60)}s`;

  // Streak (consecutive days with entries)
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = new Set(
    entries.map((e) => {
      const d = new Date(e.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (dates.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <h2 className="journal-heading text-xl text-ink mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-accent" />
        This week
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total entries */}
        <div className="entry-card p-4">
          <BookOpen className="w-4 h-4 text-accent mb-2" />
          <p className="text-2xl font-sans font-semibold text-ink">
            {totalEntries}
          </p>
          <p className="text-xs font-sans text-ink-muted mt-0.5">
            {totalEntries === 1 ? "memory" : "memories"}
          </p>
        </div>

        {/* Most common mood */}
        {mostCommonMood && (
          <div className="entry-card p-4">
            <span className="text-xl mb-1 block">{mostCommonMood.emoji}</span>
            <p className="text-sm font-sans font-medium text-ink truncate">
              {mostCommonMood.count}x {mostCommonMood.count === 1 ? "" : ""}
            </p>
            <p className="text-xs font-sans text-ink-muted mt-0.5">
              Most common mood
            </p>
          </div>
        )}

        {/* Most discussed topic */}
        {mostCommonTopic && (
          <div className="entry-card p-4">
            <Brain className="w-4 h-4 text-accent mb-2" />
            <p className="text-sm font-sans font-medium text-ink truncate">
              {mostCommonTopic[0]}
            </p>
            <p className="text-xs font-sans text-ink-muted mt-0.5">
              Most discussed
            </p>
          </div>
        )}

        {/* Streak */}
        <div className="entry-card p-4">
          <TrendingUp className="w-4 h-4 text-accent mb-2" />
          <p className="text-2xl font-sans font-semibold text-ink">
            {streak}
          </p>
          <p className="text-xs font-sans text-ink-muted mt-0.5">
            {streak === 1 ? "day" : "day"} streak
          </p>
        </div>
      </div>
    </motion.div>
  );
}
