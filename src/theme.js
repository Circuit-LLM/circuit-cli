// The Circuit design system — one place for every colour, gradient and glyph.
// Swap the palette here and the whole CLI re-skins.
import chalk from 'chalk';
import gradient from 'gradient-string';

// Circuit brand — warm gold/yellow on near-black, matching the dashboards and
// circuitllm.xyz. The signature is electric yellow (#ffe000); gold and bright
// flank it for accents and glow.
export const palette = {
  gold: '#dcb820', // primary accent
  yellow: '#ffe000', // signature / high-emphasis
  bright: '#ffe880', // glow / gradient tip
  amber: '#ffa42a', // secondary warm accent
  green: '#8ada6e',
  red: '#ff5c5c',
  text: '#efe4b4', // warm cream
  muted: '#cabb7e',
  dim: '#5a4e1a',
};

// The signature Circuit gradient: gold → yellow → bright (a glowing-gold sweep).
export const brand = gradient([palette.gold, palette.yellow, palette.bright]);
export const brandAlt = gradient([palette.bright, palette.amber]);
export const grad = (...stops) => gradient(stops);

// Semantic colours.
export const c = {
  accent: chalk.hex(palette.gold),
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
