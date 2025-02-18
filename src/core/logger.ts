import chalk from 'chalk';
import { getCurrentTime } from '../utils';

export const initLogger = (id: number) => ({
  log: (...text: string[]) => {
    console.log(
      chalk.yellow(`[SquadJS][${id}][${getCurrentTime()}]`),
      chalk.green(text),
    );
  },

  warn: (...text: string[]) => {
    console.log(
      chalk.yellow(`[SquadJS][${id}][${getCurrentTime()}]`),
      chalk.magenta(text),
    );
  },

  error: (...text: string[]) => {
    console.log(
      chalk.yellow(`[SquadJS][${id}][${getCurrentTime()}]`),
      chalk.red(text),
    );
  },
});
