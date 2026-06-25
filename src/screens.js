// Full-screen views: the splash/landing, the per-module screens and About.
import boxen from 'boxen';
import { createSpinner } from 'nanospinner';
import { config } from './config.js';
import { c, palette, sym, brand } from './theme.js';
import { renderBanner, renderWordmark } from './banner.js';
import { clearScreen, center, centerBlock, panel, badge, pressKey, slimHeader, sleep } from './ui.js';

// Lightweight reachability probe for the splash status line.
export async function checkMesh() {
  try {
    const r = await fetch(config.endpoints.health, { signal: AbortSignal.timeout(2500) });
    return { online: r.ok, code: r.status };
  } catch {
    return { online: false };
  }
}

function infoPanel(status) {
  const rows = [
    [sym.spark, 'Version', c.text(config.version)],
    [sym.circuit, 'Network', status.online ? c.ok(`${sym.dot} online`) : c.muted(`${sym.ring} offline`)],
    [sym.bolt, 'Model', c.text(config.model)],
    [sym.node, 'Endpoint', c.accent(config.web)],
  ];
  const body = rows.map(([ic, k, v]) => `${c.accent(ic)}  ${c.muted(k.padEnd(8))}  ${v}`).join('\n');
  const box = boxen(body, {
    padding: { top: 1, bottom: 1, left: 3, right: 3 },
    borderStyle: 'round',
    borderColor: palette.indigo,
    title: c.accent.bold('SYSTEM'),
    titleAlignment: 'left',
  });
  return centerBlock(box);
}

// The first-load screen: hero banner, wordmark, a live connect beat, system panel.
export async function splash() {
  clearScreen();
  console.log('\n');
  console.log(renderBanner());
  console.log('');
  console.log(renderWordmark());
  console.log('\n');

  const sp = createSpinner(c.muted('Establishing connection to the Circuit mesh…')).start();
  const status = await checkMesh();
  await sleep(450);
  if (status.online) sp.success({ text: c.text('Connected to the Circuit mesh') });
  else sp.warn({ text: c.muted('Mesh unreachable — continuing in offline mode') });

  console.log('');
  console.log(infoPanel(status));
  console.log('');
  console.log(center(c.dim(`${sym.chevron} press any key to enter the console ${sym.chevron}`)));
  return status;
}

function aboutPanel() {
  const item = (ic, k, l1, l2) =>
    [`${c.accent(ic)}  ${c.text(k.padEnd(6))} ${c.muted(l1)}`, `${' '.repeat(10)}${c.muted(l2)}`].join('\n');
  const body = [
    brand('Circuit LLM'),
    c.muted('A decentralized intelligence network.'),
    '',
    item(sym.bolt, 'DLLM', 'A 72B model served across commodity GPUs,', 'paid per-token in CIRC via x402.'),
    item(sym.circuit, 'Mesh', 'Independent nodes contribute compute and', 'earn from every inference they serve.'),
    item(sym.diamond, 'Swarm', 'Autonomous agents that trade and build', 'on top of the network.'),
    item(sym.node, 'Nodes', 'Anyone can join — one command attaches', 'a GPU to the mesh.'),
    '',
    `${c.dim('web')}   ${c.accent(config.links.web)}`,
    `${c.dim('docs')}  ${c.accent(config.links.docs)}`,
  ].join('\n');
  return centerBlock(
    boxen(body, {
      padding: { top: 1, bottom: 1, left: 3, right: 3 },
      borderStyle: 'round',
      borderColor: palette.cyan,
      title: c.accent.bold('ABOUT'),
      titleAlignment: 'left',
    }),
  );
}

// A single module view. `standalone` = invoked directly (e.g. `circuit chat`).
export async function areaScreen(area, { standalone = false, status = {} } = {}) {
  clearScreen();
  if (standalone) {
    console.log('');
    console.log(center(brand(`${sym.circuit} CIRCUIT LLM`)));
    console.log('');
  } else {
    slimHeader(status);
    console.log('');
  }

  if (area.id === 'about') {
    console.log(aboutPanel());
  } else {
    const planned = area.planned.map((p) => `  ${c.accent(sym.arrow)} ${c.text(p)}`).join('\n');
    const body = [
      `${c.accent(area.icon)}  ${brand(area.name)}   ${badge('coming soon', 'warn')}`,
      '',
      c.muted(area.long),
      '',
      c.dim('Planned capabilities'),
      planned,
    ].join('\n');
    console.log(centerBlock(panel(body, { title: area.name.toUpperCase(), color: palette.cyan })));
  }

  await pressKey(standalone ? 'press any key to exit' : 'press any key to return');
}
