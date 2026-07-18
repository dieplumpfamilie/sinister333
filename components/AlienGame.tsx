"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Maze legend:
 * # = wall
 * . = open path with an energy drink on it
 */
const RAW_MAZE = [
  "###############",
  "#.............#",
  "#.##.#####.##.#",
  "#.............#",
  "#.##.#.#.#.##.#",
  "#....#.#.#....#",
  "##.##.#.#.##.##",
  "#....#.#.#....#",
  "#.##.#.#.#.##.#",
  "#.............#",
  "#.##.#####.##.#",
  "#.............#",
  "###############",
];

const ROWS = RAW_MAZE.length;
const COLS = RAW_MAZE[0].length;
const CELL = 30;
const TICK_MS = 190;

type Vec = { r: number; c: number };
type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT" | null;

const DELTA: Record<Exclude<Dir, null>, Vec> = {
  UP: { r: -1, c: 0 },
  DOWN: { r: 1, c: 0 },
  LEFT: { r: 0, c: -1 },
  RIGHT: { r: 0, c: 1 },
};

function isWall(r: number, c: number) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
  return RAW_MAZE[r][c] === "#";
}

function buildDots(): boolean[][] {
  return RAW_MAZE.map((row) => row.split("").map((ch) => ch === "."));
}

function bfsNextStep(from: Vec, to: Vec): Vec {
  // simple BFS on the grid, returns the first step from `from` towards `to`
  const key = (v: Vec) => `${v.r},${v.c}`;
  const visited = new Set<string>([key(from)]);
  const prev = new Map<string, Vec>();
  const queue: Vec[] = [from];

  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.r === to.r && cur.c === to.c) break;
    for (const d of Object.values(DELTA)) {
      const nr = cur.r + d.r;
      const nc = cur.c + d.c;
      if (isWall(nr, nc)) continue;
      const k = `${nr},${nc}`;
      if (visited.has(k)) continue;
      visited.add(k);
      prev.set(k, cur);
      queue.push({ r: nr, c: nc });
    }
  }

  const targetKey = key(to);
  if (!visited.has(targetKey) || targetKey === key(from)) return from;

  // walk the parent chain back from `to` until we find the node whose
  // parent is `from` — that node is the first step of the shortest path.
  let node = to;
  let nodeKey = targetKey;
  while (prev.has(nodeKey)) {
    const parent = prev.get(nodeKey)!;
    if (parent.r === from.r && parent.c === from.c) {
      return node;
    }
    node = parent;
    nodeKey = key(node);
  }
  return from;
}

const PLAYER_START: Vec = { r: 1, c: 1 };
const CHASER_STARTS: Vec[] = [
  { r: 1, c: 13 },
  { r: 11, c: 1 },
  { r: 11, c: 13 },
];

type Status = "ready" | "playing" | "won" | "lost";

