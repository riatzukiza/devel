import { useCallback, useEffect, useRef, useState } from "react";
import { tokens } from "@open-hax/uxx";
import AudioMotionAnalyzer from "audiomotion-analyzer";

type AudioMotionAnalyzerInstance = {
  destroy: () => void;
};

function formatDuration(seconds: number | undefined): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function AudioSpectrumVisualizer({ analyserRef, isPlaying }: { analyserRef: React.RefObject<AnalyserNode | null>; isPlaying: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioMotionRef = useRef<AudioMotionAnalyzerInstance | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const analyser = analyserRef.current;
    if (!container || !analyser || !isPlaying || audioMotionRef.current) return;

    audioMotionRef.current = new AudioMotionAnalyzer(container, {
      source: analyser,
      width: container.clientWidth,
      height: 50,
      mode: 2,
      gradient: "classic",
      showScaleX: false,
      showScaleY: false,
      smoothing: 0.7,
    });

    return () => {
      audioMotionRef.current?.destroy();
      audioMotionRef.current = null;
    };
  }, [analyserRef, isPlaying]);

  useEffect(() => {
    if (isPlaying) return;
    audioMotionRef.current?.destroy();
    audioMotionRef.current = null;
  }, [isPlaying]);

  useEffect(() => () => {
    audioMotionRef.current?.destroy();
    audioMotionRef.current = null;
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="studio-audio-visualizer"
      style={{ width: "100%", height: 50, borderRadius: 8, overflow: "hidden", background: "rgba(0,0,0,0.2)" }}
    />
  );
}

export function PlaybackProgress({
  audioRef,
  duration,
  initialTime = 0,
  onPersistTime,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  duration: number;
  initialTime?: number;
  onPersistTime?: (time: number) => void;
}) {
  const [currentTime, setCurrentTime] = useState(initialTime);

  useEffect(() => {
    setCurrentTime(initialTime);
  }, [initialTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let lastUiUpdate = 0;
    const syncCurrentTime = () => {
      const nextTime = audio.currentTime;
      onPersistTime?.(nextTime);

      const now = performance.now();
      if (now - lastUiUpdate < 100) return;
      lastUiUpdate = now;

      setCurrentTime((previous) => (Math.abs(previous - nextTime) < 0.05 ? previous : nextTime));
    };

    audio.addEventListener("timeupdate", syncCurrentTime);
    audio.addEventListener("seeking", syncCurrentTime);
    audio.addEventListener("seeked", syncCurrentTime);

    return () => {
      audio.removeEventListener("timeupdate", syncCurrentTime);
      audio.removeEventListener("seeking", syncCurrentTime);
      audio.removeEventListener("seeked", syncCurrentTime);
    };
  }, [audioRef, onPersistTime]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
    onPersistTime?.(time);
  }, [audioRef, onPersistTime]);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
      <input
        aria-label="Playback position"
        type="range"
        min={0}
        max={duration || 0}
        value={currentTime}
        onChange={handleSeek}
        style={{ width: "100%", accentColor: "var(--token-colors-accent-blue)" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: tokens.fontSize.xs, color: "var(--token-colors-text-muted)" }}>
        <span>{formatDuration(currentTime)}</span>
        <span>{formatDuration(duration)}</span>
      </div>
    </div>
  );
}
