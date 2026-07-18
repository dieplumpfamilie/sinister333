"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Alle Grafiken und Sounds werden aus /public/flappy/ geladen.
 * Ersetze einfach die Dateien mit gleichem Namen, um das Spiel
 * umzuskinnen — kein Code nötig:
 *   background.svg   Hintergrund
 *   tower.svg         Turm/Hindernis (wird oben gespiegelt)
 *   character.svg     Spielfigur
 *   jump.wav          Sound beim Flügelschlag
 *   hit.wav           Sound bei Kollision
 *   music.wav         Hintergrundmusik (läuft in einer Schleife)
 */
const ASSETS = {
  background: "/flappy/background.svg",
  tower: "/flappy/tower.svg",
  character: "/flappy/character.svg",
  jumpSound: "/flappy/jump.wav",
  hitSound: "/flappy/hit.wav",
  music: "/flappy/music.wav",
};

const WIDTH = 400;
const HEIGHT = 600;
const GRAVITY = 1400; // px/s^2
const FLAP_VELOCITY = -420; // px/s
const PIPE_WIDTH = 70;
const PIPE_GAP = 168;
const PIPE_SPACING = 240; // px between pipe pairs
const PIPE_SPEED = 150; // px/s
const CHAR_SIZE = 42;
const CHAR_X = 90;

type Pipe = { x: number; gapY: number; scored: boolean };
type Status = "ready" | "playing" | "over";

