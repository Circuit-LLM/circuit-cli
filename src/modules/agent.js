import fs from 'node:fs';
import {
  c, palette, sym, clearScreen, slimHeader, panel, kv, table, heading, badge,
  spinner, menuSelect, askText, askConfirm,
} from '../ui/index.js';
import { screenFrame } from '../core/render.js';
import { agents } from '../services/agents.js';
import { pct, num, timeAgo } from '../util/format.js';

// Load a verified-intent rule file (docs/verified-intents.md): JSON with { rule,
// acceptedKeys, acceptedNotaries?, evidenceMaxAgeMs? }. The signer re-runs `rule` on
// the authenticated inputs an agent submits before signing a trade.
function loadRuleFile(file) {
  let j;
  try { j = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { throw new Error(`could not read rule file ${file}: ${e.message}`); }
  if (!j.rule || !j.rule.id) throw new Error('rule file must contain { rule: { id, when, then, requires }, acceptedKeys }');
  return {
    rule: j.rule,
    acceptedKeys: j.acceptedKeys || {},
    acceptedNotaries: j.acceptedNotaries || [],
    evidenceMaxAgeMs: j.evidenceMaxAgeMs,
  };
}

const stateColor = {
  running: c.ok, scheduled: c.warn, pending: c.warn, stopping: c.warn,
  stopped: c.dim, failed: c.err, unknown: c.dim,
};
const sc = (s) => (stateColor[s] || c.text)(s || '—');

function pnlOf(a) {
  const p = a.health?.pnlPct;
  if (p == null) return c.dim('—');
  return p >= 0 ? c.ok(pct(p)) : c.err(pct(p));
}

async function renderList(ctx, standalone) {
  await screenFrame({ status: ctx.status, standalone, footer: 'press any key to go back' }, async () => {
    const sp = spinner('Loading agents…');
    let list;
    try { list = await agents.list(); sp.success('Agents'); } catch (e) { sp.error(e.message); return; }
    console.log('');
    console.log(heading('Agents', sym.diamond));
    console.log('');
    if (!list.length) {
      console.log(c.muted('  No agents yet.  Create one:  ') + c.accent('circuit agent create <name>'));
    } else {
      const rows = list.map((a) => ({
        name: a.name,
        where: a.driver === 'cloud' ? a.node || c.dim('scheduling') : 'local',
        state: sc(a.state),
        pnl: pnlOf(a),
        scans: a.health?.scans != null ? num(a.health.scans, 0) : '—',
      }));
      console.log(table(rows, [
        { key: 'name', label: 'AGENT' },
        { key: 'where', label: 'WHERE' },
        { key: 'state', label: 'STATE' },
        { key: 'pnl', label: 'P&L', align: 'right' },
        { key: 'scans', label: 'SCANS', align: 'right' },
      ]));
    }
    const h = agents.host.status();
    console.log('');
    console.log(
      h.running
        ? `  ${badge('hosting', 'ok')} ${c.muted(`contributing up to ${h.budget.maxAgents ?? '?'} agents as ${h.budget.nodeId || 'this node'}`)}`
        : c.dim('  not contributing capacity — `circuit agent host` to lend CPU to the cloud'),
    );
  });
}

async function showStatus(ctx, name, standalone) {
  await screenFrame({ status: ctx.status, standalone, footer: 'press any key to go back' }, async () => {
    const sp = spinner(`Reading ${name}…`);
    let s;
    let meta;
    try { meta = agents.meta(name); s = await agents.status(name); sp.success(name); } catch (e) { sp.error(e.message); return; }
    const h = s.health || {};
    const pol = s.policy;
    console.log('');
    console.log(panel([
      heading(name, sym.diamond),
      '',
      kv('Driver', c.text(meta.driver)),
      kv('Workload', c.text(meta.spec?.workload || 'agentd')),
      kv('State', sc(s.state)),
      kv('Where', c.text(s.node || (meta.driver === 'cloud' ? 'scheduling' : 'local'))),
      kv('Custody', s.custody === 'offbox-signer' ? c.text('off-box signer') + c.dim(' (key off-host)') : c.dim('local (this machine)')),
      s.address ? kv('Wallet', c.accent(s.address)) : null,
      pol ? kv('Limits', c.text(`${pol.maxNotionalSol} SOL/trade · ${pol.maxDailySol} SOL/day`) + '  ' + (pol.paper ? c.dim('paper') : c.warn('LIVE'))) : null,
      kv('P&L', pnlOf(s)),
      kv('Scans', h.scans != null ? c.text(num(h.scans, 0)) : c.dim('—')),
      h.signedTrades != null ? kv('Signed', c.text(num(h.signedTrades, 0))) : null,
      kv('Uptime', h.uptimeS != null ? c.text(`${h.uptimeS}s`) : c.dim('—')),
      kv('Updated', h.ts ? c.muted(timeAgo(h.ts) + ' ago') : c.dim('—')),
    ].filter(Boolean).join('\n'), { title: 'AGENT' }));
  });
}

async function showLogs(ctx, name, tail, standalone) {
  await screenFrame({ status: ctx.status, standalone, footer: 'press any key to go back' }, async () => {
    let lines;
    try { lines = await agents.logs(name, { tail }); } catch (e) { console.log('  ' + c.err(e.message)); return; }
    console.log('');
    console.log(heading(`${name} · logs`, sym.arrow));
    console.log('');
    if (!lines.length) console.log(c.dim('  (no logs yet)'));
    for (const l of lines) console.log('  ' + c.muted(l.line));
  });
}

// ── operator: contribute capacity ──
function hostStartFlow(maxAgents) {
  const r = agents.host.start({ maxAgents: Number(maxAgents) || 5, maxMemoryMb: 512 });
  return r;
}

export default {
  id: 'agent',
  icon: sym.diamond,
  name: 'Agents',
  desc: 'Launch & host autonomous agents',

  async screen(ctx, opts = {}) {
    if (opts.standalone) return renderList(ctx, true);
    for (;;) {
      clearScreen();
      slimHeader(ctx.status);
      const choice = await menuSelect(c.text('Agents'), [
        { value: 'list', label: `${sym.diamond}  View agents`, hint: 'status + P&L' },
        { value: 'create', label: `${sym.spark}  Create an agent`, hint: 'local or cloud' },
        { value: 'start', label: `${sym.arrow}  Start an agent` },
        { value: 'stop', label: `${sym.cross}  Stop an agent` },
        { value: 'host', label: `${sym.node}  Contribute capacity`, hint: 'lend CPU to the cloud' },
        { value: 'back', label: `${sym.chevron}  Back` },
      ]);
      if (choice === 'back') return;
      if (choice === 'list') await renderList(ctx);
      else if (choice === 'create') {
        const name = await askText('Agent name', { placeholder: 'e.g. alpha' });
        if (!name) continue;
        const where = await menuSelect(c.text('Run it where?'), [
          { value: 'local', label: 'Local (this machine)' },
          { value: 'cloud', label: 'Cloud (the Circuit mesh)' },
        ]);
        await screenFrame({ status: ctx.status, footer: 'press any key to continue' }, async () => {
          const sp = spinner('Creating…');
          try {
            await agents.create(name.trim(), { driver: where, config: { scanIntervalMs: 5000, paperTrading: true } });
            await agents.start(name.trim());
            sp.success(`Created + started "${name.trim()}" (${where})`);
          } catch (e) { sp.error(e.message); }
        });
      } else if (choice === 'start' || choice === 'stop') {
        const list = await agents.list();
        if (!list.length) { await renderList(ctx); continue; }
        const pick = await menuSelect(c.text(`${choice} which agent?`), list.map((a) => ({ value: a.name, label: `${a.name}  ${c.dim(a.state)}` })));
        await screenFrame({ status: ctx.status, footer: 'press any key to continue' }, async () => {
          const sp = spinner(`${choice}…`);
          try { await agents[choice](pick); sp.success(`${pick} ${choice === 'start' ? 'started' : 'stopped'}`); } catch (e) { sp.error(e.message); }
        });
      } else if (choice === 'host') {
        const st = agents.host.status();
        if (st.running) {
          const off = await askConfirm(`Hosting is on (${st.budget.maxAgents} agents). Stop contributing?`, { initialValue: false });
          if (off) agents.host.stop();
        } else {
          const n = await askText('Max agents to host', { placeholder: '5', defaultValue: '5' });
          await screenFrame({ status: ctx.status, footer: 'press any key to continue' }, () => {
            try { const r = hostStartFlow(n); console.log('  ' + c.ok(sym.check) + c.text(` contributing up to ${r.budget.maxAgents} agents`)); }
            catch (e) { console.log('  ' + c.err(e.message)); }
          });
        }
      }
    }
  },

  register(cmd, ctx) {
    cmd
      .command('create <name>')
      .description('create an agent (default local; --cloud to host on the mesh)')
      .option('--cloud', 'run on the Circuit cloud')
      .option('--workload <w>', 'agentd | circuit-agent', 'agentd')
      .option('--interval <ms>', 'scan interval', (v) => parseInt(v, 10))
      .option('--strategy <s>', 'strategy label', 'dip-reversal')
      .option('--max-trade <sol>', 'custody: max SOL per trade', parseFloat, 0.05)
      .option('--max-daily <sol>', 'custody: max SOL per day', parseFloat, 0.5)
      .option('--cooldown <ms>', 'custody: min ms between trades', (v) => parseInt(v, 10), 30000)
      .option('--rule <file>', 'verified-intent rule file (JSON) — signer re-derives every trade')
      .option('--require-verified', 'reject any trade the rule + authenticated inputs don\'t justify')
      .option('--live', 'trade real funds (default: paper)')
      .action(async (name, o) => {
        const sp = spinner('Creating agent…');
        try {
          let verified;
          if (o.rule) {
            verified = loadRuleFile(o.rule);
            if (!o.cloud) sp.warn?.('--rule binds at the off-box signer; it has full effect with --cloud');
          }
          const policy = o.cloud
            ? { maxNotionalSol: o.maxTrade, maxDailySol: o.maxDaily, cooldownMs: o.cooldown, paper: !o.live,
                ...(o.requireVerified ? { requireVerifiedIntent: true } : {}) }
            : undefined;
          const m = await agents.create(name, {
            driver: o.cloud ? 'cloud' : 'local',
            workload: o.workload,
            config: { scanIntervalMs: o.interval || 5000, strategy: o.strategy, paperTrading: !o.live, tradeSizeSol: Math.min(0.01, o.maxTrade) },
            policy,
            verified,
          });
          sp.success(`Created "${name}" (${m.driver}${m.id ? ' · ' + m.id : ''})`);
          if (m.address) {
            console.log('  ' + c.muted('custody ') + c.text('off-box signer') + c.dim(' — the signing key never touches the host'));
            console.log('  ' + c.muted('wallet  ') + c.accent(m.address));
            if (verified) console.log('  ' + c.muted('rule    ') + c.text(verified.rule.id) + c.dim(o.requireVerified ? '   (required — forged trades rejected)' : '   (advisory)'));
            console.log('  ' + c.dim(`fund it, then:  circuit agent start ${name}`) + (o.live ? c.warn('   LIVE — real funds') : c.dim('   (paper)')));
          } else {
            console.log(c.dim(`  start it:  circuit agent start ${name}`));
          }
        } catch (e) { sp.error(e.message); }
      });

    cmd.command('start <name>').description('start an agent').action(async (name) => {
      const sp = spinner(`Starting ${name}…`);
      try { const r = await agents.start(name); sp.success(`Started ${name}`); console.log(c.dim(`  ${r.node ? 'scheduling on the mesh' : 'pid ' + r.pid}`)); } catch (e) { sp.error(e.message); }
    });
    cmd.command('stop <name>').description('stop an agent').action(async (name) => {
      const sp = spinner(`Stopping ${name}…`);
      try { await agents.stop(name); sp.success(`Stopped ${name}`); } catch (e) { sp.error(e.message); }
    });
    cmd.command('destroy <name>').description('stop and delete an agent').option('-y, --yes', 'skip confirmation').action(async (name, o) => {
      if (!o.yes) {
        if (!process.stdin.isTTY) { console.log(c.warn('  refusing to destroy without --yes (non-interactive)')); return; }
        const ok = await askConfirm(`Destroy "${name}"? This stops it and deletes its record.`, { initialValue: false });
        if (!ok) return;
      }
      const sp = spinner(`Destroying ${name}…`);
      try { await agents.destroy(name); sp.success(`Destroyed ${name}`); } catch (e) { sp.error(e.message); }
    });
    cmd.command('list').description('list agents').action(() => renderList(ctx, true));
    cmd.command('status <name>').description('agent status + P&L').action((name) => showStatus(ctx, name, true));
    cmd
      .command('verify <name>')
      .description('show the verified-intent contract (committed rule + trusted producer keys)')
      .action(async (name) => {
        const sp = spinner('Fetching…');
        try {
          const s = await agents.status(name);
          sp.stop?.();
          const v = s.verified;
          if (!v || !v.rule) {
            console.log(c.dim('  no committed rule — trades rely on policy caps + deterrence (see docs/verified-intents.md).'));
            console.log(c.dim('  add one at create:  circuit agent create <name> --cloud --rule rule.json --require-verified'));
            return;
          }
          const cond = (v.rule.when || []).map((w) => `${w.input} ${w.op} ${w.value}`).join('  AND  ') || '—';
          const then = `${v.rule.then?.kind ?? '?'} ${v.rule.then?.token ?? v.rule.then?.tokenInput ?? ''}`.trim();
          console.log('  ' + c.muted('rule       ') + c.text(v.rule.id));
          console.log('  ' + c.muted('enforced   ') + (s.policy?.requireVerifiedIntent ? c.ok('yes — the signer rejects any trade this rule doesn\'t justify') : c.warn('advisory (set --require-verified to enforce)')));
          console.log('  ' + c.muted('when       ') + c.text(cond));
          console.log('  ' + c.muted('then       ') + c.text(then));
          console.log('  ' + c.muted('requires   ') + c.text((v.rule.requires || []).join(', ') || '—') + c.dim('  (inputs that must be backed by evidence)'));
          console.log('  ' + c.muted('trusts     ') + c.text(`${Object.keys(v.acceptedKeys || {}).length} producer key(s)`) + (v.acceptedNotaries?.length ? c.text(` + ${v.acceptedNotaries.length} notary`) : ''));
        } catch (e) { sp.error(e.message); }
      });
    cmd.command('logs <name>').description('recent agent logs').option('--tail <n>', 'lines', (v) => parseInt(v, 10), 25).action((name, o) => showLogs(ctx, name, o.tail, true));

    cmd
      .command('host')
      .description('contribute CPU capacity to the agent cloud (operator)')
      .option('--max-agents <n>', 'max agents to host', (v) => parseInt(v, 10), 5)
      .option('--node-id <id>', 'node identifier')
      .option('--max-memory <mb>', 'per-agent memory cap', (v) => parseInt(v, 10), 512)
      .option('--status', 'show hosting status')
      .option('--off', 'stop contributing')
      .action((o) => {
        if (o.off) { agents.host.stop(); console.log(c.muted('  stopped contributing.')); return; }
        const st = agents.host.status();
        if (o.status) {
          console.log(st.running ? `  ${c.ok(sym.dot)} hosting · ${st.budget.maxAgents} agents · pid ${st.pid}` : c.dim('  not contributing'));
          return;
        }
        if (st.running) { console.log(c.muted(`  already hosting (${st.budget.maxAgents} agents). --off to stop.`)); return; }
        try {
          const r = agents.host.start({ maxAgents: o.maxAgents, nodeId: o.nodeId, maxMemoryMb: o.maxMemory });
          console.log(`  ${c.ok(sym.check)} contributing up to ${c.text(r.budget.maxAgents)} agents to the cloud  ${c.dim('(pid ' + r.pid + ')')}`);
        } catch (e) { console.log('  ' + c.err(e.message)); }
      });
  },
};
