import { useMemo } from "react";
import { motion } from "framer-motion";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatToday(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

export function Greeting() {
  const greeting = useMemo(getGreeting, []);
  const today = useMemo(formatToday, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-8"
    >
      <h1 className="font-heading text-4xl sm:text-5xl text-text-primary">
        {greeting}
        <span
          className="inline-block ml-2 animate-[wave_1.5s_ease-in-out_infinite]"
          aria-hidden="true"
          style={{
            transformOrigin: "70% 70%",
            animationName: "wave",
          }}
        >
          👋
        </span>
      </h1>
      <p className="mt-2 text-lg text-text-muted font-sans">{today}</p>
    </motion.header>
  );
}
