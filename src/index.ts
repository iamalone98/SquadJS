import chalk from 'chalk';
import { initServer, initSquadJS } from './core';
import { getConfigs } from './utils';

const initial = async () => {
  try {
    const configs = getConfigs();

    if (configs?.length) {
      for (const config of configs) {
        const [rcon, logs] = await initServer(config);
        const { execute, rconEmitter } = rcon;
        const { logsEmitter, getAdmins } = logs;

        await initSquadJS({
          execute,
          id: config.id,
          mapsName: config.mapsName,
          mapsRegExp: config.mapsRegExp,
          getAdmins,
          rconEmitter,
          logsEmitter,
        });
      }
    }
  } catch (error) {
    console.log(chalk.yellow(`[SquadJS]`), chalk.red(error));
  }
};

initial();
