import chalk from 'chalk';
import { SquadJS, initServer } from './core';
import { getConfigs } from './utils';

(async () => {
  try {
    const configs = getConfigs();

    if (configs?.length) {
      for (const config of configs) {
        const [rcon, logs] = await initServer(config);
        const { execute, rconEmitter } = rcon;
        const { logsEmitter } = logs;

        await SquadJS({
          execute,
          id: config.id,
          mapsName: config.mapsName,
          rconEmitter,
          logsEmitter,
        });
      }
    }
  } catch (error) {
    console.log(chalk.yellow(`[SquadJS]`), chalk.red(error));
  }
})();
