import { initLogger } from '../logger';
import { initPlugins } from '../plugins';
import { serversState } from '../serversState';
import { TSquadJS } from '../types';
import { initEvents } from './events';
import { initMaps } from './maps';
import { initState } from './state';

export const initSquadJS = async ({
  id,
  mapsName,
  mapsRegExp,
  plugins,
  rcon,
  logs,
}: TSquadJS) => {
  const { rconEmitter, execute } = rcon;
  const { logsEmitter, getAdmins } = logs;
  const { localEmitter, coreEmitter } = initEvents({
    rconEmitter,
    logsEmitter,
  });
  const logger = initLogger(id, true);
  const maps = await initMaps(mapsName, mapsRegExp, logger);

  serversState[id] = {
    rcon,
    logs,
    listener: localEmitter,
    coreListener: coreEmitter,
    execute,
    logger,
    maps,
    plugins,
  };

  await initState(id, getAdmins);
  await initPlugins(id);
};
