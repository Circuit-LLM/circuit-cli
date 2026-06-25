// Static configuration for the Circuit CLI. Endpoints point at the live
// Circuit ecosystem; nothing here is secret. Capabilities are wired up later.

export const config = {
  name: 'circuit',
  version: '0.1.0',
  web: 'circuitllm.xyz',
  model: 'Qwen2.5-72B · decentralized',
  endpoints: {
    health: 'https://circuitllm.xyz',
    inference: 'https://inference.circuitllm.xyz',
    node: 'https://node.circuitllm.xyz',
    data: 'https://api.circuitllm.xyz',
  },
  links: {
    web: 'https://circuitllm.xyz',
    docs: 'https://circuitllm.xyz/docs',
  },
};
