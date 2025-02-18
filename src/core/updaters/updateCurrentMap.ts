import { TMap } from 'squad-rcon';
import { EVENTS, UPDATERS_REJECT_TIMEOUT } from '../../constants';
import { getServersState } from '../serversState';

export const updateCurrentMap = async (id: number) => {
  const { execute, coreListener, logger } = getServersState(id);

  logger.log('Updating current map');

  execute(EVENTS.SHOW_CURRENT_MAP);

  return new Promise((res) => {
    coreListener.once(EVENTS.SHOW_CURRENT_MAP, (data: TMap) => {
      getServersState(id).currentMap = data;

      logger.log('Updated current map');
      res(true);
    });

    setTimeout(() => res(true), UPDATERS_REJECT_TIMEOUT);
  });
};
