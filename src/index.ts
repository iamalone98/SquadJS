import chalk from 'chalk';
import { initSquadJS } from './core';
import { TError } from './types';
import { getConfigs, getCurrentTime } from './utils';

(async () => {
  const configs = getConfigs();

  if (configs?.length) {
    for (const config of configs) {
      try {
        await initSquadJS(config);
      } catch (error) {
        const err = error as TError;

        if (err?.id && err?.message) {
          console.log(
            chalk.yellow(`[SquadJS][${err.id}][${getCurrentTime()}]`),
            chalk.red(err.message),
          );
        } else {
          console.log(
            chalk.yellow(`[SquadJS][${getCurrentTime()}]`),
            chalk.red(error),
          );
        }
      }
    }
  }
})();
