// circuit-node client (:18940) — Solana network stats, the swarm registry,
// and the trending feed. Public mirrors land behind api.circuitllm.xyz over time.
import { config } from '../config.js';
import { getJson } from './http.js';

const base = () => config.endpoints.node.replace(/\/$/, '');

export const circuitNode = {
  network: () => getJson(`${base()}/api/network`, { timeout: 6000 }),
  trending: (limit = 8) => getJson(`${base()}/api/trending?limit=${limit}`, { timeout: 30000 }),
  dexLosers: (window = '5m', limit = 30) =>
    getJson(`${base()}/api/dex/losers?window=${window}&limit=${limit}`, { timeout: 8000 }),

  swarmStats: () => getJson(`${base()}/api/swarm/stats`, { timeout: 6000 }),
  swarmLeaderboard: () => getJson(`${base()}/api/swarm/leaderboard`, { timeout: 6000 }),
  swarmFeed: (limit = 50) => getJson(`${base()}/api/swarm/feed?limit=${limit}`, { timeout: 6000 }),
  swarmHoldings: () => getJson(`${base()}/api/swarm/holdings`, { timeout: 6000 }),
};