export default function AlienGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotsRef = useRef<boolean[][]>(buildDots());
  const playerRef = useRef<Vec>({ ...PLAYER_START });
  const dirRef = useRef<Dir>(null);
  const nextDirRef = useRef<Dir>(null);
  const chasersRef = useRef<Vec[]>(CHASER_STARTS.map((v) => ({ ...v })));
  const chaserStepRef = useRef<number>(0);
  const frameRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [status, setStatus] = useState<Status>("ready");
  const [dotsLeft, setDotsLeft] = useState(
    () => dotsRef.current.flat().filter(Boolean).length
  );

  const resetPositions = useCallback(() => {
    playerRef.current = { ...PLAYER_START };
    chasersRef.current = CHASER_STARTS.map((v) => ({ ...v }));
    dirRef.current = null;
    nextDirRef.current = null;
  }, []);

  const resetGame = useCallback(() => {
    dotsRef.current = buildDots();
    setDotsLeft(dotsRef.current.flat().filter(Boolean).length);
    setScore(0);
    setLives(3);
    resetPositions();
    setStatus("playing");
  }, [resetPositions]);

  // keyboard input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
        w: "UP",
        s: "DOWN",
        a: "LEFT",
        d: "RIGHT",
        W: "UP",
        S: "DOWN",
        A: "LEFT",
        D: "RIGHT",
      };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        nextDirRef.current = d;
        if (status === "ready" || status === "lost" || status === "won") {
          resetGame();
        }
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [status, resetGame]);

  // main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const step = (timestamp: number) => {
      if (status === "playing") {
        if (timestamp - lastTickRef.current > TICK_MS) {
          lastTickRef.current = timestamp;
          tick();
        }
      }
      draw(ctx);
      frameRef.current = requestAnimationFrame(step);
    };

    const tick = () => {
      const player = playerRef.current;

      // try queued direction first, else keep current direction
      const tryDir = (d: Dir): Vec | null => {
        if (!d) return null;
        const delta = DELTA[d];
        const nr = player.r + delta.r;
        const nc = player.c + delta.c;
        if (isWall(nr, nc)) return null;
        return { r: nr, c: nc };
      };

      let next = tryDir(nextDirRef.current);
      if (next) {
        dirRef.current = nextDirRef.current;
      } else {
        next = tryDir(dirRef.current);
      }
      if (next) {
        playerRef.current = next;
      }

      // collect dot
      const { r, c } = playerRef.current;
      if (dotsRef.current[r][c]) {
        dotsRef.current[r][c] = false;
        setScore((s) => s + 10);
        setDotsLeft((n) => {
          const left = n - 1;
          if (left <= 0) setStatus("won");
          return left;
        });
      }

      // move chasers every other tick (a touch slower than the alien)
      chaserStepRef.current += 1;
      if (chaserStepRef.current % 2 === 0) {
        chasersRef.current = chasersRef.current.map((ch) =>
          bfsNextStep(ch, playerRef.current)
        );
      }

      // collision check
      const caught = chasersRef.current.some(
        (ch) => ch.r === playerRef.current.r && ch.c === playerRef.current.c
      );
      if (caught) {
        setLives((l) => {
          const remaining = l - 1;
          if (remaining <= 0) {
            setStatus("lost");
          } else {
            resetPositions();
          }
          return remaining;
        });
      }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      const w = COLS * CELL;
      const h = ROWS * CELL;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#060805";
      ctx.fillRect(0, 0, w, h);

      // walls
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (RAW_MAZE[r][c] === "#") {
            ctx.fillStyle = "#1c2a10";
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
            ctx.strokeStyle = "#33471a";
            ctx.lineWidth = 1;
            ctx.strokeRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          }
        }
      }

      // energy drinks
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (dotsRef.current[r][c]) {
            drawEnergyDrink(ctx, c * CELL + CELL / 2, r * CELL + CELL / 2);
          }
        }
      }

      // chasers
      chasersRef.current.forEach((ch) => {
        drawChaser(ctx, ch.c * CELL + CELL / 2, ch.r * CELL + CELL / 2);
      });

      // player (alien)
      drawAlien(
        ctx,
        playerRef.current.c * CELL + CELL / 2,
        playerRef.current.r * CELL + CELL / 2,
        dirRef.current
      );
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="monitor">
      <div className="monitor-bezel">
        <canvas
          ref={canvasRef}
          width={COLS * CELL}
          height={ROWS * CELL}
          aria-label="Sinister Scaring Theo Spiel"
        />
        <div className="monitor-scanlines" />
        <div className="monitor-vignette" />

        {status !== "playing" && (
          <div className="monitor-overlay">
            {status === "ready" && (
              <>
                <h3>ÜBERWACHUNG BEREIT</h3>
                <p>
                  Steuere Theo mit den Pfeiltasten oder WASD. Sammle alle
                  Energy Drinks ein und entkomme den Verfolgerinnen.
                </p>
              </>
            )}
            {status === "won" && (
              <>
                <h3>FLUCHT GEGLÜCKT</h3>
                <p>Theo hat alle Energy Drinks gesichert. Punkte: {score}</p>
              </>
            )}
            {status === "lost" && (
              <>
                <h3>THEO WURDE GEFASST</h3>
                <p>Endstand: {score} Punkte</p>
              </>
            )}
            <button className="btn-restart" onClick={resetGame}>
              {status === "ready" ? "SPIEL STARTEN" : "NOCHMAL VERSUCHEN"}
            </button>
          </div>
        )}
      </div>

      <div className="monitor-hud">
        <span>PUNKTE: {score}</span>
        <span>DRINKS: {dotsLeft}</span>
        <span className="lives">LEBEN: {"👽".repeat(Math.max(lives, 0))}</span>
      </div>
      <div className="monitor-controls-hint">
        PFEILTASTEN / WASD ZUM STEUERN
      </div>
    </div>
  );
}

function drawEnergyDrink(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#f2f2ea";
  ctx.shadowColor = "#a6ff2f";
  ctx.shadowBlur = 6;
  // can body
  ctx.beginPath();
  ctx.roundRect(-4, -7, 8, 14, 2);
  ctx.fill();
  // cap
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#a6ff2f";
  ctx.fillRect(-4, -7, 8, 3);
  ctx.restore();
}

function drawAlien(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: Dir
) {
  ctx.save();
  ctx.translate(x, y);

  // uniform body
  ctx.fillStyle = "#cfcabb";
  ctx.strokeStyle = "#3a3830";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-7, 2, 14, 9, 2);
  ctx.fill();
  ctx.stroke();

  // head
  ctx.fillStyle = "#9aa88f";
  ctx.beginPath();
  ctx.ellipse(0, -4, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#5c6852";
  ctx.stroke();

  // eyes (direction-aware tilt)
  const tilt =
    dir === "LEFT" ? -2 : dir === "RIGHT" ? 2 : dir === "UP" ? -1 : 1;
  ctx.fillStyle = "#0c0c0a";
  ctx.beginPath();
  ctx.ellipse(-3.4, -5 + tilt * 0.2, 2.6, 3.8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(3.4, -5 + tilt * 0.2, 2.6, 3.8, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawChaser(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);

  // dress / body silhouette
  ctx.fillStyle = "#c73333";
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(6, 9);
  ctx.lineTo(-6, 9);
  ctx.closePath();
  ctx.fill();

  // head
  ctx.fillStyle = "#e9c9a8";
  ctx.beginPath();
  ctx.arc(0, -10, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // hair
  ctx.fillStyle = "#241a14";
  ctx.beginPath();
  ctx.arc(0, -11.5, 5, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-5, -12, 2, 8);
  ctx.fillRect(3, -12, 2, 8);

  ctx.restore();
}
