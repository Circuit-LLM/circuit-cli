// services/bundle.js — publish an agent as a content-addressed, signed bundle (AGENT_BUNDLES.md §2-3).
//
// The format MUST stay byte-identical to circuit-agent-cloud/lib/bundle.js, or a node/control-plane
// will reject what we publish: same canonical manifest signing bytes, same Ed25519 over them, same
// base58, same sha256 of the tarball. (Cross-repo consistency is locked by a test.)
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import bs58 from 'bs58';
import { loadKeypair } from './solana.js';

export const BUNDLE_SCHEMA = 1;

// Ed25519 PKCS8 framing (RFC 8410) — reconstruct a signing key from a Solana keypair's 32-byte seed.
const PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');

export function manifestSigningBytes(m) {
  const canon = {
    agentId: m.agentId,
    entry: m.entry,
    runtime: m.runtime,
    schema: BUNDLE_SCHEMA,
    sdk: m.sdk ?? null,
    sha256: m.sha256,
  };
  return Buffer.from(JSON.stringify(canon));
}

function signWithSeed(seed32, msg) {
  const priv = crypto.createPrivateKey({ key: Buffer.concat([PKCS8_PREFIX, Buffer.from(seed32)]), format: 'der', type: 'pkcs8' });
  return crypto.sign(null, Buffer.from(msg), priv); // null algo == Ed25519
}

const sha256hex = (b) => crypto.createHash('sha256').update(b).digest('hex');

function packDir(dir) {
  const tmp = path.join(os.tmpdir(), `cbundle-${crypto.randomBytes(6).toString('hex')}.tgz`);
  try {
    execFileSync('tar', ['--sort=name', '--owner=0', '--group=0', '--numeric-owner', '--mtime=@0',
      '-czf', tmp, '-C', dir, '.'], { stdio: 'pipe' });
    return fs.readFileSync(tmp);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

// The local content-addressed store (B1 own-fleet backend). On a shared fs the node reads it directly;
// a real deployment swaps in object storage / a CDN behind the same {sha}.tgz / {sha}.manifest.json shape.
export function storeRoot() {
  return process.env.CIRCUIT_BUNDLE_STORE || path.join(os.homedir(), '.circuit', 'bundles');
}

/**
 * Build + sign + store a bundle from a source directory.
 * @returns {{ ref, url, sha256, runtime, manifest }} the bundle block to attach to an agent spec.
 */
export function publishDir({ dir, agentId, entry = 'agent.js', sdk = null, runtime = 'node' }) {
  if (runtime !== 'node') throw new Error(`publish supports runtime 'node' only (got '${runtime}')`);
  if (!fs.existsSync(path.join(dir, entry))) throw new Error(`entry '${entry}' not found in ${dir}`);
  const kp = loadKeypair();
  if (!kp) throw new Error('no wallet — set a Circuit wallet to publish (the publisher must be the agent owner)');

  const bytes = packDir(dir);
  const sha256 = sha256hex(bytes);
  const manifest = {
    schema: BUNDLE_SCHEMA, agentId, runtime, entry, sdk, sha256,
    publisherPubkey: kp.publicKey.toBase58(),
  };
  manifest.sig = bs58.encode(signWithSeed(kp.secretKey.slice(0, 32), manifestSigningBytes(manifest)));

  const root = storeRoot();
  fs.mkdirSync(root, { recursive: true });
  const tgz = path.join(root, `${sha256}.tgz`);
  fs.writeFileSync(tgz, bytes);
  fs.writeFileSync(path.join(root, `${sha256}.manifest.json`), JSON.stringify(manifest));
  return { ref: `bundle://${sha256}`, url: tgz, sha256, runtime, manifest };
}
