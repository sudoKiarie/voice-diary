import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
}

/**
 * Circular bar visualizer that renders frequency data as radial bars
 * around a ring, pulsing in real-time with the audio input.
 */
export function AudioVisualizer({ analyser, isRecording }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!analyser || !isRecording) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const barCount = 64; // number of radial bars
    const step = Math.floor(bufferLength / barCount);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      const { width, height } = canvas;
      const centerX = width / 2;
      const centerY = height / 2;
      const innerRadius = width * 0.38; // inner ring
      const maxBarHeight = width * 0.12;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] / 255; // 0..1
        const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
        const barHeight = value * maxBarHeight + 2; // min 2px visible

        const x1 = centerX + Math.cos(angle) * innerRadius;
        const y1 = centerY + Math.sin(angle) * innerRadius;
        const x2 = centerX + Math.cos(angle) * (innerRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (innerRadius + barHeight);

        // Warm amber gradient
        const intensity = Math.floor(180 + value * 75);
        ctx.strokeStyle = `rgb(${intensity + 40}, ${Math.floor(intensity * 0.7)}, ${Math.floor(intensity * 0.3)})`;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, isRecording]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
