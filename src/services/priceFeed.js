// circuit-price-feed client — free, real-time Geyser OHLCV + reserves.
// Tries the local raw service (:18941, on the coordinator host) first, then the
// PUBLIC gateway at api.circuitllm.xyz/api/price-feed (free, ~60 req/min) — so it
// works for any user, not just on the VPS. Same paths, the public base just adds
// the /api/price-feed prefix.
import { config } from '../config.js';
import { getJson } from './http.js';

const LOCAL = () => config.endpoints.priceFeed.replace(/\/$/, '');
const PUBLIC = () => config.endpoints.nodePublic.replace(/\/$/, '') + '/api/price-feed';

async function pf(path, opts) {
  let last;
  for (const base of [LOCAL(), PUBLIC()].filter(Boolean)) {
    try {
      return await getJson(base + path, opts);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

export const priceFeed = {
  health: () => pf('/health', { timeout: 4000 }),
  solPrice: () => pf('/sol-price', { timeout: 5000 }),
  prices: (mints) => pf(`/prices?mints=${[].concat(mints).slice(0, 20).join(',')}`, { timeout: 6000 }),
  price: (mint) => pf(`/price/${mint}`, { timeout: 6000 }),
  token: (mint) => pf(`/token/${mint}`, { timeout: 6000 }),
  candles: (mint, window = '1h', limit = 48) =>
    pf(`/candles/${mint}?window=${window}&limit=${limit}`, { timeout: 6000 }),
  trending: (limit = 12) => pf(`/trending?limit=${limit}`, { timeout: 10000 }),
  active: (limit = 50, minTxns = 2) => pf(`/active?limit=${limit}&minTxns=${minTxns}`, { timeout: 6000 }),
  losers: (window = '5m', limit = 30) => pf(`/losers?window=${window}&limit=${limit}`, { timeout: 6000 }),
};
