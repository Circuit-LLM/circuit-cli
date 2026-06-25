# circuit-cli

> The command line for the **Circuit LLM** decentralized intelligence network.

```
 ██████╗██╗██████╗  ██████╗██╗   ██╗██╗████████╗
██╔════╝██║██╔══██╗██╔════╝██║   ██║██║╚══██╔══╝
██║     ██║██████╔╝██║     ██║   ██║██║   ██║
██║     ██║██╔══██╗██║     ██║   ██║██║   ██║
╚██████╗██║██║  ██║╚██████╗╚██████╔╝██║   ██║
 ╚═════╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝   ╚═╝
        L L M  ·  decentralized intelligence
```

A fast, beautiful terminal console for the Circuit ecosystem — chat with the
decentralized 72B, manage the CIRC that pays for it, watch the mesh and the
agent swarm, query on-chain data, and contribute a GPU, all from one place.

## Install

```bash
git clone https://github.com/Circuit-LLM/circuit-cli.git
cd circuit-cli
npm install
npm link        # optional — exposes the `circuit` command globally
```

Requires Node.js ≥ 18.

## Usage

```bash
circuit                       # interactive console (splash + menu)
circuit chat "explain x402"   # one-shot chat (streams), or pipe stdin
circuit data trending         # live trending tokens
circuit data token <mint>     # price + braille candle chart
circuit swarm                 # the agent swarm at a glance
circuit network               # Solana + DLLM mesh health
circuit status doctor         # connectivity check to every service
circuit node join             # the one-line GPU onboarding command
circuit --help
```

## Modules

| Module    | What it does                                   | Status |
| --------- | ---------------------------------------------- | ------ |
| `chat`    | Stream the decentralized 72B, paid in CIRC     | live   |
| `wallet`  | SOL + CIRC balances, send, swap (Jupiter)      | live   |
| `data`    | Token price/liquidity, trending, dips, charts  | live   |
| `swarm`   | Autonomous trading agents — stats & signals    | live   |
| `network` | Solana TPS + inference gateway health          | live   |
| `node`    | One-command GPU onboarding to the mesh          | live   |
| `status`  | One-glance dashboard + `doctor` health check   | live   |
| `about`   | About the Circuit network                       | live   |

## Chat & payments

Chat runs inference through the Circuit gateway and pays **CIRC via x402**
(~$0.03 / request). Load a signing wallet to enable it:

```bash
export CIRCUIT_WALLET=<base58-secret-key>   # or place a keypair at ~/.circuit/id.json
```

No secret is ever printed or logged. Transfers, swaps and paid chat always show
what will happen before they run.

## Architecture

Three layers, one rule — `services` talk, `ui` draws, `modules` glue:

```
src/
  index.js  config.js
  core/      context · registry · menu · splash · render
  services/  http · solana · wallet · x402 · inference · priceFeed · circuitNode · node
  ui/        banner · layout · components · screen · chart · prompts
  modules/   chat · wallet · data · swarm · network · node · status · about
  util/      format
```

Adding a feature = one `services` method + one `modules` screen + a line in
`core/registry.js`. See [SPEC.md](SPEC.md) for the full design.

## License

MIT © Circuit LLM
