import fs from 'fs';
import { URL } from 'url';
import { TLogger } from '../../types';

const __dirname = new URL('.', import.meta.url).pathname;

export const initMaps = async (mapsName: string, logger: TLogger) => {
  logger.log('Loading maps');

  const filePath = __dirname + mapsName;

  if (!fs.existsSync(filePath)) {
    logger.error(`Maps ${mapsName} not found`);

    process.exit(1);
  }

  return new Promise<string[]>((res) => {
    const data: string[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!data || !data.length) {
      logger.error(`Maps ${mapsName} empty`);

      process.exit(1);
    }

    logger.log('Loaded maps');

    res(data);
  });
};
