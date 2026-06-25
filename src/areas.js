// The ecosystem modules surfaced in the console. Each is a placeholder today —
// the screen, copy and "planned" list are real; the capability lands later.
import { sym } from './theme.js';

export const areas = [
  {
    id: 'chat',
    icon: sym.bolt,
    name: 'Chat',
    desc: 'Talk to the decentralized DLLM',
    long: "Open a streaming conversation with Circuit's 72B model, served across the GPU mesh and settled per-token in CIRC over x402.",
    planned: [
      'Interactive streaming REPL',
      'Model & temperature controls',
      'Per-request x402 micropayments',
      'Saved sessions & transcripts',
    ],
  },
  {
    id: 'network',
    icon: sym.circuit,
    name: 'Network',
    desc: 'Mesh status, nodes & throughput',
    long: 'A live view of the decentralized mesh — connected nodes, GPUs, tokens/sec and the route a request takes across the network.',
    planned: [
      'Live node map & health',
      'Aggregate throughput (tok/s)',
      'Per-node latency & uptime',
      'Request routing trace',
    ],
  },
  {
    id: 'swarm',
    icon: sym.diamond,
    name: 'Swarm',
    desc: 'Autonomous trading agents',
    long: 'Monitor the Circuit agent swarm — the autonomous traders building on the network — their positions, performance and signals.',
    planned: [
      'Swarm P&L & win-rate',
      'Per-agent positions',
      'Live entry / exit signals',
      'Strategy configuration',
    ],
  },
  {
    id: 'wallet',
    icon: sym.cube,
    name: 'Wallet',
    desc: 'CIRC balance & transfers',
    long: 'Manage the CIRC you use to pay for inference and data — balances, transfers and on-chain activity, all from the terminal.',
    planned: [
      'SOL & CIRC balances',
      'Send & receive CIRC',
      'x402 spend history',
      'Hardware-wallet support',
    ],
  },
  {
    id: 'node',
    icon: sym.node,
    name: 'Node',
    desc: 'Contribute a GPU to the mesh',
    long: 'Turn any machine into a Circuit node. Attach a GPU (or CPU) to the mesh with a single command and earn from every inference you serve.',
    planned: [
      'One-command join',
      'Earnings dashboard',
      'Resource & stake controls',
      'Reputation & uptime tracking',
    ],
  },
  {
    id: 'data',
    icon: sym.stack,
    name: 'Data',
    desc: 'Query the x402 data API',
    long: "Tap Circuit's on-chain data service — prices, pools, wallets and market signals — paid per call in CIRC, no API keys.",
    planned: [
      'Token & pool lookups',
      'Wallet analytics',
      'Market overview feeds',
      'Pay-per-call x402 access',
    ],
  },
  {
    id: 'about',
    icon: sym.spark,
    name: 'About',
    desc: 'About the Circuit network',
    long: '',
    planned: [],
  },
];
