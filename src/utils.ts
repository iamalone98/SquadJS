import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { TConfig } from './types';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export const getConfigs = (): TConfig[] | null => {
  const configPath = path.resolve(__dirname, '../config.json');

  if (!fs.existsSync(configPath)) {
    console.log(chalk.yellow(`[SquadJS]`), chalk.red('Config file required!'));
    return null;
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  return Object.keys(config).map((key) => {
    for (const option of [
      'host',
      'password',
      'port',
      'logFilePath',
      'adminsFilePath',
      'mapsName',
      'mapsRegExp',
      'plugins',
    ])
      if (!(option in config[key])) {
        console.log(
          chalk.yellow(`[SquadJS]`),
          chalk.red(`${option} required!`),
        );

        process.exit(1);
      }

    return {
      id: parseInt(key, 10),
      ...config[key],
    };
  });
};
