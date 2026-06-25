// Screen chrome — headers, footers, keypress. Imports config lazily so the
// version/status reads stay current.
import { config } from '../config.js';
import { c, sym, brand } from '../theme.js';
import { cols, splitLine, divider, clearScreen, center } from './layout.js';
import { statusDot } from './components.js';

// Slim brand bar used above module screens and the menu.
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

// Big centred wordmark for standalone command screens.
export function compactBrand() {
  console.log('');
  console.log(center(brand(`${sym.circuit} CIRCUIT LLM`)));
  console.log('');
}

export function footerHint(text) {
  console.log('');
  console.log(c.dim(`  ${sym.chevron} ${text}`));
}

// Block for a single keypress. Resolves immediately when not a TTY so piped /
// scripted runs never hang. Ctrl-C exits cleanly.
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
