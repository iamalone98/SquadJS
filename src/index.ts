import chalk from 'chalk';
import { initServer, initSquadJS } from './core';
import { connectToDatabase } from './rnsdb';
import { TError } from './types';
import { getConfigs } from './utils';
const initial = async () => {
  const configs = getConfigs();

  if (configs?.length) {
    for (const config of configs) {
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

        await connectToDatabase(config.db);
      } catch (error) {
        const err = error as TError;

        if (err?.id && err?.message) {
          console.log(
            chalk.yellow(`[SquadJS]`),
            chalk.red(`Server ${err.id} error: ${err.message}`),
          );
        } else {
          console.log(chalk.yellow(`[SquadJS]`), chalk.red(error));
        }
      }
    }
  }
};

initial();
