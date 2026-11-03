"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Alle Grafiken und Sounds werden aus /public/shooter/ geladen.
 * Ersetze einfach die Dateien mit gleichem Namen, um das Spiel
 * umzuskinnen — kein Code nötig.
 *
 * Grafiken (alle Figuren/Geschosse müssen nach RECHTS schauen,
 * das Spiel dreht sie selbst in Blickrichtung):
 *   floor.svg        Boden-Kachel (wird nahtlos wiederholt)
 *   crate.svg        Kiste / Deckung (64x64)
 *   player.svg       Spielfigur
 *   enemy.svg        Standard-Gegner
 *   enemy_tank.svg   Schwerer Gegner (5 Treffer)
 *   bullet.svg       Geschoss
 *   medkit.svg       Heil-Item
 *
 * Sounds:
 *   shoot.wav        Schuss
 *   hit.wav          Gegner getroffen
 *   explosion.wav    Gegner stirbt
 *   hurt.wav         Spieler wird getroffen
 *   pickup.wav       Heil-Item eingesammelt
 *   gameover.wav     Game Over
 *   music.wav        Hintergrundmusik (läuft in einer Schleife)
 */
const ASSETS = {
  floor: "/shooter/floor.svg",
  crate: "/shooter/crate.svg",
  player: "/shooter/player.svg",
  enemy: "/shooter/enemy.svg",
  tank: "/shooter/enemy_tank.svg",
  bullet: "/shooter/bullet.svg",
  medkit: "/shooter/medkit.svg",
  shootSound: "/shooter/shoot.wav",
  hitSound: "/shooter/hit.wav",
  explosionSound: "/shooter/explosion.wav",
  hurtSound: "/shooter/hurt.wav",
  pickupSound: "/shooter/pickup.wav",
  gameOverSound: "/shooter/gameover.wav",
  music: "/shooter/music.wav",
};

type ImageKey = "floor" | "crate" | "player" | "enemy" | "tank" | "bullet" | "medkit";
type SoundKey = "shoot" | "hit" | "explosion" | "hurt" | "pickup" | "gameOver";

// ---- Balancing --------------------------------------------------------
const WIDTH = 800;
const HEIGHT = 600;

const PLAYER_R = 15;
const PLAYER_SIZE = 44;
const PLAYER_SPEED = 230; // px/s
const PLAYER_MAX_HP = 100;
const PLAYER_INVULN = 0.6; // s nach Treffer

const FIRE_COOLDOWN = 0.15; // s
const BULLET_SPEED = 640; // px/s
const BULLET_LIFE = 1.1; // s
const BULLET_SPREAD = 0.04; // rad

const GRUNT = { r: 14, size: 38, speed: 95, hp: 1, damage: 10, score: 1 };
const TANK = { r: 23, size: 60, speed: 58, hp: 5, damage: 22, score: 5 };

const MEDKIT_HEAL = 25;
const CRATE_SIZE = 64;
// Kisten-Positionen (obere linke Ecke). Mitte bleibt frei.
const CRATES: ReadonlyArray<readonly [number, number]> = [
  [150, 110], [214, 110], [150, 174],
  [586, 110], [522, 110], [586, 174],
  [150, 426], [214, 426], [150, 362],
  [586, 426], [522, 426], [586, 362],
];

// ---- Typen ------------------------------------------------------------
type Status = "ready" | "playing" | "paused" | "over";
type Bullet = { x: number; y: number; vx: number; vy: number; angle: number; life: number };
type Enemy = {
  x: number; y: number; r: number; size: number; speed: number; damage: number;
  hp: number; kind: "grunt" | "tank"; flash: number; angle: number;
};
type Pickup = { x: number; y: number; life: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number };
type Rect = { x: number; y: number; w: number; h: number };

type GameState = {
  px: number; py: number; aim: number;
  hp: number; invuln: number; fireCd: number; muzzle: number; shake: number;
  score: number; wave: number; toSpawn: number; spawnTimer: number; banner: number;
  bullets: Bullet[]; enemies: Enemy[]; pickups: Pickup[]; particles: Particle[];
};

const CRATE_RECTS: Rect[] = CRATES.map(([x, y]) => ({ x, y, w: CRATE_SIZE, h: CRATE_SIZE }));

