// Layout & rendering primitives. Everything that draws to the terminal goes
// through these helpers so spacing, centring and styling stay consistent.
import chalk from 'chalk';
import boxen from 'boxen';
import { c, palette, sym, brand } from './theme.js';
import { config } from './config.js';

const ANSI = /\x1B\[[0-9;]*m/g;
export const stripAnsi = (s) => String(s).replace(ANSI, '');
export const width = (s) => stripAnsi(s).length;
export const cols = () => Math.max(40, process.stdout.columns || 80);

export const clearScreen = () => process.stdout.write('\x1B[2J\x1B[3J\x1B[H');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Centre a single line within `w`, accounting for ANSI colour codes.
export function center(line, w = cols()) {
  const pad = Math.max(0, Math.floor((w - width(line)) / 2));
  return ' '.repeat(pad) + line;
}

// Centre a multi-line block as a unit (aligned on its widest line).
export function centerBlock(block, w = cols()) {
  const lines = String(block).split('\n');
  const widest = Math.max(...lines.map(width));
  const pad = Math.max(0, Math.floor((w - widest) / 2));
  return lines.map((l) => ' '.repeat(pad) + l).join('\n');
}

// Left text / right text on one row, justified to the edges.
export function splitLine(left, right, w = cols()) {
  const gap = Math.max(1, w - width(left) - width(right));
  return left + ' '.repeat(gap) + right;
}

export function divider(w = cols(), char = sym.hbar) {
  return c.dim(char.repeat(w));
}

// Pill-style status badge.
export function badge(text, kind = 'accent') {
  const map = {
    accent: chalk.bgHex(palette.cyan).black,
    ok: chalk.bgHex(palette.green).black,
    warn: chalk.bgHex(palette.amber).black,
    err: chalk.bgHex(palette.red).black,
    dim: chalk.bgHex(palette.dim).black,
  };
  const fn = map[kind] || map.accent;
  return fn.bold(` ${String(text).toUpperCase()} `);
}

// Rounded, titled panel.
export function panel(body, { title, color = palette.cyan } = {}) {
  return boxen(body, {
    padding: { top: 1, bottom: 1, left: 3, right: 3 },
    borderStyle: 'round',
    borderColor: color,
    title: title ? c.accent.bold(title) : undefined,
    titleAlignment: 'left',
  });
}

// Slim brand bar shown above the menu and module screens.
export function slimHeader(status = {}) {
  const left = brand(`${sym.circuit} CIRCUIT`) + ' ' + c.muted('LLM');
  const net = status.online
    ? `${c.ok(sym.dot)} ${c.text('mesh online')}`
    : `${c.dim(sym.ring)} ${c.muted('offline')}`;
  const right = `${net}  ${c.dim('·')}  ${c.muted('v' + config.version)}`;
  console.log('');
  console.log(' ' + splitLine(left, right, cols() - 2));
  console.log(divider());
}

// Block for a single keypress (any key). Resolves immediately when not a TTY
// so piped/non-interactive invocations never hang. Ctrl-C exits cleanly.
export function pressKey(label = 'press any key to continue', { silent = false } = {}) {
  return new Promise((resolve) => {
    if (!silent) process.stdout.write('\n' + c.dim(`  ${sym.chevron} ${label}\n`));
    const stdin = process.stdin;
    if (!stdin.isTTY) return resolve();
    const prev = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    const onData = (d) => {
      stdin.removeListener('data', onData);
      try {
        stdin.setRawMode(prev || false);
      } catch {}
      stdin.pause();
      if (d && d[0] === 3) {
        process.stdout.write('\n');
        process.exit(0);
      }
      resolve();
    };
    stdin.on('data', onData);
  });
}
