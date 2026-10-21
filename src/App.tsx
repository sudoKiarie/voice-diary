import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "sonner";

import {
  loadEntries,
  addEntry,
  deleteEntry,
  type DiaryEntry,
} from "./lib/storage";
import {
  inferMood,
  inferTopics,
  inferTitle,
  inferPeople,
  inferActionItems,
  inferKeyIdeas,
} from "./lib/inference";

import Greeting from "./components/Greeting";
import RecordingOrb from "./components/RecordingOrb";
import AIThinkingOverlay from "./components/AIThinkingOverlay";
import SummaryCard from "./components/SummaryCard";
import JournalCard from "./components/JournalCard";
import SearchBar from "./components/SearchBar";
import DailyReflection from "./components/DailyReflection";

const SUPABASE_URL = "https://isowiqscdkzlorkoqfur.supabase.co";
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/transcribe`;

const MAX_POLLS = 40;
const POLL_INTERVAL_MS = 5000;

/* ── Milestone helpers ── */
const MILESTONE_KEY = "voice-diary-milestones";

function getMilestones(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(MILESTONE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setMilestoneReached(key: string) {
  const m = getMilestones();
  m[key] = true;
  localStorage.setItem(MILESTONE_KEY, JSON.stringify(m));
}

function checkMilestones(entries: DiaryEntry[], justAdded: boolean) {
  const m = getMilestones();
  if (justAdded && !m["first-entry"] && entries.length === 1) {
    setMilestoneReached("first-entry");
    toast.success("🎉 Your first memory — welcome to your story.", {
      duration: 4000,
    });
  }
  if (!m["count-7"] && entries.length >= 7) {
    setMilestoneReached("count-7");
    toast.success("🌱 7 memories! Your story keeps growing.", {
      duration: 4000,
    });
  }
  if (!m["count-50"] && entries.length >= 50) {
    setMilestoneReached("count-50");
    toast.success("🌟 50 memories — incredible dedication.", {
      duration: 4000,
    });
  }
  if (!m["count-100"] && entries.length >= 100) {
    setMilestoneReached("count-100");
    toast.success("💯 100 memories! Your second brain is thriving.", {
      duration: 4000,
    });
  }
}

/* ── Delight toasts ── */
const DELIGHT_MESSAGES = [
  "🧠 I'll remember this.",
  "💭 Another thought preserved.",
  "✨ Memory saved.",
  "🌱 Your story keeps growing.",
];

export default function App() {
  const [entries, setEntries] = useState<DiaryEntry[]>(() => loadEntries());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(
    null
  );
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval>>();
  const [isProcessing, setIsProcessing] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, []);

  /* ── Start Recording ── */
  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setRecordingStream(stream);

      // Determine supported MIME type
      const mime =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : MediaRecorder.isTypeSupported("audio/mp4")
              ? "audio/mp4"
              : "";

      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Cleanup stream
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setRecordingStream(null);

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        if (blob.size === 0) {
          toast.error("Recording was empty — try again.");
          setIsRecording(false);
          return;
        }

        setIsRecording(false);
        setIsProcessing(true);

        // Save duration before starting processing
        const dur = recordingDuration;

        try {
          const transcript = await transcribeAudio(blob);

          // Infer metadata
          const mood = inferMood(transcript);
          const topics = inferTopics(transcript);
          const title = inferTitle(transcript);
          const people = inferPeople(transcript);
          const actionItems = inferActionItems(transcript);
          const keyIdeas = inferKeyIdeas(transcript);

          const summary =
            keyIdeas.length > 0
              ? keyIdeas[0]
              : transcript.length > 150
                ? transcript.slice(0, 147) + "..."
                : transcript;

          const updated = addEntry(transcript, {
            mood,
            topics,
            duration: dur,
            title,
            summary,
            people,
            actionItems,
            keyIdeas,
          });

          setEntries([...updated]);

          // Show delight toast
          const msg =
            DELIGHT_MESSAGES[Math.floor(Math.random() * DELIGHT_MESSAGES.length)];
          toast.success(msg, { duration: 2500 });

          // Check milestones
          checkMilestones(updated, true);
        } catch (err: any) {
          toast.error(
            err?.message || "Couldn't transcribe that — please try again."
          );
        } finally {
          setIsProcessing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      durationTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      toast.error("Couldn't access microphone — check your permissions.");
    }
  }, [recordingDuration]);

  /* ── Stop Recording ── */
  const handleStopRecording = useCallback(() => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  /* ── Transcription ── */
  async function transcribeAudio(blob: Blob): Promise<string> {
    // Try WAV conversion first (Speechmatics batch API prefers WAV)
    let audioBlob = blob;
    try {
      const wav = await blobToWav(blob);
      if (wav) audioBlob = wav;
    } catch {
      // fall through to original
    }

    const base64 = await blobToBase64(audioBlob);

    // Submit transcription job
    const submitRes = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audio: base64,
        mime_type: audioBlob.type,
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      throw new Error(
        `Transcription submission failed: ${submitRes.status} — ${errText}`
      );
    }

    const submitData = await submitRes.json();
    const jobId = submitData.jobId;
    if (!jobId) throw new Error("Failed to get transcription job ID.");

    // Poll for results
    let completed = false;
    let transcript = "";

    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

      const pollRes = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      if (!pollRes.ok) {
        const errText = await pollRes.text();
        throw new Error(`Poll error: ${pollRes.status} — ${errText}`);
      }

      const pollData = await pollRes.json();
      const jobStatus = pollData.status ?? "running";

      if (jobStatus === "done") {
        completed = true;
        transcript = pollData.transcript?.trim() ?? "";
        break;
      }

      if (jobStatus === "rejected" || jobStatus === "deleted") {
        throw new Error(`Transcription job was ${jobStatus}.`);
      }
    }

    if (!completed) {
      throw new Error("Transcription timed out — please try again.");
    }

    return transcript || "No speech was detected.";
  }

  /* ── Filtered entries (search) ── */
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;

    const q = searchQuery.toLowerCase();
    return entries.filter((e) => {
      const text = (
        e.text +
        " " +
        (e.title || "") +
        " " +
        (e.summary || "")
      ).toLowerCase();
      const topics = (e.topics || []).join(" ").toLowerCase();
      const people = (e.people || []).join(" ").toLowerCase();
      return text.includes(q) || topics.includes(q) || people.includes(q);
    });
  }, [entries, searchQuery]);

  /* ── Delete ── */
  const handleDelete = useCallback((id: string) => {
    const updated = deleteEntry(id);
    setEntries([...updated]);
    toast.success("Entry removed.", { duration: 2000 });
  }, []);

  return (
    <div className="min-h-dvh bg-paper bg-dot-grid">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.18 0.02 85)",
            color: "oklch(0.95 0.02 85)",
            border: "none",
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            borderRadius: "12px",
          },
          duration: 3000,
        }}
      />

      <div className="max-w-lg mx-auto px-4 pb-24 pt-6 relative">
        {/* Recording overlay */}
        <AnimatePresence>
          {isRecording && recordingStream && (
            <RecordingOrb
              stream={recordingStream}
              duration={recordingDuration}
              onStop={handleStopRecording}
            />
          )}
        </AnimatePresence>

        {/* Processing overlay */}
        <AnimatePresence>
          {isProcessing && (
            <AIThinkingOverlay onComplete={() => {}} />
          )}
        </AnimatePresence>

        {/* Main content */}
        {entries.length === 0 && !isRecording && !isProcessing ? (
          <Greeting onStartRecording={handleStartRecording} />
        ) : (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-6"
            >
              <h1 className="journal-heading text-2xl text-ink">
                Your story
              </h1>

              {/* Record button (always accessible) */}
              {!isRecording && !isProcessing && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartRecording}
                  className="record-btn rounded-full w-11 h-11 flex items-center justify-center shadow-md cursor-pointer"
                  aria-label="Record a thought"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                </motion.button>
              )}
            </motion.div>

            {/* Search */}
            <div className="mb-6">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>

            {/* Daily Reflection */}
            {entries.length > 0 && !searchQuery && (
              <DailyReflection entries={entries} />
            )}

            {/* Entry count */}
            {!searchQuery && (
              <p className="font-sans text-xs text-ink-muted/60 mb-3 uppercase tracking-wider">
                {entries.length}{" "}
                {entries.length === 1 ? "entry" : "entries"}
              </p>
            )}

            {/* Entries list */}
            <AnimatePresence mode="popLayout">
              {filteredEntries.length === 0 && searchQuery && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-sans text-sm text-ink-muted text-center mt-16"
                >
                  No memories match that search.
                </motion.p>
              )}
              {filteredEntries.map((entry, i) => (
                <div key={entry.id} className="mb-3 relative group">
                  <JournalCard
                    entry={entry}
                    index={i}
                    onClick={() => setSelectedEntry(entry)}
                  />
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entry.id);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-border/80 text-ink-muted hover:text-destructive text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label={`Delete entry ${entry.title}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </AnimatePresence>
          </>
        )}

        {/* Summary Card Modal */}
        <AnimatePresence>
          {selectedEntry && (
            <SummaryCard
              entry={selectedEntry}
              onClose={() => setSelectedEntry(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function blobToWav(blob: Blob): Promise<Blob | null> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const ctx = new AudioContext();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    const wavBuffer = encodeWav(audioBuffer, numChannels, sampleRate);
    ctx.close();
    return new Blob([wavBuffer], { type: "audio/wav" });
  } catch {
    console.warn("WAV conversion failed — sending original format");
    return null;
  }
}

function encodeWav(
  audioBuffer: AudioBuffer,
  numChannels: number,
  sampleRate: number
): ArrayBuffer {
  const length = audioBuffer.length;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = length * numChannels * (bitsPerSample / 8);
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Write samples
  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(audioBuffer.getChannelData(ch));
  }
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      const val = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, val, true);
      offset += 2;
    }
  }

  return buffer;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
