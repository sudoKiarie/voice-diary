import { useEffect, useRef } from "react";

interface LiveTranscriptionProps {
  partialTranscript: string;
  finalTranscripts: string[];
}

/**
 * Renders live transcription — finalized text in normal weight,
 * interim/partial text in italic/faded style. Auto-scrolls as new text arrives.
 */
export function LiveTranscription({
  partialTranscript,
  finalTranscripts,
}: LiveTranscriptionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [partialTranscript, finalTranscripts]);

  const hasContent = finalTranscripts.length > 0 || partialTranscript.length > 0;

  return (
    <div
      ref={scrollRef}
      aria-live="polite"
      aria-atomic="false"
      className="w-full max-w-md mx-auto mt-6 p-5 rounded-xl bg-paper border border-border max-h-48 overflow-y-auto text-left"
    >
      {!hasContent && (
        <p className="text-muted text-sm italic text-center">
          Your words will appear here as you speak…
        </p>
      )}
      {finalTranscripts.map((segment, i) => (
        <span key={i} className="text-primary/90 text-sm leading-relaxed">
          {segment}{" "}
        </span>
      ))}
      {partialTranscript.length > 0 && (
        <span className="text-muted italic text-sm leading-relaxed">
          {partialTranscript}
        </span>
      )}
    </div>
  );
}
