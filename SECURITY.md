# Security

circuit-cli holds a real Solana wallet, signs transactions, and spends real CIRC on inference. Security matters.

---

## Private Key Safety

The CLI loads a signing keypair from one of two places, in order:

1. **`CIRCUIT_WALLET`** — a base58 secret key in the environment. Nothing is written to disk.
2. **`~/.circuit/id.json`** — a standard Solana keypair file, written **owner-only (`0600`)** in a **`0700`** directory.

Rules the CLI follows:

- **Your secret is never printed or logged.** Balances, charts, and other reads only ever touch your public address.
- `circuit wallet generate` offers a **one-time** secret reveal so you can back the key up — it is shown once, on your screen, never written elsewhere.
- The keyfile is unencrypted at rest (same as `solana-keygen`). An encrypted keystore is a planned enhancement. Until then, treat `~/.circuit/id.json` like any other private key.
- Never paste your secret key into an issue, a chat, or a screen recording.

### Recommended: keep the key out of plaintext

For servers and shared machines, inject the key at runtime instead of leaving it on disk — e.g. with [Infisical](https://infisical.com):

```bash
CIRCUIT_WALLET="$(infisical secrets get CIRCUIT_WALLET --plain)" circuit chat "..."
```

If you believe your key has been exposed:

1. Move all funds to a new wallet immediately.
2. Generate a fresh one: `circuit wallet generate`.
3. Remove the old keyfile: `rm ~/.circuit/id.json`.

---

## What Has Access to Your Wallet

| Component | Can sign transactions? |
|-----------|------------------------|
| `services/wallet.js` | Yes — transfers and Jupiter swaps |
| `services/inference.js` (chat) | Yes — pays CIRC to the treasury via x402 |
| Balance / chart / data reads | No — public-key reads only |
| `services/circuitNode.js`, `priceFeed.js` | No — public HTTP reads |

Every **write** action — `send`, `swap`, and paid `chat` — shows exactly what will happen and the amount before it runs. There is no silent spend.

---

## Payments (x402)

Chat settles in CIRC over x402: the gateway returns `402` with a payment requirement, the CLI transfers the named amount of CIRC to the treasury, then retries with the transaction signature. The amount and the payment tx are always surfaced in the cost meter. The CLI only ever pays the amount and recipient the gateway specifies in the `402` response.

---

## RPC & Endpoints

- `CIRCUIT_RPC_URL` (or `rpcUrl` in config) sets the Solana RPC. Reads and transactions go through it; on a rate-limit or stall the CLI falls back to public RPCs.
- Inference, data, and swarm endpoints are plain HTTPS to the Circuit network. No API keys are required or stored.

Keep `CIRCUIT_WALLET` and any private RPC URLs out of logs and issue reports.

---

## Reporting Vulnerabilities

If you find a security issue — especially anything involving wallet access, key exposure, or payment manipulation — please report it privately:

- **Telegram DM:** [@circuitdev](https://t.me/circuitdev)

Please do not open a public GitHub issue for security vulnerabilities. Give us a chance to patch before disclosure. Include a description, steps to reproduce, potential impact, and a suggested fix if you have one. We aim to respond within 48 hours and credit valid reports.

---

## Disclaimer

circuit-cli moves real funds and spends real CIRC. You are responsible for safeguarding your key, funding the wallet with an amount you can afford to lose, reviewing each transaction before confirming, and complying with local laws. This software is provided as-is under the MIT license with no warranty. See [LICENSE](LICENSE).
