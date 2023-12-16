import fs from 'fs';
import path from 'path';
import url from 'url';
import { TLogger } from '../../types';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export const initMaps = async (mapsName: string, logger: TLogger) => {
  logger.log('Loading maps');

  const filePath = path.resolve(__dirname, mapsName);

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