export default function FlappyGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number>(0);
  const lastTsRef = useRef<number>(0);

  const birdYRef = useRef(HEIGHT / 2);
  const velocityRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const statusRef = useRef<Status>("ready");

  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const towerImgRef = useRef<HTMLImageElement | null>(null);
  const charImgRef = useRef<HTMLImageElement | null>(null);
  const jumpAudioRef = useRef<HTMLAudioElement | null>(null);
  const hitAudioRef = useRef<HTMLAudioElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  const [status, setStatus] = useState<Status>("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // load assets once
  useEffect(() => {
    const bg = new Image();
    bg.src = ASSETS.background;
    bgImgRef.current = bg;

    const tower = new Image();
    tower.src = ASSETS.tower;
    towerImgRef.current = tower;

    const char = new Image();
    char.src = ASSETS.character;
    charImgRef.current = char;

    jumpAudioRef.current = new Audio(ASSETS.jumpSound);
    hitAudioRef.current = new Audio(ASSETS.hitSound);
    const music = new Audio(ASSETS.music);
    music.loop = true;
    music.volume = 0.35;
    musicAudioRef.current = music;

    return () => {
      musicAudioRef.current?.pause();
    };
  }, []);

  const play = useCallback(
    (ref: React.RefObject<HTMLAudioElement | null>) => {
      if (muted || !ref.current) return;
      ref.current.currentTime = 0;
      ref.current.play().catch(() => {});
    },
    [muted]
  );

  const spawnPipes = useCallback((startX: number) => {
    const pipes: Pipe[] = [];
    for (let x = startX; x < startX + PIPE_SPACING * 4; x += PIPE_SPACING) {
      pipes.push({
        x,
        gapY: 120 + Math.random() * (HEIGHT - 240 - PIPE_GAP),
        scored: false,
      });
    }
    return pipes;
  }, []);

  const resetGame = useCallback(() => {
    birdYRef.current = HEIGHT / 2;
    velocityRef.current = 0;
    pipesRef.current = spawnPipes(WIDTH + 100);
    setScore(0);
    setStatus("playing");
    if (!muted) {
      const m = musicAudioRef.current;
      if (m) {
        m.currentTime = 0;
        m.play().catch(() => {});
      }
    }
  }, [spawnPipes, muted]);

  const flap = useCallback(() => {
    if (statusRef.current === "ready" || statusRef.current === "over") {
      resetGame();
      return;
    }
    velocityRef.current = FLAP_VELOCITY;
    play(jumpAudioRef);
  }, [resetGame, play]);

  // input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [flap]);

  // main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const step = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.033);
      lastTsRef.current = ts;

      if (statusRef.current === "playing") {
        update(dt);
      }
      draw(ctx);
      frameRef.current = requestAnimationFrame(step);
    };

    const update = (dt: number) => {
      velocityRef.current += GRAVITY * dt;
      birdYRef.current += velocityRef.current * dt;

      pipesRef.current = pipesRef.current.map((p) => ({
        ...p,
        x: p.x - PIPE_SPEED * dt,
      }));

      // recycle pipes that left the screen
      const minX = Math.min(...pipesRef.current.map((p) => p.x));
      pipesRef.current.forEach((p) => {
        if (p.x < -PIPE_WIDTH) {
          const maxX = Math.max(...pipesRef.current.map((pp) => pp.x));
          p.x = maxX + PIPE_SPACING;
          p.gapY = 120 + Math.random() * (HEIGHT - 240 - PIPE_GAP);
          p.scored = false;
        }
      });
      void minX;

      // scoring
      pipesRef.current.forEach((p) => {
        if (!p.scored && p.x + PIPE_WIDTH < CHAR_X) {
          p.scored = true;
          setScore((s) => {
            const next = s + 1;
            setBest((b) => Math.max(b, next));
            return next;
          });
        }
      });

      // collisions: ground / ceiling
      const top = birdYRef.current - CHAR_SIZE / 2;
      const bottom = birdYRef.current + CHAR_SIZE / 2;
      let dead = false;
      if (bottom > HEIGHT - 4 || top < 0) dead = true;

      // collisions: pipes
      for (const p of pipesRef.current) {
        const withinX = CHAR_X + CHAR_SIZE / 2 > p.x && CHAR_X - CHAR_SIZE / 2 < p.x + PIPE_WIDTH;
        if (withinX) {
          const inGap = top > p.gapY && bottom < p.gapY + PIPE_GAP;
          if (!inGap) dead = true;
        }
      }

      if (dead) {
        statusRef.current = "over";
        setStatus("over");
        musicAudioRef.current?.pause();
        play(hitAudioRef);
      }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      const bg = bgImgRef.current;
      if (bg && bg.complete) {
        ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);
      } else {
        ctx.fillStyle = "#0a1a1e";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }

      const tower = towerImgRef.current;
      pipesRef.current.forEach((p) => {
        if (p.x > WIDTH || p.x + PIPE_WIDTH < 0) return;
        const gapTop = p.gapY;
        const gapBottom = p.gapY + PIPE_GAP;

        if (tower && tower.complete) {
          // bottom pipe
          ctx.drawImage(tower, p.x, gapBottom, PIPE_WIDTH, HEIGHT - gapBottom);
          // top pipe (flipped)
          ctx.save();
          ctx.translate(p.x, gapTop);
          ctx.scale(1, -1);
          ctx.drawImage(tower, 0, 0, PIPE_WIDTH, gapTop);
          ctx.restore();
        } else {
          ctx.fillStyle = "#1c2a10";
          ctx.fillRect(p.x, gapBottom, PIPE_WIDTH, HEIGHT - gapBottom);
          ctx.fillRect(p.x, 0, PIPE_WIDTH, gapTop);
        }
      });

      // character
      const char = charImgRef.current;
      const angle = Math.max(
        -0.5,
        Math.min(1.0, velocityRef.current / 600)
      );
      ctx.save();
      ctx.translate(CHAR_X, birdYRef.current);
      ctx.rotate(angle);
      if (char && char.complete) {
        ctx.drawImage(
          char,
          -CHAR_SIZE / 2,
          -CHAR_SIZE / 2,
          CHAR_SIZE,
          CHAR_SIZE
        );
      } else {
        ctx.fillStyle = "#9aa88f";
        ctx.beginPath();
        ctx.ellipse(0, 0, CHAR_SIZE / 2.4, CHAR_SIZE / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [play]);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      const music = musicAudioRef.current;
      if (music) {
        if (next) music.pause();
        else if (status === "playing") music.play().catch(() => {});
      }
      return next;
    });
  };

  return (
    <div className="monitor">
      <div className="monitor-bezel" onClick={flap}>
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          aria-label="Flappy Theo Spiel"
        />
        <div className="monitor-scanlines" />
        <div className="monitor-vignette" />

        {status !== "playing" && (
          <div className="monitor-overlay">
            {status === "ready" && (
              <>
                <h3>ÜBERWACHUNG BEREIT</h3>
                <p>
                  Leertaste, Pfeiltaste hoch oder Klick zum Flügelschlag.
                  Weiche den Sektor-Türmen aus.
                </p>
              </>
            )}
            {status === "over" && (
              <>
                <h3>THEO IST ABGESTÜRZT</h3>
                <p>
                  Punkte: {score} · Bestwert: {best}
                </p>
              </>
            )}
            <button
              className="btn-restart"
              onClick={(e) => {
                e.stopPropagation();
                resetGame();
              }}
            >
              {status === "ready" ? "SPIEL STARTEN" : "NOCHMAL VERSUCHEN"}
            </button>
          </div>
        )}
      </div>

      <div className="monitor-hud">
        <span>PUNKTE: {score}</span>
        <span>BESTWERT: {best}</span>
        <button
          className="btn-mute"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
        >
          {muted ? "🔇 TON AUS" : "🔊 TON AN"}
        </button>
      </div>
      <div className="monitor-controls-hint">
        LEERTASTE / PFEIL HOCH / KLICK ZUM FLIEGEN
      </div>
    </div>
  );
}
