// Interactive entry: land on the splash, then drop into the menu loop.
import { splash } from './screens.js';
import { mainMenu } from './menu.js';
import { pressKey } from './ui.js';

export async function runInteractive() {
  const status = await splash();
  await pressKey('', { silent: true }); // the splash printed its own hint
  await mainMenu(status);
}
