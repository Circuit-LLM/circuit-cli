// The interactive main menu loop — the heart of the console experience.
import { select, isCancel, cancel } from '@clack/prompts';
import { areas } from './areas.js';
import { areaScreen } from './screens.js';
import { c, sym } from './theme.js';
import { clearScreen, slimHeader } from './ui.js';

export async function mainMenu(status) {
  for (;;) {
    clearScreen();
    slimHeader(status);

    const choice = await select({
      message: c.text('Where would you like to go?'),
      options: [
        ...areas.map((a) => ({ value: a.id, label: `${a.icon}  ${a.name}`, hint: a.desc })),
        { value: '__exit', label: `${sym.cross}  Exit`, hint: 'leave the Circuit console' },
      ],
    });

    if (isCancel(choice) || choice === '__exit') {
      cancel(c.muted('Disconnected from the Circuit mesh.'));
      process.exit(0);
    }

    const area = areas.find((a) => a.id === choice);
    if (area) await areaScreen(area, { status });
  }
}
