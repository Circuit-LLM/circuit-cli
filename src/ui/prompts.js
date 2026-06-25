// Thin wrappers over @clack/prompts + nanospinner so modules share one voice
// and cancellation is handled consistently (Ctrl-C / Esc exits cleanly).
import * as clack from '@clack/prompts';
import { createSpinner } from 'nanospinner';
import { c } from '../theme.js';

function orExit(value) {
  if (clack.isCancel(value)) {
    clack.cancel(c.muted('Cancelled.'));
    process.exit(0);
  }
  return value;
}

export async function menuSelect(message, options, opts = {}) {
  return orExit(await clack.select({ message, options, ...opts }));
}

export async function askText(message, opts = {}) {
  return orExit(await clack.text({ message, ...opts }));
}

export async function askConfirm(message, opts = {}) {
  return orExit(await clack.confirm({ message, ...opts }));
}

export async function askPassword(message, opts = {}) {
  return orExit(await clack.password({ message, ...opts }));
}

export const note = clack.note;

// Spinner that returns { success, error, update, stop }.
export function spinner(text) {
  const s = createSpinner(c.muted(text)).start();
  return {
    success: (t) => s.success({ text: c.text(t) }),
    error: (t) => s.error({ text: c.err(t) }),
    warn: (t) => s.warn({ text: c.muted(t) }),
    update: (t) => s.update({ text: c.muted(t) }),
    stop: () => s.stop(),
  };
}
