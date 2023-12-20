import chalk from 'chalk';
import { initServer, initSquadJS } from './core';
import { getServersState } from './serversState';
import { TError } from './types';
import { getConfigs } from './utils';

const initial = async (id?: number) => {
  const configs = getConfigs();

  if (configs?.length) {
    for (const config of configs) {
      if (id && config.id !== id) continue;

      try {
        const [rcon, logs] = await initServer(config);

        await initSquadJS({
          rcon,
          logs,
          id: config.id,
          mapsName: config.mapsName,
          mapsRegExp: config.mapsRegExp,
          plugins: config.plugins,
        });
      } catch (error) {
        const err = error as TError;

        if (err?.id && err?.message) {
          console.log(
            chalk.yellow(`[SquadJS]`),
            chalk.red(`Server ${err.id} error: ${err.message}`),
          );

          const state = getServersState(err.id);

          await state.rcon.close();
          await state.logs.close();

          initial(id);
        } else {
          console.log(chalk.yellow(`[SquadJS]`), chalk.red(error));
        }
      }
    }
  }
};

initial();
