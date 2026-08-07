import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Square, Mic } from "lucide-react";

const RECORDING_PROMPTS = [
  "What happened today?",
  "What are you grateful for?",
  "Any new ideas?",
  "What challenged you?",
  "What do you want future you to remember?",
  "How are you feeling right now?",
  "What made you smile?",
  "What's one thing you learned?",
];

interface RecordingOrbProps {
  stream: MediaStream | null;
  duration: number;
  onStop: () => void;
}

export default function RecordingOrb({
  stream,
  duration,
  onStop,
}: RecordingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const promptIntervalRef = useRef<ReturnType<typeof setInterval>>();

  // Cycle prompts every 5 seconds
  useEffect(() => {
    promptIntervalRef.current = setInterval(() => {
      setPromptIndex((i) => (i + 1) % RECORDING_PROMPTS.length);
    }, 5000);
    return () => clearInterval(promptIntervalRef.current);
  }, []);

  // Set up audio analyser for waveform
  useEffect(() => {
    if (!stream) return;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    analyserRef.current = analyser;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const draw = () => {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const barWidth = (w / bufferLength) * 2.5;
      const barGap = 2;

      ctx2d.fillStyle = "oklch(0.55 0.22 28 / 0.3)";
      ctx2d.strokeStyle = "oklch(0.55 0.22 28)";
      ctx2d.lineWidth = 1.5;

      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i] / 255;
        const barHeight = Math.max(2, value * h * 0.8);
        const x = i * (barWidth + barGap) + w * 0.1;
        const y = (h - barHeight) / 2;

        ctx2d.beginPath();
        ctx2d.roundRect(x, y, barWidth, barHeight, 3);
        ctx2d.fill();
        ctx2d.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ctx.close();
    };
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const formatTime = useCallback((sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper/80 backdrop-blur-md"
    >
      {/* Pulsing background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            "radial-gradient(ellipse at 50% 40%, oklch(0.55 0.22 28 / 0.08) 0%, transparent 60%)",
            "radial-gradient(ellipse at 50% 40%, oklch(0.55 0.22 28 / 0.15) 0%, transparent 60%)",
            "radial-gradient(ellipse at 50% 40%, oklch(0.55 0.22 28 / 0.08) 0%, transparent 60%)",
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Recording orb */}
      <motion.div className="relative mb-8">
        {/* Outer glow rings */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              "0 0 40px 10px oklch(0.55 0.22 28 / 0.2)",
              "0 0 60px 20px oklch(0.55 0.22 28 / 0.35)",
              "0 0 40px 10px oklch(0.55 0.22 28 / 0.2)",
            ],
            scale: [1, 1.06, 1],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 160, height: 160, left: -20, top: -20 }}
        />
        {/* Filled orb */}
        <div
          className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center"
          style={{
            background:
              "radial-gradient(circle at 40% 35%, oklch(0.7 0.2 25), oklch(0.5 0.22 28) 60%, oklch(0.4 0.2 30))",
          }}
        >
          <Mic className="w-10 h-10 text-white/90" />
        </div>
      </motion.div>

      {/* Rotating prompt */}
      <div className="h-12 mb-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={promptIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="journal-heading text-xl text-ink-muted italic text-center px-4"
            style={{ fontStyle: "italic" }}
          >
            {RECORDING_PROMPTS[promptIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Waveform */}
      <canvas
        ref={canvasRef}
        width={260}
        height={60}
        className="mb-6 w-[260px] h-[60px]"
        aria-hidden="true"
      />

      {/* Duration */}
      <p className="font-sans text-sm text-ink-muted tabular-nums mb-10">
        {formatTime(duration)}
      </p>

      {/* Stop button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStop}
        className="flex items-center gap-2 rounded-full bg-ink text-paper px-8 py-3 font-sans text-sm font-medium shadow-lg cursor-pointer"
        aria-label="Stop recording"
      >
        <Square className="w-4 h-4 fill-current" />
        Stop recording
      </motion.button>
    </motion.div>
  );
}
