import { motion } from "framer-motion";
import { Mic } from "lucide-react";

const INSPIRATIONS = [
  "Every thought you capture becomes part of your story.",
  "Your mind deserves a place to rest.",
  "The smallest moments become your biggest memories.",
  "Speak freely — your second brain is listening.",
  "What you feel today is tomorrow's treasure.",
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning.";
  if (h < 17) return "Good afternoon.";
  return "Good evening.";
}

function getPrompt(): string {
  const prompts = [
    "What happened today?",
    "What's on your mind?",
    "What would you like to remember?",
    "What are you grateful for?",
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

function formatDate(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

interface GreetingProps {
  onStartRecording: () => void;
}

export default function Greeting({ onStartRecording }: GreetingProps) {
  const inspiration =
    INSPIRATIONS[Math.floor(Math.random() * INSPIRATIONS.length)];
  const prompt = getPrompt();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col items-center justify-center min-h-[70dvh] px-6 text-center"
    >
      {/* Greeting */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="journal-heading text-5xl sm:text-6xl md:text-7xl text-ink mb-3"
        style={{ fontStyle: "italic" }}
      >
        {getGreeting()}
      </motion.h1>

      {/* Date */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="font-sans text-sm text-ink-muted tracking-wide uppercase mb-6"
      >
        {formatDate()}
      </motion.p>

      {/* Prompt */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="font-sans text-lg text-ink-muted mb-10 max-w-md"
      >
        {prompt}
      </motion.p>

      {/* Inspiration line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="font-sans text-sm text-ink-muted/60 italic mb-16 max-w-sm"
      >
        "{inspiration}"
      </motion.p>

      {/* Record CTA */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.4, ease: "easeOut" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStartRecording}
        className="record-btn flex items-center gap-3 rounded-full px-8 py-4 text-base font-medium shadow-lg"
        aria-label="Start recording"
      >
        <Mic className="w-5 h-5" />
        Record a thought
      </motion.button>
    </motion.div>
  );
}
