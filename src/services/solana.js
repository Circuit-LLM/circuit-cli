// Solana primitives — connection, keypair loading, Circuit token constants.
// The keypair is optional: read paths work with just an address.
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import fs from 'node:fs';
import { config, WALLET_FILE, CIRC, SOL_MINT } from '../config.js';

export const PK = {
  circMint: new PublicKey(CIRC.mint),
  token2022: new PublicKey(CIRC.tokenProgram),
  sol: new PublicKey(SOL_MINT),
};

export function getConnection(rpcUrl = config.rpcUrl) {
  return new Connection(rpcUrl, { commitment: 'confirmed', disableRetryOnRateLimit: true });
}

// Load the signing keypair from CIRCUIT_WALLET (base58) or ~/.circuit/id.json
// (Solana byte-array format). Returns null when neither is present.
export function loadKeypair() {
  const env = process.env.CIRCUIT_WALLET;
  if (env) {
    try {
      return Keypair.fromSecretKey(bs58.decode(env.trim()));
    } catch {
      throw new Error('CIRCUIT_WALLET is set but is not a valid base58 secret key');
    }
  }
  try {
    const raw = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
    return Keypair.fromSecretKey(Uint8Array.from(raw));
  } catch {
    return null;
  }
}

export function isValidAddress(s) {
  try {
    // eslint-disable-next-line no-new
    new PublicKey(s);
    return true;
  } catch {
    return false;
  }
}

export { PublicKey, Keypair };
