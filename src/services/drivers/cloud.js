// Cloud driver — drives an agent through the Control Plane API.
import { config } from '../../config.js';

const base = () => config.endpoints.controlPlane.replace(/\/$/, '');

async function api(method, p, body) {
  const r = await fetch(base() + p, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.CIRCUIT_CLOUD_KEY ? { Authorization: `Bearer ${process.env.CIRCUIT_CLOUD_KEY}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(`control plane ${r.status}: ${e.error ?? ''}`.trim());
  }
  return r.json();
}

const map = (a) => ({
  state: a.state, node: a.nodeId, health: a.health, id: a.id,
  address: a.address, policy: a.policy, custody: a.custody, paper: a.paper,
  verified: a.verified,
});

export async function create(name, meta) {
  const { agent } = await api('POST', '/v1/agents', {
    name,
    spec: meta.spec,
    policy: meta.spec?.policy,
    ...(meta.spec?.verified ? { verified: meta.spec.verified } : {}),
  });
  return { id: agent.id, address: agent.address };
}

export async function start(_name, meta) {
  const { agent } = await api('POST', `/v1/agents/${meta.id}/start`);
  return map(agent);
}
export async function stop(_name, meta) {
  const { agent } = await api('POST', `/v1/agents/${meta.id}/stop`);
  return map(agent);
}
export async function status(_name, meta) {
  const { agent } = await api('GET', `/v1/agents/${meta.id}`);
  return map(agent);
}
export async function logs(_name, meta, { tail = 20 } = {}) {
  const { lines } = await api('GET', `/v1/agents/${meta.id}/logs`);
  return (lines || []).slice(-tail);
}
export async function destroy(_name, meta) {
  await api('DELETE', `/v1/agents/${meta.id}`);
}
