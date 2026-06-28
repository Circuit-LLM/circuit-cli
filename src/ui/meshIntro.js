// The landing-page intro: a yellow mesh of nodes wires itself up around the CIRCUIT wordmark,
// then settles. Pure-terminal (ANSI repaint, no deps beyond chalk + figlet). Degrades to nothing
// on a non-TTY or a too-narrow window — the caller then prints the static banner instead.
import chalk from 'chalk';
import figlet from 'figlet';
import { palette, sym } from '../theme.js';
import { cols } from './layout.js';

const ESC = '\x1b';
const up = (n) => (n > 0 ? `${ESC}[${n}A` : '');
const CLR_EOL = `${ESC}[K`;
const HIDE = `${ESC}[?25l`;
const SHOW = `${ESC}[?25h`;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Deterministic PRNG — the constellation looks the same on every launch (brand identity).
function lcg(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff;
}

let _art;
function art() {
  if (_art) return _art;
  try {
    _art = figlet.textSync('CIRCUIT', { font: 'ANSI Shadow' }).replace(/\s+$/, '').split('\n');
  } catch {
    _art = ['C I R C U I T'];
  }
  return _art;
}

// Bresenham cell-line between two nodes, endpoints dropped (nodes draw themselves).
function linePts(a, b) {
  const pts = [];
  let x0 = a.x;
  let y0 = a.y;
  const dx = Math.abs(b.x - x0);
  const dy = Math.abs(b.y - y0);
  const sx = x0 < b.x ? 1 : -1;
  const sy = y0 < b.y ? 1 : -1;
  let err = dx - dy;
  for (;;) {
    pts.push({ x: x0, y: y0 });
    if (x0 === b.x && y0 === b.y) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  return pts.slice(1, -1);
}

// Lay out the wordmark + a ring of mesh nodes/edges in the margins around it.
function buildScene(W) {
  const lines = art();
  const artW = Math.max(...lines.map((l) => l.length));
  const artH = lines.length;
  const H = artH + 6;
  const artTop = 3;
  const artLeft = Math.floor((W - artW) / 2);
  const inArt = (x, y) => y >= artTop && y < artTop + artH && x >= artLeft - 1 && x <= artLeft + artW;

  const rnd = lcg(0x0c1c2173);
  const nodes = [];
  const want = Math.min(18, Math.max(8, Math.floor(W / 5)));
  let guard = 0;
  while (nodes.length < want && guard++ < 1200) {
    const x = 1 + Math.floor(rnd() * (W - 2));
    const y = Math.floor(rnd() * H);
    if (inArt(x, y)) continue;
    if (nodes.some((n) => Math.abs(n.x - x) <= 2 && Math.abs(n.y - y) <= 1)) continue;
    nodes.push({ x, y, ph: Math.floor(rnd() * 6) });
  }

  // Connect near nodes (visual distance — cells are ~1:2, so weight y by 2), cap degree at 3.
  const deg = nodes.map(() => 0);
  const d2 = (a, b) => (a.x - b.x) ** 2 + ((a.y - b.y) * 2) ** 2;
  const pairs = [];
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) pairs.push([i, j, d2(nodes[i], nodes[j])]);
  pairs.sort((a, b) => a[2] - b[2]);
  const edges = [];
  for (const [i, j, d] of pairs) {
    if (d > 22 * 22) continue;
    if (deg[i] >= 3 || deg[j] >= 3) continue;
    edges.push([i, j]);
    deg[i] += 1;
    deg[j] += 1;
  }
  const trails = edges.map(([i, j]) => linePts(nodes[i], nodes[j]));
  return { lines, artW, artH, H, artTop, artLeft, inArt, nodes, trails };
}

const cNode = chalk.hex(palette.bright);
const cHot = chalk.hex('#fff6cf');
const cEdge = chalk.hex(palette.gold);
const cArt = chalk.hex(palette.yellow).bold;

// One frame → array of (already padded+coloured) row strings.
function frameRows(scene, f, frames, termW, W) {
  const { lines, artH, H, artTop, artLeft, inArt, nodes, trails } = scene;
  const buf = Array.from({ length: H }, () => Array(W).fill(null));

  const nodePhase = Math.max(1, Math.floor(frames * 0.35));
  const nodesIn = clamp(Math.ceil(((f + 1) / nodePhase) * nodes.length), 0, nodes.length);
  const edgeStart = Math.floor(frames * 0.32);
  const edgeLen = Math.max(1, Math.floor(frames * 0.45));
  const edgeProg = clamp((f - edgeStart) / edgeLen, 0, 1);
  const holding = f >= edgeStart + edgeLen;

  // edges (drawn behind everything, masked out of the wordmark box)
  for (const pts of trails) {
    const show = Math.floor(pts.length * edgeProg);
    for (let p = 0; p < show; p++) {
      const { x, y } = pts[p];
      if (y < 0 || y >= H || x < 0 || x >= W || inArt(x, y)) continue;
      if (!buf[y][x]) buf[y][x] = 'edge';
    }
  }
  // nodes
  for (let n = 0; n < nodesIn; n++) {
    const nd = nodes[n];
    if (nd.y < 0 || nd.y >= H || nd.x < 0 || nd.x >= W) continue;
    buf[nd.y][nd.x] = holding && (f + nd.ph) % 6 === 0 ? 'hot' : 'node';
  }
  // wordmark on top
  for (let r = 0; r < artH; r++) {
    const row = lines[r];
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== ' ') buf[artTop + r][artLeft + x] = `art:${row[x]}`;
    }
  }

  const pad = ' '.repeat(Math.max(0, Math.floor((termW - W) / 2)));
  return buf.map((row) => pad + row.map((cell) => {
    if (cell === null) return ' ';
    if (cell === 'edge') return cEdge('·');
    if (cell === 'node') return cNode(sym.node);
    if (cell === 'hot') return cHot(sym.node);
    return cArt(cell.slice(4)); // art:<char>
  }).join(''));
}

// The settled frame, for the non-animated fallback / preview.
export function meshStill() {
  const termW = cols();
  const W = Math.min(termW, 82);
  const scene = buildScene(W);
  return frameRows(scene, 999, 26, termW, W).join('\n');
}

export async function playMeshIntro({ frames = 26, frameMs = 70 } = {}) {
  const out = process.stdout;
  if (!out.isTTY) throw new Error('no-tty');
  const termW = cols();
  const W = Math.min(termW, 82);
  const scene = buildScene(W);
  if (W < scene.artW + 6) throw new Error('too-narrow');

  const stdin = process.stdin;
  const stdinTty = !!stdin.isTTY;
  let skip = false;
  let rawPrev;
  const onKey = (d) => {
    if (d && d[0] === 3) { out.write(SHOW); process.exit(0); }
    skip = true;
  };

  try {
    out.write(HIDE);
    if (stdinTty) {
      rawPrev = stdin.isRaw;
      try { stdin.setRawMode(true); } catch { /* not all TTYs */ }
      stdin.resume();
      stdin.on('data', onKey);
    }
    out.write('\n');
    out.write('\n'.repeat(scene.H)); // reserve the region

    for (let f = 0; f < frames; f++) {
      const rows = frameRows(scene, skip ? frames - 1 : f, frames, termW, W);
      out.write(up(scene.H));
      out.write(rows.map((r) => r + CLR_EOL).join('\n') + '\n');
      if (skip) break;
      await delay(frameMs);
    }
  } finally {
    if (stdinTty) {
      stdin.removeListener('data', onKey);
      try { stdin.setRawMode(rawPrev || false); } catch { /* noop */ }
      stdin.pause();
    }
    out.write(SHOW);
  }
}
