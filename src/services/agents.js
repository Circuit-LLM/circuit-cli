// Agent facade — manages ~/.circuit/agents/<name>/meta.json, dispatches to a
// driver (local | cloud), and exposes the operator-side host controls.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { config, HOME_DIR } from '../config.js';
import * as local from './drivers/local.js';
import * as cloud from './drivers/cloud.js';

const AGENTS_DIR = path.join(HOME_DIR, 'agents');
const HOST_CFG = path.join(HOME_DIR, 'host.json');
const HOST_PID = path.join(HOME_DIR, 'host.pid');

const metaP = (name) => path.join(AGENTS_DIR, name, 'meta.json');
const readMeta = (name) => { try { return JSON.parse(fs.readFileSync(metaP(name), 'utf8')); } catch { return null; } };
const writeMeta = (name, m) => { fs.mkdirSync(path.join(AGENTS_DIR, name), { recursive: true, mode: 0o700 }); fs.writeFileSync(metaP(name), JSON.stringify(m, null, 2)); };
const listNames = () => { try { return fs.readdirSync(AGENTS_DIR).filter((n) => readMeta(n)); } catch { return []; } };
const driverFor = (m) => (m.driver === 'cloud' ? cloud : local);
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };

function withMeta(name, fn) {
  const m = readMeta(name);
  if (!m) throw new Error(`no agent "${name}" — create it first`);
  return fn(m, driverFor(m));
}

export const agents = {
  exists: (name) => !!readMeta(name),
  meta: (name) => readMeta(name),

  async create(name, { driver = 'local', workload = 'agentd', config: cfg = {}, env = {}, policy, verified } = {}) {
    if (!/^[a-zA-Z0-9_-]{1,32}$/.test(name)) throw new Error('name must be 1-32 chars [a-zA-Z0-9_-]');
    if (readMeta(name)) throw new Error(`agent "${name}" already exists`);
    const meta = { name, driver, spec: { workload, config: cfg, env, ...(policy ? { policy } : {}), ...(verified ? { verified } : {}) }, createdAt: Date.now() };
    writeMeta(name, meta);
    try {
      const r = await driverFor(meta).create(name, meta);
      if (r?.id) meta.id = r.id;
      if (r?.address) meta.address = r.address;
      if (r?.id || r?.address) writeMeta(name, meta);
    } catch (e) {
      fs.rmSync(path.join(AGENTS_DIR, name), { recursive: true, force: true });
      throw e;
    }
    return meta;
  },

  start: (name) => withMeta(name, (m, d) => d.start(name, m)),
  stop: (name) => withMeta(name, (m, d) => d.stop(name, m)),
  status: (name) => withMeta(name, (m, d) => d.status(name, m)),
  logs: (name, o) => withMeta(name, (m, d) => d.logs(name, m, o)),

  async destroy(name) {
    const m = readMeta(name);
    if (!m) throw new Error(`no agent "${name}"`);
    await driverFor(m).destroy(name, m).catch(() => {});
    fs.rmSync(path.join(AGENTS_DIR, name), { recursive: true, force: true });
  },

  async list() {
    const out = [];
    for (const n of listNames()) {
      const m = readMeta(n);
      let s = {};
      try { s = await driverFor(m).status(n, m); } catch { s = { state: 'unknown' }; }
      out.push({ name: n, driver: m.driver, workload: m.spec?.workload, ...s });
    }
    return out;
  },

  // ── operator side: contribute capacity by running a node-host ──
  host: {
    status() {
      let pid = null;
      try { pid = Number(fs.readFileSync(HOST_PID, 'utf8')); } catch {}
      const up = pid && alive(pid);
      let budget = {};
      try { budget = JSON.parse(fs.readFileSync(HOST_CFG, 'utf8')); } catch {}
      return { running: !!up, pid: up ? pid : null, budget };
    },
    start(budget) {
      const st = agents.host.status();
      if (st.running) return st;
      fs.mkdirSync(HOME_DIR, { recursive: true });
      fs.writeFileSync(HOST_CFG, JSON.stringify(budget, null, 2));
      const hostScript = path.join(config.agentCloudDir, 'node-host', 'host.js');
      if (!fs.existsSync(hostScript)) throw new Error(`node-host not found at ${hostScript} (set CIRCUIT_AGENT_CLOUD_DIR)`);
      const out = fs.openSync(path.join(HOME_DIR, 'host.log'), 'a');
      const env = {
        ...process.env,
        CONTROL_PLANE: config.endpoints.controlPlane,
        NODE_ID: budget.nodeId || `node-${os.hostname()}`,
        MAX_AGENTS: String(budget.maxAgents ?? 5),
        MAX_MEMORY_MB: String(budget.maxMemoryMb ?? 512),
        CIRCUIT_AGENT_DIR: config.circuitAgentDir,
      };
      const child = spawn(process.execPath, [hostScript], { detached: true, stdio: ['ignore', out, out], env });
      fs.writeFileSync(HOST_PID, String(child.pid));
      child.unref();
      return { running: true, pid: child.pid, budget };
    },
    stop() {
      const st = agents.host.status();
      if (st.pid) { try { process.kill(st.pid, 'SIGTERM'); } catch {} }
      try { fs.unlinkSync(HOST_PID); } catch {}
      return { running: false };
    },
  },
};
