import { initLogger } from '../logger';
import { initPlugins } from '../plugins';
import { serversState } from '../serversState';
import { TSquadJS } from '../types';
import { initEvents } from './events';
import { initMaps } from './maps';
import { initState } from './state';

export const initSquadJS = async ({
  id,
  execute,
  mapsName,
  getAdmins,
  rconEmitter,
  logsEmitter,
}: TSquadJS) => {
  const listener = initEvents({ rconEmitter, logsEmitter });
  const logger = initLogger(id, true);
  const maps = await initMaps(mapsName, logger);

  serversState[id] = { listener, execute, logger, maps };

  await initState(id, getAdmins);
  await initPlugins(id);
};
