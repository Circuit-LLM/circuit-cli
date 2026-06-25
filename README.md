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
decentralized DLLM, watch the mesh, run the agent swarm, manage CIRC, and
contribute a GPU, all from one place.

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
circuit            # open the interactive console
circuit chat       # jump straight to a module
circuit network
circuit --help
circuit --version
```

Run with no arguments for the full experience: an animated splash, a live mesh
status check, and a keyboard-driven menu across every part of the network.

## Modules

| Module    | What it does                              | Status      |
| --------- | ----------------------------------------- | ----------- |
| `chat`    | Talk to the decentralized DLLM (72B)      | coming soon |
| `network` | Mesh status, nodes & throughput           | coming soon |
| `swarm`   | Autonomous trading agents                 | coming soon |
| `wallet`  | CIRC balance & transfers                  | coming soon |
| `node`    | Contribute a GPU to the mesh              | coming soon |
| `data`    | Query the x402 data API                   | coming soon |
| `about`   | About the Circuit network                 | live        |

## Status

This is the **skeleton** release. The experience and design system are in
place; capabilities are being wired up module by module.

## License

MIT © Circuit LLM
