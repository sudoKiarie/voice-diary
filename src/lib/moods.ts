export interface MoodInfo {
  emoji: string;
  color: string;
  label: string;
}

export const MOOD_CONFIG: Record<string, MoodInfo> = {
  happy:       { emoji: "😊", color: "text-amber-600", label: "Happy" },
  sad:         { emoji: "😢", color: "text-blue-500",  label: "Sad" },
  anxious:     { emoji: "😰", color: "text-purple-500", label: "Anxious" },
  calm:        { emoji: "😌", color: "text-teal-500",  label: "Calm" },
  grateful:    { emoji: "🙏", color: "text-rose-500",  label: "Grateful" },
  reflective:  { emoji: "🤔", color: "text-slate-500", label: "Reflective" },
  excited:     { emoji: "🎉", color: "text-orange-500", label: "Excited" },
  tired:       { emoji: "😴", color: "text-gray-400",  label: "Tired" },
  stressed:    { emoji: "😫", color: "text-red-500",   label: "Stressed" },
  hopeful:     { emoji: "🌱", color: "text-emerald-500", label: "Hopeful" },
  neutral:     { emoji: "😐", color: "text-stone-500", label: "Neutral" },
  frustrated:  { emoji: "😤", color: "text-red-600",   label: "Frustrated" },
  inspired:    { emoji: "✨", color: "text-violet-500", label: "Inspired" },
};

export function getMoodEmoji(mood: string): string {
  return MOOD_CONFIG[mood]?.emoji ?? "";
}

export function getMoodColor(mood: string): string {
  return MOOD_CONFIG[mood]?.color ?? "text-stone-400";
}

export function getMoodLabel(mood: string): string {
  return MOOD_CONFIG[mood]?.label ?? mood;
}
