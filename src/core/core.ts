import { initPlugins } from '../plugins';
import { TConfig } from '../types';
import { initEvents } from './events';
import { initLogger } from './logger';
import { initMaps } from './maps';
import { initParsers } from './parsers';
import { serversState } from './serversState';
import { initUpdaters } from './updaters';

export const initSquadJS = async (config: TConfig) => {
  const { id, mapsName, mapsRegExp, plugins } = config;
  const logger = initLogger(id);

  const [rcon, logs] = await initParsers(config);

  const { rconEmitter, execute } = rcon;
  const { logsEmitter, getAdmins } = logs;

  const { localEmitter, coreEmitter } = initEvents({
    rconEmitter,
    logsEmitter,
  });

  const maps = await initMaps(mapsName, mapsRegExp, logger);

  serversState[id] = {
    id,
    rcon,
    logs,
    listener: localEmitter,
    coreListener: coreEmitter,
    execute,
    logger,
    maps,
    plugins,
  };

  await initUpdaters(id, getAdmins);
  await initPlugins(id);
};
