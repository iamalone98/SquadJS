import { TMap } from 'squad-rcon';
import { EVENTS, UPDATERS_REJECT_TIMEOUT } from '../../constants';
import { getServersState } from '../serversState';

export const updateNextMap = async (id: number) => {
  const { execute, coreListener, logger } = getServersState(id);

  logger.log('Updating next map');

  execute(EVENTS.SHOW_NEXT_MAP);

  return new Promise((res) => {
    coreListener.once(EVENTS.SHOW_NEXT_MAP, (data: TMap) => {
      getServersState(id).nextMap = data;

      logger.log('Updated next map');
      res(true);
    });

    setTimeout(() => res(true), UPDATERS_REJECT_TIMEOUT);
  });
};
