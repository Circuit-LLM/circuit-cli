import {
  c, palette, sym, clearScreen, slimHeader, panel, heading, kv, table, brailleChart,
  spinner, menuSelect, askText, cols,
} from '../ui/index.js';
import { screenFrame } from '../core/render.js';
import { priceFeed } from '../services/priceFeed.js';
import { money, pct, shortMint, num } from '../util/format.js';

const WSOL = 'So11111111111111111111111111111111111111112';

async function showTrending(ctx, standalone) {
  await screenFrame({ status: ctx.status, standalone, footer: 'press any key to go back' }, async () => {
    const sp = spinner('Loading trending tokens…');
    let data;
    try {
      data = await priceFeed.trending(12);
      sp.success('Trending');
    } catch (e) {
      sp.error(`Trending unavailable: ${e.message}`);
      return;
    }
    console.log('');
    console.log(heading('Trending', sym.diamond));
    console.log('');
    const rows = (data.tokens || [])
      .filter((t) => t.mint !== WSOL) // wrapped SOL is the quote asset, not a trending token
      .slice(0, 12)
      .map((t, i) => ({
        n: String(i + 1),
        tok: shortMint(t.mint),
        price: t.priceUsd != null ? money(t.priceUsd) : c.dim('—'),
        src: t.source || c.dim('—'),
      }));
    if (!rows.length) {
      console.log(c.muted('  No trending tokens right now.'));
      return;
    }
    console.log(
      table(rows, [
        { key: 'n', label: '#' },
        { key: 'tok', label: 'TOKEN' },
        { key: 'price', label: 'PRICE', align: 'right' },
        { key: 'src', label: 'SOURCE' },
      ]),
    );
  });
}

async function showDips(ctx, standalone) {
  await screenFrame({ status: ctx.status, standalone, footer: 'press any key to go back' }, async () => {
    const sp = spinner('Scanning for dips…');
    let data;
    try {
      data = await priceFeed.losers('5m', 20);
      sp.success('Dip scanner (5m)');
    } catch (e) {
      sp.error(`Dip feed unavailable: ${e.message}`);
      return;
    }
    console.log('');
    console.log(heading('Dipping now (5m)', sym.arrow));
    console.log('');
    const list = data.movers || data.losers || [];
    const rows = list.slice(0, 15).map((m) => ({
      tok: m.symbol && m.symbol !== '?' ? m.symbol : shortMint(m.mint),
      chg: pct(m.changePct),
    }));
    console.log(
      table(rows, [
        { key: 'tok', label: 'TOKEN' },
        { key: 'chg', label: '5m', align: 'right', color: () => c.err },
      ]),
    );
  });
}

async function showToken(ctx, mint, standalone) {
  mint = String(mint || '').trim();
  await screenFrame({ status: ctx.status, standalone, footer: 'press any key to go back' }, async () => {
    const sp = spinner(`Fetching ${shortMint(mint)}…`);
    let pr;
    let candles = [];
    try {
      const p = await priceFeed.prices([mint]);
      pr = (p.results || p)[mint];
      const cd = await priceFeed.candles(mint, '1h', 48).catch(() => ({ candles: [] }));
      candles = cd.candles || [];
      sp.success('Loaded');
    } catch (e) {
      sp.error(`Lookup failed: ${e.message}`);
      return;
    }
    if (!pr || !(pr.priceUsd > 0)) {
      console.log(`\n  ${c.warn('No price data for that mint (not indexed, or not a SOL/CIRC-paired token).')}`);
      return;
    }
    const liq = pr.solReserve && pr.solUsd ? pr.solReserve * pr.solUsd * 2 : null;
    const closes = candles.map((k) => k.c).filter((v) => isFinite(v));
    const chg = closes.length > 1 ? ((closes.at(-1) - closes[0]) / closes[0]) * 100 : null;
    const chgC = chg == null ? c.dim('—') : chg >= 0 ? c.ok(pct(chg)) : c.err(pct(chg));
    console.log('');
    const body = [
      heading(shortMint(mint, 6, 6), sym.stack),
      '',
      kv('Price', c.text(money(pr.priceUsd))),
      kv('Liquidity', liq != null ? c.text(money(liq)) : c.dim('—')),
      kv('Change', chgC + c.dim('  (last 48h)')),
      kv('Source', c.muted(pr.source || '—')),
    ].join('\n');
    console.log(panel(body, { title: 'TOKEN' }));
    if (closes.length > 2) {
      console.log('');
      console.log(c.dim(`  1h candles · last ${closes.length}`));
      for (const line of brailleChart(closes, { width: Math.min(64, cols() - 12), height: 10 })) {
        console.log('  ' + line);
      }
    }
  });
}

export default {
  id: 'data',
  icon: sym.stack,
  name: 'Data',
  desc: 'On-chain market data',
  async screen(ctx, opts = {}) {
    if (opts.standalone) return showTrending(ctx, true);
    for (;;) {
      clearScreen();
      slimHeader(ctx.status);
      const choice = await menuSelect(c.text('Data — pick a view'), [
        { value: 'trending', label: `${sym.diamond}  Trending`, hint: 'most active tokens, priced' },
        { value: 'dips', label: `${sym.arrow}  Dip scanner`, hint: 'tokens pulling back now' },
        { value: 'lookup', label: `${sym.stack}  Look up a token`, hint: 'price, liquidity, chart' },
        { value: 'back', label: `${sym.chevron}  Back`, hint: 'return to the main menu' },
      ]);
      if (choice === 'back') return;
      if (choice === 'trending') await showTrending(ctx);
      else if (choice === 'dips') await showDips(ctx);
      else if (choice === 'lookup') {
        const mint = await askText('Token mint address', { placeholder: 'e.g. 8fQgfsRnRkKSe…pump' });
        if (mint) await showToken(ctx, mint);
      }
    }
  },
  register(cmd, ctx) {
    cmd.command('trending').description('trending tokens').action(() => showTrending(ctx, true));
    cmd.command('dips').description('tokens dipping now (5m)').action(() => showDips(ctx, true));
    cmd
      .command('token <mint>')
      .description('price, liquidity & chart for a token')
      .action((mint) => showToken(ctx, mint, true));
  },
};
