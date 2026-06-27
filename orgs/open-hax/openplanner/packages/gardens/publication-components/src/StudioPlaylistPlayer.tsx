import { useCallback, useEffect, useRef, useState } from "react";
import { MusicPlayerView, type StudioTrack } from "./MusicPlayerView.js";
import { PlaylistQueueList } from "./PlaylistQueueList.js";
import { AudioSpectrumVisualizer, PlaybackProgress } from "./AudioPlaybackWidgets.js";

type PlayerState = "idle" | "loading" | "playing" | "paused";

type StudioPlaylistPlayerProps = {
  title?: string;
  description?: string;
  tracks: StudioTrack[];
  getAudioUrl?: (path: string) => string;
  maxVisible?: number;
  showLabels?: boolean;
  showDescription?: boolean;
  showDuration?: boolean;
};

function getAudioContextConstructor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

export function StudioPlaylistPlayer({
  title,
  description,
  tracks,
  getAudioUrl,
  maxVisible = Number.POSITIVE_INFINITY,
  showLabels = true,
  showDescription = true,
  showDuration = true,
}: StudioPlaylistPlayerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  const selectedTrack = tracks[Math.min(selectedIndex, Math.max(0, tracks.length - 1))] ?? null;

  const setupAudioContext = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || sourceRef.current) return;
    const AudioContextCtor = getAudioContextConstructor();
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    const source = context.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(context.destination);
    audioContextRef.current = context;
    analyserRef.current = analyser;
    sourceRef.current = source;
  }, []);

  const playIndex = useCallback((index: number) => {
    const track = tracks[index];
    const audio = audioRef.current;
    if (!track || !audio || !getAudioUrl) return;

    setupAudioContext();
    const context = audioContextRef.current;
    if (context?.state === "suspended") void context.resume();

    const nextSrc = getAudioUrl(track.path);
    if (audio.getAttribute("src") !== nextSrc) {
      audio.src = nextSrc;
      audio.load();
    }

    setSelectedIndex(index);
    setDuration(track.duration ?? 0);
    setPlayerState("loading");
    void audio.play()
      .then(() => setPlayerState("playing"))
      .catch(() => setPlayerState("paused"));
  }, [getAudioUrl, setupAudioContext, tracks]);

  const playNext = useCallback(() => {
    if (tracks.length === 0) return;
    playIndex((selectedIndexRef.current + 1) % tracks.length);
  }, [playIndex, tracks.length]);

  const playPrevious = useCallback(() => {
    if (tracks.length === 0) return;
    playIndex(selectedIndexRef.current <= 0 ? tracks.length - 1 : selectedIndexRef.current - 1);
  }, [playIndex, tracks.length]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !selectedTrack) return;

    if (playerState === "playing") {
      audio.pause();
      setPlayerState("paused");
      return;
    }

    playIndex(selectedIndexRef.current);
  }, [playIndex, playerState, selectedTrack]);

  const handleSelect = useCallback((_track: StudioTrack, index: number) => {
    playIndex(index);
  }, [playIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : selectedTrack?.duration ?? 0);
    const onEnded = () => playNext();
    const onVolumeChange = () => setVolume(audio.volume);
    const onPause = () => setPlayerState((state) => state === "playing" ? "paused" : state);
    const onPlay = () => setPlayerState("playing");

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("volumechange", onVolumeChange);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("volumechange", onVolumeChange);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
    };
  }, [playNext, selectedTrack?.duration]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => () => {
    audioRef.current?.pause();
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    void audioContextRef.current?.close();
  }, []);

  return (
    <div data-testid="studio-playlist-player" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <audio ref={audioRef} preload="auto" crossOrigin="anonymous" src={selectedTrack && getAudioUrl ? getAudioUrl(selectedTrack.path) : undefined} />
      <MusicPlayerView
        title={title}
        description={description}
        track={selectedTrack}
        trackCount={tracks.length}
        playerState={playerState}
        playingFrom="playlist"
        permissions={{
          canGoPrevious: tracks.length > 1,
          canPlayPause: Boolean(selectedTrack && getAudioUrl),
          canGoNext: tracks.length > 1,
          canAdjustVolume: true,
        }}
        volume={volume}
        onPrevious={playPrevious}
        onTogglePlayPause={togglePlayPause}
        onNext={playNext}
        onVolumeChange={setVolume}
        waveform={<AudioSpectrumVisualizer analyserRef={analyserRef} isPlaying={playerState === "playing"} />}
        progress={<PlaybackProgress audioRef={audioRef} duration={duration || selectedTrack?.duration || 0} />}
        heardDescription={showDescription && selectedTrack?.description ? <p className="publication-blocks__track-description">{selectedTrack.description}</p> : null}
        currentLabels={showLabels && selectedTrack?.labels && selectedTrack.labels.length > 0 ? (
          <div className="publication-blocks__labels">
            {selectedTrack.labels.map((label) => <span key={label}>{label}</span>)}
          </div>
        ) : null}
      />
      <PlaylistQueueList
        items={tracks}
        selectedIndex={selectedIndex}
        readOnly
        showLabels={showLabels}
        showDuration={showDuration}
        maxVisible={maxVisible}
        onSelect={handleSelect}
      />
    </div>
  );
}
