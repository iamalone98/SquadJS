import fs from 'fs';
import path from 'path';
import url from 'url';
import { TLogger, TMaps } from '../../types';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export const initMaps = async (
  mapsName: string,
  mapsRegExp: string,
  logger: TLogger,
) => {
  logger.log('Loading maps');

  const filePath = path.resolve(__dirname, mapsName);

  if (!fs.existsSync(filePath)) {
    logger.error(`Maps ${mapsName} not found`);

    process.exit(1);
  }

  return new Promise<TMaps>((res) => {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (!data || !data.length) {
      logger.error(`Maps ${mapsName} empty`);

      process.exit(1);
    }

    const maps: TMaps = {};

    (data as string[]).forEach((map) => {
      const regexp = new RegExp(mapsRegExp);

      const matches = map.match(regexp);
      const groups = matches?.groups;

      if (!groups || !groups?.layerName || !groups?.layerMode) {
        logger.error(`RegExp parse ${map} error`);

        process.exit(1);
      }

      const { layerName, layerMode } = groups;

      maps[map] = { layerName, layerMode };
    });

    logger.log('Loaded maps');

    res(maps);
  });
};
