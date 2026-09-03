import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, MicOff, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { AudioVisualizer } from "./AudioVisualizer";
import { LiveTranscription } from "./LiveTranscription";

type OrbState =
  | "idle"
  | "requesting-permission"
  | "recording"
  | "processing"
  | "error";

interface RecordingOrbProps {
  onTranscriptionComplete: (transcript: string) => void;
}

// Speechmatics v2 WebSocket messages
interface SMTranscriptMessage {
  message: "AddTranscript" | "AddPartialTranscript";
  metadata: {
    start_time: number;
    end_time: number;
    transcript: string;
  };
}

export function RecordingOrb({ onTranscriptionComplete }: RecordingOrbProps) {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalTranscripts, setFinalTranscripts] = useState<string[]>([]);
  const [isVisualizerReady, setIsVisualizerReady] = useState(false);

  const orbStateRef = useRef<OrbState>("idle");
  // Keep ref in sync so WebSocket callbacks never read a stale state
  useEffect(() => {
    orbStateRef.current = orbState;
  }, [orbState]);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptedRef = useRef(false);
  // Ref to avoid stale closure in stopRecording — always holds latest transcripts
  const finalTranscriptsRef = useRef<string[]>([]);

  // ─── cleanup ────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    // Close WebSocket
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsVisualizerReady(false);
  }, []);

  // ─── start recording ───────────────────────────────────────
  const startRecording = useCallback(async () => {
    setOrbState("requesting-permission");
    setErrorMessage("");
    setPartialTranscript("");
    setFinalTranscripts([]);
    reconnectAttemptedRef.current = false;

    try {
      // 1. Get microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Create AudioContext at 16kHz
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // 3. Analyser for visualizer
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);
      setIsVisualizerReady(true);

      // 4. Fetch JWT from Edge Function
      const { data, error } = await supabase.functions.invoke(
        "speechmatics-token"
      );
      if (error || !data?.token) {
        throw new Error("Failed to get transcription token. Please try again.");
      }

      const token = data.token;

      // 5. Open WebSocket
      const ws = new WebSocket(
        `wss://eu.rt.speechmatics.com/v2?jwt=${token}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        // Send StartRecognition
        ws.send(
          JSON.stringify({
            message: "StartRecognition",
            audio_format: {
              type: "raw",
              encoding: "pcm_s16le",
              sample_rate: 16000,
            },
            transcription_config: {
              language: "en",
              max_delay: 2,
              enable_partials: true,
            },
          })
        );

        // Start streaming PCM data
        const bufferSize = 4096;
        const processor = audioContext.createScriptProcessor(
          bufferSize,
          1,
          1
        );

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);
          // Convert Float32 to Int16 (PCM_S16LE)
          const int16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          ws.send(int16.buffer);
        };
      };

      ws.onmessage = (event) => {
        try {
          const msg: SMTranscriptMessage = JSON.parse(event.data);
          if (msg.message === "AddPartialTranscript") {
            setPartialTranscript(msg.metadata.transcript);
          } else if (msg.message === "AddTranscript") {
            setFinalTranscripts((prev) => {
              const next = [...prev, msg.metadata.transcript];
              finalTranscriptsRef.current = next;
              return next;
            });
            setPartialTranscript("");
          }
        } catch {
          // Ignore non-JSON or unexpected messages
        }
      };

      ws.onclose = () => {
        // If recording and first disconnect, attempt one reconnect
        if (
          orbStateRef.current === "recording" &&
          !reconnectAttemptedRef.current &&
          streamRef.current
        ) {
          reconnectAttemptedRef.current = true;
          setTimeout(() => {
            if (streamRef.current) {
              startRecording();
            }
          }, 1000);
        }
      };

      ws.onerror = () => {
        // Errors trigger onclose, handled above
      };

      setOrbState("recording");
    } catch (err) {
      const msg =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
          ? "Microphone access needed — enable it in your browser settings"
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.";

      setErrorMessage(msg);
      setOrbState("error");
      cleanup();
    }
  }, [cleanup]);

  // ─── stop recording ────────────────────────────────────────
  const stopRecording = useCallback(async () => {
    setOrbState("processing");

    const ws = wsRef.current;

    // Send EndOfStream and close
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ message: "EndOfStream" }));
    }

    // Give a brief moment for final transcripts to arrive
    await new Promise((r) => setTimeout(r, 800));

    // Build final transcript from finalized segments (ref avoids stale closure)
    const transcript = finalTranscriptsRef.current.join(" ").trim();

    // Cleanup audio + WebSocket
    cleanup();

    // Handle empty transcript
    if (!transcript) {
      setErrorMessage("I didn't catch that — try again?");
      setOrbState("error");
      return;
    }

    setOrbState("idle");
    onTranscriptionComplete(transcript);
  }, [cleanup, onTranscriptionComplete]);

  // ─── handle tap ────────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (orbState === "idle" || orbState === "error") {
      startRecording();
    } else if (orbState === "recording") {
      stopRecording();
    }
    // requesting-permission and processing are non-interactive
  }, [orbState, startRecording, stopRecording]);

  // ─── pulsing ring animation variants for recording ─────────
  const ringVariants = {
    idle: { scale: 1, opacity: 0 },
    recording: (delay: number) => ({
      scale: [1, 1.25, 1],
      opacity: [0.35, 0, 0.35],
      transition: {
        scale: { duration: 2, repeat: Infinity, delay: delay * 0.6 },
        opacity: { duration: 2, repeat: Infinity, delay: delay * 0.6 },
      },
    }),
  };

  const isInteractive =
    orbState === "idle" || orbState === "recording" || orbState === "error";

  return (
    <div className="flex flex-col items-center">
      {/* ── Orb container ──────────────────────────────────── */}
      <div className="relative flex items-center justify-center">
        {/* Concentric pulsing rings (recording only) */}
        {orbState === "recording" && [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            custom={i}
            variants={ringVariants}
            initial="idle"
            animate="recording"
            className="absolute rounded-full border border-accent/30"
            style={{ width: 120, height: 120 }}
          />
        ))}

        {/* Audio visualizer canvas overlay */}
        {orbState === "recording" && isVisualizerReady && (
          <AudioVisualizer
            analyser={analyserRef.current}
            isRecording={orbState === "recording"}
          />
        )}

        {/* Main orb button */}
        <motion.button
          onClick={handleTap}
          disabled={!isInteractive}
          aria-label={
            orbState === "recording"
              ? "Stop recording"
              : orbState === "processing"
                ? "Processing"
                : "Start recording"
          }
          aria-pressed={orbState === "recording"}
          className={`
            relative z-10 flex items-center justify-center
            w-[120px] h-[120px] rounded-full
            transition-colors duration-300 ease-out
            focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent
            ${
              orbState === "recording"
                ? "bg-accent text-white shadow-lg shadow-accent/30"
                : orbState === "processing"
                  ? "bg-accent-light text-accent cursor-wait"
                  : orbState === "error"
                    ? "bg-red-100 text-red-500"
                    : "bg-paper-dark text-accent shadow-md hover:shadow-lg hover:bg-accent/10"
            }
          `}
          animate={
            orbState === "idle"
              ? { scale: [1, 1.03, 1] }
              : orbState === "recording"
                ? { scale: 1.08 }
                : { scale: 1 }
          }
          transition={
            orbState === "idle"
              ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.3, ease: "easeOut" }
          }
          whileTap={isInteractive ? { scale: 0.97 } : undefined}
        >
          <AnimatePresence mode="wait">
            {orbState === "recording" ? (
              <motion.div
                key="stop"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <Square
                  size={40}
                  className="fill-current"
                  aria-hidden="true"
                />
              </motion.div>
            ) : orbState === "processing" ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                transition={{ rotate: { duration: 1.5, repeat: Infinity, ease: "linear" } }}
              >
                <Loader2 size={40} aria-hidden="true" />
              </motion.div>
            ) : orbState === "error" ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <MicOff size={40} aria-hidden="true" />
              </motion.div>
            ) : (
              <motion.div
                key="mic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Mic size={40} aria-hidden="true" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Label ──────────────────────────────────────────── */}
      <p className="mt-5 text-sm font-medium text-text-muted" aria-live="polite">
        {orbState === "idle" && "Tap to record"}
        {orbState === "requesting-permission" && "Accessing microphone…"}
        {orbState === "recording" && (
          <span className="inline-flex items-center gap-1.5 text-accent">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            Recording…
          </span>
        )}
        {orbState === "processing" && "Processing…"}
        {orbState === "error" && (
          <span className="text-red-500">{errorMessage}</span>
        )}
      </p>

      {/* ── Live transcription ─────────────────────────────── */}
      {(orbState === "recording" || orbState === "processing") && (
        <LiveTranscription
          partialTranscript={partialTranscript}
          finalTranscripts={finalTranscripts}
        />
      )}
    </div>
  );
}
