"use client";

import { useEffect, useRef, useState } from "react";

const TRACK_SRC = "/music/theme.wav";
const DEFAULT_VOLUME = 0.5;

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(true);     // ← Hier auf true setzen
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const audio = new Audio(TRACK_SRC);
    audio.loop = true;
    audio.volume = DEFAULT_VOLUME;
    audioRef.current = audio;

    // Automatisch abspielen versuchen
    const tryPlay = () => {
      audio.play()
        .then(() => {
          setPlaying(true);
        })
        .catch(() => {
          // Browser blockt Autoplay → warten auf User-Interaktion
          setPlaying(false);
        });
    };

    tryPlay();

    // Fallback: Bei Klick auf Seite starten (falls Autoplay blockiert wurde)
    const handleFirstInteraction = () => {
      if (!playing && audioRef.current) {
        audioRef.current.play().catch(() => {});
        setPlaying(true);
        setHasInteracted(true);
      }
    };

    document.addEventListener("click", handleFirstInteraction, { once: true });

    return () => {
      audio.pause();
      document.removeEventListener("click", handleFirstInteraction);
      audioRef.current = null;
    };
  }, []);

  // Volume ändern
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <div className="music-player">
      <button
        className="music-player-toggle"
        onClick={toggle}
        aria-label={playing ? "Musik pausieren" : "Musik abspielen"}
      >
        {playing ? "⏸" : "▶"}
      </button>
      <span className="music-player-label">LAUTSTÄRKE</span>
      <input
        className="music-player-volume"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        aria-label="Lautstärke"
      />
    </div>
  );
}