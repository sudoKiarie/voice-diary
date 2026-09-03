import { useMemo } from "react";
import { motion } from "framer-motion";
import type { DiaryEntry } from "../types";
import {
  computeStreak,
  getTotalEntries,
  computeMoodDistribution,
} from "../lib/entries";
import { MOOD_CONFIG } from "../lib/moods";

interface ReflectionStatsProps {
  entries: DiaryEntry[];
}

// Mapped bar background classes for each mood (using Tailwind default palette)
const BAR_BG: Record<string, string> = {
  happy: "bg-amber-200",
  sad: "bg-blue-200",
  anxious: "bg-purple-200",
  calm: "bg-teal-200",
  grateful: "bg-rose-200",
  reflective: "bg-slate-200",
  excited: "bg-orange-200",
  tired: "bg-gray-200",
  stressed: "bg-red-200",
  hopeful: "bg-emerald-200",
  neutral: "bg-stone-200",
  frustrated: "bg-red-200",
  inspired: "bg-violet-200",
};

const BAR_FILL: Record<string, string> = {
  happy: "bg-amber-500",
  sad: "bg-blue-500",
  anxious: "bg-purple-500",
  calm: "bg-teal-500",
  grateful: "bg-rose-500",
  reflective: "bg-slate-500",
  excited: "bg-orange-500",
  tired: "bg-gray-400",
  stressed: "bg-red-500",
  hopeful: "bg-emerald-500",
  neutral: "bg-stone-500",
  frustrated: "bg-red-600",
  inspired: "bg-violet-500",
};

export function ReflectionStats({ entries }: ReflectionStatsProps) {
  const streak = useMemo(() => computeStreak(entries), [entries]);
  const total = useMemo(() => getTotalEntries(entries), [entries]);
  const topMood = useMemo(() => {
    const dist = computeMoodDistribution(entries);
    const sorted = Object.entries(dist).sort(([, a], [, b]) => b - a);
    return sorted[0]?.[0] ?? null;
  }, [entries]);

  const moodDistribution = useMemo(() => {
    const dist = computeMoodDistribution(entries);
    const totalEntries = entries.length;
    return Object.entries(dist)
      .sort(([, a], [, b]) => b - a)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: Math.round((count / totalEntries) * 100),
        config: MOOD_CONFIG[mood] ?? {
          emoji: "😶",
          color: "text-stone-400",
          label: mood,
        },
        barBg: BAR_BG[mood] ?? "bg-stone-200",
        barFill: BAR_FILL[mood] ?? "bg-stone-400",
      }));
  }, [entries]);

  const hasEntries = entries.length > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
    >
      <h2 className="font-heading text-2xl text-text-primary mb-4">
        Reflections
      </h2>

      {/* ── Stat Cards Row ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Streak */}
        <div className="rounded-2xl bg-paper-dark p-6 shadow-card border border-border">
          <p
            className="text-text-muted text-xs font-sans uppercase tracking-wider"
            aria-hidden="true"
          >
            🔥 Streak
          </p>
          {hasEntries && streak > 0 ? (
            <p className="mt-2 font-heading text-3xl text-text-primary">
              {streak}
              <span className="text-base font-sans text-text-muted ml-1.5">
                day{streak !== 1 ? "s" : ""}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-text-muted font-sans leading-relaxed">
              {hasEntries
                ? "No streak yet — write today!"
                : "Start journaling today!"}
            </p>
          )}
        </div>

        {/* Total Entries */}
        <div className="rounded-2xl bg-paper-dark p-6 shadow-card border border-border">
          <p
            className="text-text-muted text-xs font-sans uppercase tracking-wider"
            aria-hidden="true"
          >
            ✍️ Entries
          </p>
          <p className="mt-2 font-heading text-3xl text-text-primary">
            {hasEntries ? total : "—"}
          </p>
        </div>

        {/* Top Mood */}
        <div className="rounded-2xl bg-paper-dark p-6 shadow-card border border-border">
          <p
            className="text-text-muted text-xs font-sans uppercase tracking-wider"
            aria-hidden="true"
          >
            🎯 Top Mood
          </p>
          {topMood ? (
            <p className="mt-2 font-heading text-3xl text-text-primary flex items-center gap-2">
              <span aria-hidden="true">
                {MOOD_CONFIG[topMood]?.emoji ?? ""}
              </span>
              {topMood.charAt(0).toUpperCase() + topMood.slice(1)}
            </p>
          ) : (
            <p className="mt-2 font-heading text-3xl text-text-primary">—</p>
          )}
        </div>
      </div>

      {/* ── Mood Distribution Chart ────────────────────── */}
      {!hasEntries ? (
        <div className="rounded-2xl bg-paper-dark p-8 shadow-card border border-border">
          <p className="text-text-muted text-sm font-sans text-center">
            Record your first entry to see mood insights.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-paper-dark p-6 shadow-card border border-border space-y-3">
          <h3 className="font-heading text-lg text-text-primary mb-1">
            Mood Distribution
          </h3>
          {moodDistribution.map(({ mood, count, percentage, config, barBg, barFill }) => (
            <div key={mood} className="flex items-center gap-3">
              {/* Label */}
              <span className="w-20 text-xs font-sans font-medium text-text-primary flex items-center gap-1.5">
                <span aria-hidden="true">{config.emoji}</span>
                {config.label}
              </span>

              {/* Bar track */}
              <div
                className={`flex-1 h-6 rounded-full overflow-hidden ${barBg}`}
                role="progressbar"
                aria-label={`${config.label}: ${percentage}% (${count} ${count === 1 ? "entry" : "entries"})`}
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${barFill}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Count */}
              <span className="w-12 text-right text-xs font-sans text-text-muted tabular-nums">
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
