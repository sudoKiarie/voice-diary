import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Brain, Sparkles, FileText, Search, Check } from "lucide-react";

const STAGES = [
  { icon: Mic, label: "Uploading recording...", duration: 1500 },
  { icon: Brain, label: "Understanding your thoughts...", duration: 2000 },
  { icon: Sparkles, label: "Finding important moments...", duration: 2000 },
  { icon: FileText, label: "Creating your journal entry...", duration: 2000 },
  { icon: Search, label: "Organizing memories...", duration: 1500 },
];

interface AIThinkingOverlayProps {
  onComplete: () => void;
}

export default function AIThinkingOverlay({
  onComplete,
}: AIThinkingOverlayProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (stageIndex >= STAGES.length) {
      onComplete();
      return;
    }

    const stage = STAGES[stageIndex];
    const startTime = performance.now();
    let frame: number;

    const tick = () => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(elapsed / stage.duration, 1);
      setProgress(pct);
      if (pct < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setStageIndex((i) => i + 1);
      }
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [stageIndex, onComplete]);

  const currentStage = STAGES[Math.min(stageIndex, STAGES.length - 1)];
  const Icon = currentStage.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper/85 backdrop-blur-md"
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            "radial-gradient(ellipse at 50% 45%, oklch(0.55 0.18 35 / 0.06) 0%, transparent 60%)",
            "radial-gradient(ellipse at 50% 45%, oklch(0.55 0.18 35 / 0.12) 0%, transparent 60%)",
            "radial-gradient(ellipse at 50% 45%, oklch(0.55 0.18 35 / 0.06) 0%, transparent 60%)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Animated icon */}
      <div className="relative mb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={stageIndex}
            initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, rotate: 10 }}
            transition={{ duration: 0.4 }}
            className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center"
          >
            <Icon className="w-9 h-9 text-accent" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Stage label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={stageIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="font-sans text-lg text-ink mb-6"
        >
          {currentStage.label}
        </motion.p>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="w-48 h-1 rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-accent"
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.05, ease: "linear" }}
        />
      </div>

      {/* Stage dots */}
      <div className="flex gap-2 mt-8">
        {STAGES.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i < stageIndex
                ? "bg-accent"
                : i === stageIndex
                  ? "bg-accent/60 scale-125"
                  : "bg-border"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
