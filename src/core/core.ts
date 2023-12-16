import { initLogger } from '../logger';
import { serversState } from '../serversState';
import { TSquadJS } from '../types';
import { initEvents } from './events';
import { initState } from './state';

export const SquadJS = async ({
  id,
  execute,
  rconEmitter,
  logsEmitter,
}: TSquadJS) => {
  const listener = initEvents({ rconEmitter, logsEmitter });
  const logger = initLogger(id, true);

  serversState[id] = { listener, execute, logger };

  await initState(id);
};
