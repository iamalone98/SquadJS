import chalk from 'chalk';
import fs from 'fs';
import { TConfig } from './types';

export const getConfigs = (): TConfig[] | null => {
  const configPath = process.cwd() + '/config.json';

  if (!fs.existsSync(configPath)) {
    console.log(
      chalk.yellow(`[SquadJS]`),
      chalk.red('Config file required!'),
    );
    return null;
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  return Object.keys(config).map((key) => ({
    id: key,
    ...config[key],
  }));
};
