// circuit-price-feed client (:18941) — real-time Geyser OHLCV + reserves.
import { config } from '../config.js';
import { getJson } from './http.js';

const base = () => config.endpoints.priceFeed.replace(/\/$/, '');

export const priceFeed = {
  health: () => getJson(`${base()}/health`, { timeout: 4000 }),
  solPrice: () => getJson(`${base()}/sol-price`, { timeout: 5000 }),
  prices: (mints) => getJson(`${base()}/prices?mints=${[].concat(mints).slice(0, 20).join(',')}`, { timeout: 6000 }),
  price: (mint) => getJson(`${base()}/price/${mint}`, { timeout: 6000 }),
  token: (mint) => getJson(`${base()}/token/${mint}`, { timeout: 6000 }),
  candles: (mint, window = '1h', limit = 48) =>
    getJson(`${base()}/candles/${mint}?window=${window}&limit=${limit}`, { timeout: 6000 }),
  active: (limit = 50, minTxns = 2) =>
    getJson(`${base()}/active?limit=${limit}&minTxns=${minTxns}`, { timeout: 6000 }),
  losers: (window = '5m', limit = 30) =>
    getJson(`${base()}/losers?window=${window}&limit=${limit}`, { timeout: 6000 }),
};