function newState(): GameState {
  return {
    px: WIDTH / 2, py: HEIGHT / 2, aim: 0,
    hp: PLAYER_MAX_HP, invuln: 0, fireCd: 0, muzzle: 0, shake: 0,
    score: 0, wave: 0, toSpawn: 0, spawnTimer: 0, banner: 0,
    bullets: [], enemies: [], pickups: [], particles: [],
  };
}

/** Schiebt einen Kreis aus einem Rechteck heraus (verändert o.x / o.y). */
function pushOut(o: { x: number; y: number }, r: number, rect: Rect) {
  const cx = Math.max(rect.x, Math.min(o.x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(o.y, rect.y + rect.h));
  let dx = o.x - cx;
  let dy = o.y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return;
  if (d2 === 0) {
    // Mittelpunkt liegt im Rechteck: über die nächste Kante hinausschieben
    const left = o.x - rect.x;
    const right = rect.x + rect.w - o.x;
    const up = o.y - rect.y;
    const down = rect.y + rect.h - o.y;
    const m = Math.min(left, right, up, down);
    if (m === left) o.x = rect.x - r;
    else if (m === right) o.x = rect.x + rect.w + r;
    else if (m === up) o.y = rect.y - r;
    else o.y = rect.y + rect.h + r;
    return;
  }
  const d = Math.sqrt(d2);
  dx /= d;
  dy /= d;
  o.x = cx + dx * r;
  o.y = cy + dy * r;
}

export default function ShooterGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number>(0);
  const lastTsRef = useRef<number>(0);

  const gRef = useRef<GameState>(newState());
  const statusRef = useRef<Status>("ready");
  const mutedRef = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef({ x: WIDTH / 2 + 100, y: HEIGHT / 2 });
  const firingRef = useRef(false);

  const imgsRef = useRef<Partial<Record<ImageKey, HTMLImageElement>>>({});
  const floorPatternRef = useRef<CanvasPattern | null>(null);
  const soundsRef = useRef<Partial<Record<SoundKey, HTMLAudioElement>>>({});
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const [status, setStatus] = useState<Status>("ready");
  const [hp, setHp] = useState(PLAYER_MAX_HP);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(0);
  const [best, setBest] = useState(0);
  const [muted, setMuted] = useState(false);

  const changeStatus = useCallback((s: Status) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  // ---- Assets laden ----------------------------------------------------
  useEffect(() => {
    const keys: ImageKey[] = ["floor", "crate", "player", "enemy", "tank", "bullet", "medkit"];
    const imgs: Partial<Record<ImageKey, HTMLImageElement>> = {};
    keys.forEach((k) => {
      const img = new Image();
      img.src = ASSETS[k];
      imgs[k] = img;
    });
    imgsRef.current = imgs;

    soundsRef.current = {
      shoot: new Audio(ASSETS.shootSound),
      hit: new Audio(ASSETS.hitSound),
      explosion: new Audio(ASSETS.explosionSound),
      hurt: new Audio(ASSETS.hurtSound),
      pickup: new Audio(ASSETS.pickupSound),
      gameOver: new Audio(ASSETS.gameOverSound),
    };
    const music = new Audio(ASSETS.music);
    music.loop = true;
    music.volume = 0.3;
    musicRef.current = music;

    try {
      const saved = Number(localStorage.getItem("shooter-best") ?? 0);
      if (Number.isFinite(saved)) setBest(saved);
    } catch {
      /* localStorage nicht verfügbar */
    }

    return () => {
      music.pause();
    };
  }, []);

  const playSound = useCallback((key: SoundKey, volume = 0.6) => {
    if (mutedRef.current) return;
    const base = soundsRef.current[key];
    if (!base) return;
    // Klon, damit sich schnell aufeinanderfolgende Sounds überlagern können
    const a = base.cloneNode() as HTMLAudioElement;
    a.volume = volume;
    a.play().catch(() => {});
  }, []);

  // ---- Spielablauf -----------------------------------------------------
  const startWave = useCallback(() => {
    const g = gRef.current;
    g.wave += 1;
    g.toSpawn = 6 + g.wave * 3;
    g.spawnTimer = 0;
    g.banner = 2;
    setWave(g.wave);
    if (g.wave > 1) {
      // Belohnung: ein Heil-Item pro Welle an einer freien Stelle
      for (let i = 0; i < 20; i++) {
        const x = 60 + Math.random() * (WIDTH - 120);
        const y = 60 + Math.random() * (HEIGHT - 120);
        const blocked = CRATE_RECTS.some(
          (c) => x > c.x - 20 && x < c.x + c.w + 20 && y > c.y - 20 && y < c.y + c.h + 20
        );
        if (!blocked) {
          g.pickups.push({ x, y, life: 20 });
          break;
        }
      }
    }
  }, []);

  const startGame = useCallback(() => {
    gRef.current = newState();
    firingRef.current = false;
    setHp(PLAYER_MAX_HP);
    setScore(0);
    setWave(0);
    startWave();
    changeStatus("playing");
    const m = musicRef.current;
    if (m && !mutedRef.current) {
      m.currentTime = 0;
      m.play().catch(() => {});
    }
  }, [startWave, changeStatus]);

  const togglePause = useCallback(() => {
    if (statusRef.current === "playing") {
      firingRef.current = false;
      changeStatus("paused");
      musicRef.current?.pause();
    } else if (statusRef.current === "paused") {
      changeStatus("playing");
      if (!mutedRef.current) musicRef.current?.play().catch(() => {});
    }
  }, [changeStatus]);

  // ---- Eingabe ---------------------------------------------------------
  useEffect(() => {
    const GAME_KEYS = new Set([
      "KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space",
    ]);
    const onDown = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "KeyP") {
        if (statusRef.current === "playing" || statusRef.current === "paused") {
          e.preventDefault();
          togglePause();
        }
        return;
      }
      if (GAME_KEYS.has(e.code)) {
        if (statusRef.current === "playing") e.preventDefault();
        keysRef.current.add(e.code);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };
    const onMouseUp = () => {
      firingRef.current = false;
    };
    const onBlur = () => {
      keysRef.current.clear();
      firingRef.current = false;
      if (statusRef.current === "playing") togglePause();
    };
    window.addEventListener("keydown", onDown, { passive: false });
    window.addEventListener("keyup", onUp);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [togglePause]);

  const updateMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) * WIDTH) / rect.width;
    mouseRef.current.y = ((e.clientY - rect.top) * HEIGHT) / rect.height;
  };

  // ---- Hauptschleife ---------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const burst = (g: GameState, x: number, y: number, color: string, count: number, speed: number) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = speed * (0.3 + Math.random() * 0.7);
        g.particles.push({
          x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: 0.35 + Math.random() * 0.3, max: 0.65, color, size: 2 + Math.random() * 3,
        });
      }
    };

    const spawnEnemy = (g: GameState) => {
      const side = Math.floor(Math.random() * 4);
      const m = 30;
      let x = 0;
      let y = 0;
      if (side === 0) { x = Math.random() * WIDTH; y = -m; }
      else if (side === 1) { x = WIDTH + m; y = Math.random() * HEIGHT; }
      else if (side === 2) { x = Math.random() * WIDTH; y = HEIGHT + m; }
      else { x = -m; y = Math.random() * HEIGHT; }

      const tankChance = g.wave < 2 ? 0 : Math.min(0.4, 0.12 + g.wave * 0.03);
      const spec = Math.random() < tankChance ? TANK : GRUNT;
      const scale = 1 + Math.min(g.wave, 15) * 0.035;
      g.enemies.push({
        x, y, r: spec.r, size: spec.size, speed: spec.speed * scale, damage: spec.damage,
        hp: spec.hp, kind: spec === TANK ? "tank" : "grunt", flash: 0, angle: 0,
      });
    };

    const finishGame = (g: GameState) => {
      changeStatus("over");
      firingRef.current = false;
      musicRef.current?.pause();
      playSound("gameOver", 0.7);
      setBest((b) => {
        const next = Math.max(b, g.score);
        try {
          localStorage.setItem("shooter-best", String(next));
        } catch {
          /* ignorieren */
        }
        return next;
      });
    };

    const update = (g: GameState, dt: number) => {
      const keys = keysRef.current;

      // Bewegung
      let dx = 0;
      let dy = 0;
      if (keys.has("KeyA") || keys.has("ArrowLeft")) dx -= 1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) dx += 1;
      if (keys.has("KeyW") || keys.has("ArrowUp")) dy -= 1;
      if (keys.has("KeyS") || keys.has("ArrowDown")) dy += 1;
      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        g.px += (dx / len) * PLAYER_SPEED * dt;
        g.py += (dy / len) * PLAYER_SPEED * dt;
      }
      g.px = Math.max(PLAYER_R, Math.min(WIDTH - PLAYER_R, g.px));
      g.py = Math.max(PLAYER_R, Math.min(HEIGHT - PLAYER_R, g.py));
      const pp = { x: g.px, y: g.py };
      CRATE_RECTS.forEach((c) => pushOut(pp, PLAYER_R, c));
      g.px = pp.x;
      g.py = pp.y;

      // Zielen
      g.aim = Math.atan2(mouseRef.current.y - g.py, mouseRef.current.x - g.px);

      // Schießen
      g.fireCd -= dt;
      g.muzzle = Math.max(0, g.muzzle - dt);
      if ((firingRef.current || keys.has("Space")) && g.fireCd <= 0) {
        const a = g.aim + (Math.random() - 0.5) * 2 * BULLET_SPREAD;
        g.bullets.push({
          x: g.px + Math.cos(g.aim) * 22,
          y: g.py + Math.sin(g.aim) * 22,
          vx: Math.cos(a) * BULLET_SPEED,
          vy: Math.sin(a) * BULLET_SPEED,
          angle: a,
          life: BULLET_LIFE,
        });
        g.fireCd = FIRE_COOLDOWN;
        g.muzzle = 0.05;
        playSound("shoot", 0.35);
      }

      // Geschosse
      for (let i = g.bullets.length - 1; i >= 0; i--) {
        const b = g.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        let remove = b.life <= 0 || b.x < -20 || b.x > WIDTH + 20 || b.y < -20 || b.y > HEIGHT + 20;
        if (!remove && CRATE_RECTS.some((c) => b.x > c.x && b.x < c.x + c.w && b.y > c.y && b.y < c.y + c.h)) {
          burst(g, b.x, b.y, "#c9a066", 3, 90);
          remove = true;
        }
        if (!remove) {
          for (let j = 0; j < g.enemies.length; j++) {
            const e = g.enemies[j];
            if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + 3) {
              e.hp -= 1;
              e.flash = 0.08;
              e.x += b.vx * 0.012;
              e.y += b.vy * 0.012;
              remove = true;
              if (e.hp <= 0) {
                burst(g, e.x, e.y, e.kind === "tank" ? "#7a5fb0" : "#b3342a", e.kind === "tank" ? 18 : 10, 220);
                playSound("explosion", 0.5);
                g.score += e.kind === "tank" ? TANK.score : GRUNT.score;
                setScore(g.score);
                if (Math.random() < (e.kind === "tank" ? 0.3 : 0.08)) {
                  g.pickups.push({ x: e.x, y: e.y, life: 12 });
                }
                g.enemies.splice(j, 1);
              } else {
                burst(g, b.x, b.y, "#ffd23a", 3, 120);
                playSound("hit", 0.4);
              }
              break;
            }
          }
        }
        if (remove) g.bullets.splice(i, 1);
      }

      // Gegner
      for (const e of g.enemies) {
        e.flash = Math.max(0, e.flash - dt);
        const ex = g.px - e.x;
        const ey = g.py - e.y;
        const d = Math.hypot(ex, ey) || 1;
        e.angle = Math.atan2(ey, ex);
        e.x += (ex / d) * e.speed * dt;
        e.y += (ey / d) * e.speed * dt;
      }
      // Gegner voneinander trennen + aus Kisten schieben
      for (let i = 0; i < g.enemies.length; i++) {
        const a = g.enemies[i];
        for (let j = i + 1; j < g.enemies.length; j++) {
          const b = g.enemies[j];
          const ddx = b.x - a.x;
          const ddy = b.y - a.y;
          const dist = Math.hypot(ddx, ddy);
          const min = (a.r + b.r) * 0.9;
          if (dist > 0 && dist < min) {
            const push = (min - dist) / 2;
            const nx = ddx / dist;
            const ny = ddy / dist;
            a.x -= nx * push; a.y -= ny * push;
            b.x += nx * push; b.y += ny * push;
          }
        }
        CRATE_RECTS.forEach((c) => pushOut(a, a.r, c));
      }

      // Kontaktschaden
      g.invuln = Math.max(0, g.invuln - dt);
      g.shake = Math.max(0, g.shake - dt);
      if (g.invuln <= 0) {
        for (const e of g.enemies) {
          if (Math.hypot(e.x - g.px, e.y - g.py) < e.r + PLAYER_R - 2) {
            g.hp = Math.max(0, g.hp - e.damage);
            g.invuln = PLAYER_INVULN;
            g.shake = 0.25;
            setHp(g.hp);
            burst(g, g.px, g.py, "#e6402f", 8, 180);
            playSound("hurt", 0.6);
            break;
          }
        }
      }

      // Items
      for (let i = g.pickups.length - 1; i >= 0; i--) {
        const p = g.pickups[i];
        p.life -= dt;
        if (Math.hypot(p.x - g.px, p.y - g.py) < PLAYER_R + 14) {
          g.hp = Math.min(PLAYER_MAX_HP, g.hp + MEDKIT_HEAL);
          setHp(g.hp);
          playSound("pickup", 0.6);
          g.pickups.splice(i, 1);
        } else if (p.life <= 0) {
          g.pickups.splice(i, 1);
        }
      }

      // Partikel
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.92;
        p.vy *= 0.92;
        if (p.life <= 0) g.particles.splice(i, 1);
      }

      // Wellen
      if (g.banner > 0) {
        g.banner -= dt;
      } else if (g.toSpawn > 0) {
        g.spawnTimer -= dt;
        if (g.spawnTimer <= 0) {
          spawnEnemy(g);
          g.toSpawn -= 1;
          g.spawnTimer = Math.max(0.22, 0.85 - g.wave * 0.05);
        }
      } else if (g.enemies.length === 0) {
        startWave();
      }

      if (g.hp <= 0) finishGame(g);
    };

    const drawSprite = (
      key: ImageKey, x: number, y: number, w: number, h: number, angle: number, fallback: string
    ) => {
      const img = imgsRef.current[key];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        ctx.fillStyle = fallback;
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(w, h) / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const draw = (g: GameState) => {
      ctx.save();
      if (g.shake > 0) {
        ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
      }

      // Boden
      const floor = imgsRef.current.floor;
      if (!floorPatternRef.current && floor && floor.complete && floor.naturalWidth > 0) {
        floorPatternRef.current = ctx.createPattern(floor, "repeat");
      }
      ctx.fillStyle = floorPatternRef.current ?? "#1a0d09";
      ctx.fillRect(-10, -10, WIDTH + 20, HEIGHT + 20);

      // Kisten
      const crate = imgsRef.current.crate;
      CRATE_RECTS.forEach((c) => {
        if (crate && crate.complete && crate.naturalWidth > 0) {
          ctx.drawImage(crate, c.x, c.y, c.w, c.h);
        } else {
          ctx.fillStyle = "#7a5230";
          ctx.fillRect(c.x, c.y, c.w, c.h);
        }
      });

      // Items
      g.pickups.forEach((p) => {
        if (p.life < 3 && Math.floor(p.life * 6) % 2 === 0) return; // blinkt kurz vor Ablauf
        const bob = Math.sin(performance.now() / 250) * 2;
        drawSprite("medkit", p.x, p.y + bob, 28, 28, 0, "#ece1c2");
      });

      // Geschosse
      g.bullets.forEach((b) => drawSprite("bullet", b.x, b.y, 22, 7, b.angle, "#ffcf55"));

      // Gegner
      g.enemies.forEach((e) => {
        drawSprite(e.kind === "tank" ? "tank" : "enemy", e.x, e.y, e.size, e.size, e.angle,
          e.kind === "tank" ? "#3b2a52" : "#7a1f1f");
        if (e.flash > 0) {
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
          ctx.fill();
        }
        if (e.kind === "tank" && e.hp < TANK.hp) {
          // Mini-Lebensbalken
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(e.x - 16, e.y - e.r - 10, 32, 4);
          ctx.fillStyle = "#e6402f";
          ctx.fillRect(e.x - 16, e.y - e.r - 10, (32 * e.hp) / TANK.hp, 4);
        }
      });

      // Spieler (blinkt nach Treffer)
      const blink = g.invuln > 0 && Math.floor(g.invuln * 20) % 2 === 0;
      if (!blink) drawSprite("player", g.px, g.py, PLAYER_SIZE, PLAYER_SIZE, g.aim, "#3f6b5a");
      if (g.muzzle > 0) {
        ctx.fillStyle = "rgba(255, 214, 110, 0.9)";
        ctx.beginPath();
        ctx.arc(g.px + Math.cos(g.aim) * 28, g.py + Math.sin(g.aim) * 28, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Partikel
      g.particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      });
      ctx.globalAlpha = 1;

      // Wellen-Banner
      if (g.banner > 0 && g.wave > 0) {
        ctx.fillStyle = "rgba(232, 182, 74, " + Math.min(1, g.banner) + ")";
        ctx.font = "28px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("WELLE " + g.wave, WIDTH / 2, 70);
      }

      // Fadenkreuz
      if (statusRef.current === "playing") {
        const m = mouseRef.current;
        ctx.strokeStyle = "rgba(232, 182, 74, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 9, 0, Math.PI * 2);
        ctx.moveTo(m.x - 15, m.y); ctx.lineTo(m.x - 5, m.y);
        ctx.moveTo(m.x + 5, m.y); ctx.lineTo(m.x + 15, m.y);
        ctx.moveTo(m.x, m.y - 15); ctx.lineTo(m.x, m.y - 5);
        ctx.moveTo(m.x, m.y + 5); ctx.lineTo(m.x, m.y + 15);
        ctx.stroke();
      }

      ctx.restore();
    };

    const step = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.033);
      lastTsRef.current = ts;

      const g = gRef.current;
      if (statusRef.current === "playing") update(g, dt);
      draw(g);
      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [playSound, startWave, changeStatus]);

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    const music = musicRef.current;
    if (!music) return;
    if (next) music.pause();
    else if (statusRef.current === "playing") music.play().catch(() => {});
  };

  return (
    <div className="monitor monitor--wide">
      <div className="monitor-bezel">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          aria-label="Theo Shooter Spiel"
          style={{ cursor: status === "playing" ? "none" : "default" }}
          onMouseMove={updateMouse}
          onMouseDown={(e) => {
            if (e.button !== 0 || statusRef.current !== "playing") return;
            updateMouse(e);
            firingRef.current = true;
          }}
          onContextMenu={(e) => e.preventDefault()}
        />
        <div className="monitor-scanlines" />
        <div className="monitor-vignette" />

        {status !== "playing" && (
          <div className="monitor-overlay">
            {status === "ready" && (
              <>
                <h3>EINSATZ BEREIT</h3>
                <p>
                  WASD bewegen · Maus zielen · Linksklick schießen. Halte die
                  Stellung gegen die Wellen und sammle Heil-Items ein.
                </p>
              </>
            )}
            {status === "paused" && (
              <>
                <h3>PAUSE</h3>
                <p>Esc oder P zum Fortsetzen.</p>
              </>
            )}
            {status === "over" && (
              <>
                <h3>THEO IST AUSGESCHALTET</h3>
                <p>
                  Punkte: {score} · Welle: {wave} · Bestwert: {best}
                </p>
              </>
            )}
            <button
              className="btn-restart"
              onClick={(e) => {
                e.stopPropagation();
                if (status === "paused") togglePause();
                else startGame();
              }}
            >
              {status === "ready" && "SPIEL STARTEN"}
              {status === "paused" && "WEITER"}
              {status === "over" && "NOCHMAL VERSUCHEN"}
            </button>
          </div>
        )}
      </div>

      <div className="monitor-hud">
        <span className="lives">LEBEN: {hp}</span>
        <span>PUNKTE: {score}</span>
        <span>WELLE: {wave}</span>
        <span>BESTWERT: {best}</span>
        <button className="btn-mute" onClick={toggleMute}>
          {muted ? "🔇 TON AUS" : "🔊 TON AN"}
        </button>
      </div>
      <div className="monitor-controls-hint">
        WASD / PFEILE BEWEGEN · MAUS ZIELEN · KLICK / LEERTASTE SCHIESSEN · ESC PAUSE
      </div>
    </div>
  );
}
