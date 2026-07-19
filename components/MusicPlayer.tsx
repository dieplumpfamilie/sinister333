"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hintergrundmusik der Startseite.
 * Datei ersetzen, um den Titel zu ändern (gleicher Dateiname
 * oder Pfad unten anpassen):
 *   /public/music/theme.wav
 */
const TRACK_SRC = "/music/theme.wav";
const DEFAULT_VOLUME = 0.4;

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  useEffect(() => {
    const audio = new Audio(TRACK_SRC);
    audio.loop = true;
    audio.volume = DEFAULT_VOLUME;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
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
