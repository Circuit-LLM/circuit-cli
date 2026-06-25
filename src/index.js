// Top-level dispatch. No args → the interactive console. A subcommand →
// jump straight to that module (and a clean `--help` / `--version`).
import { Command } from 'commander';
import { config } from './config.js';
import { areas } from './areas.js';
import { runInteractive } from './app.js';
import { areaScreen } from './screens.js';

export async function run() {
  // Bare `circuit` launches the interactive experience.
  if (process.argv.length <= 2) {
    await runInteractive();
    return;
  }

  const program = new Command();
  program
    .name('circuit')
    .description('Circuit LLM — the command line for the decentralized intelligence network')
    .version(config.version, '-v, --version', 'output the version');

  program.command('menu').description('open the interactive console').action(runInteractive);

  for (const area of areas) {
    program
      .command(area.id)
      .description(area.desc)
      .action(async () => {
        await areaScreen(area, { standalone: true });
      });
  }

  await program.parseAsync(process.argv);
}
