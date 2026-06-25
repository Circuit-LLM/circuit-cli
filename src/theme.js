// The Circuit design system — one place for every colour, gradient and glyph.
// Swap the palette here and the whole CLI re-skins.
import chalk from 'chalk';
import gradient from 'gradient-string';

export const palette = {
  teal: '#2DD4BF',
  cyan: '#22D3EE',
  sky: '#38BDF8',
  blue: '#3B82F6',
  indigo: '#6366F1',
  violet: '#8B5CF6',
  green: '#34D399',
  amber: '#FBBF24',
  red: '#F87171',
  text: '#E2E8F0',
  muted: '#94A3B8',
  dim: '#64748B',
};

// The signature Circuit gradient: teal → cyan → indigo (electric, on-brand).
export const brand = gradient([palette.teal, palette.cyan, palette.indigo]);
export const brandAlt = gradient([palette.cyan, palette.violet]);
export const grad = (...stops) => gradient(stops);

// Semantic colours.
export const c = {
  accent: chalk.hex(palette.cyan),
  text: chalk.hex(palette.text),
  muted: chalk.hex(palette.muted),
  dim: chalk.hex(palette.dim),
  ok: chalk.hex(palette.green),
  warn: chalk.hex(palette.amber),
  err: chalk.hex(palette.red),
  bold: chalk.bold,
};

// Glyph set — kept unicode-light so it renders on most terminals.
export const sym = {
  dot: '●',
  ring: '○',
  diamond: '◆',
  diamondO: '◇',
  bolt: '↯',
  spark: '✦',
  chevron: '›',
  arrow: '▸',
  hbar: '─',
  vbar: '│',
  node: '⬡',
  cube: '▣',
  stack: '⛁',
  check: '✔',
  cross: '✕',
  circuit: '◈',
};
