import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Shuffle } from "lucide-react";

const PROMPTS = [
  "What drained your energy today?",
  "What's one small win you haven't celebrated yet?",
  "What are you holding onto that you could let go of?",
  "What made you feel most like yourself today?",
  "What's one thing you wish you'd said out loud?",
  "What are you grateful for right now, however small?",
  "Where did your mind wander today?",
  "What's been quietly worrying you lately?",
  "What would you tell your younger self?",
  "What boundary do you need to set this week?",
  "What surprised you today?",
  "What's one thing you're looking forward to?",
  "What felt heavy to carry today?",
  "What does rest look like for you this week?",
];

// Deterministic prompt of the day so the app opens with a stable suggestion,
// then reshuffles to a fresh one each calendar day.
function getDailyPromptIndex(date: Date): number {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % PROMPTS.length;
}

export function JournalingPrompt() {
  const [promptIndex, setPromptIndex] = useState(() =>
    getDailyPromptIndex(new Date())
  );
  const reduceMotion = useReducedMotion();

  // Reshuffle at midnight even if the tab stays open all day.
  useEffect(() => {
    let timeoutId: number | undefined;

    const scheduleMidnightReset = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      timeoutId = window.setTimeout(() => {
        setPromptIndex(getDailyPromptIndex(new Date()));
        scheduleMidnightReset();
      }, nextMidnight.getTime() - now.getTime());
    };

    scheduleMidnightReset();
    return () => window.clearTimeout(timeoutId);
  }, []);

  const cyclePrompt = useCallback(() => {
    setPromptIndex((prev) => {
      if (PROMPTS.length < 2) return prev;
      let next = Math.floor(Math.random() * PROMPTS.length);
      if (next === prev) next = (next + 1) % PROMPTS.length;
      return next;
    });
  }, []);

  const prompt = PROMPTS[promptIndex];

  return (
    <motion.button
      type="button"
      onClick={cyclePrompt}
      aria-label={`Journaling prompt: ${prompt}. Tap to shuffle.`}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      className="group mt-6 w-full max-w-md cursor-pointer rounded-card border border-border bg-paper-dark/70 px-5 py-4 text-left shadow-card transition-[box-shadow,background-color] duration-200 ease-out hover:bg-paper-dark hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="flex items-center justify-between gap-3">
        <span
          aria-hidden="true"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted"
        >
          Today&apos;s prompt
        </span>
        <Shuffle
          size={16}
          aria-hidden="true"
          className="text-text-muted transition-transform duration-200 ease-out group-hover:rotate-12"
        />
      </span>

      <span className="mt-1.5 block min-h-[3.5rem]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={prompt}
            aria-live="polite"
            aria-atomic="true"
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
            transition={{
              duration: reduceMotion ? 0 : 0.25,
              ease: "easeOut",
            }}
            className="block font-heading text-xl leading-snug text-text-primary"
          >
            {prompt}
          </motion.span>
        </AnimatePresence>
      </span>

      <span aria-hidden="true" className="mt-2 block text-xs text-text-muted">
        Tap to shuffle
      </span>
    </motion.button>
  );
}
