import { TMap } from 'squad-rcon';
import { EVENTS, UPDATERS_REJECT_TIMEOUT } from '../../constants';
import { getServersState } from '../../serversState';

export const updateCurrentMap = async (id: number) => {
  const { execute, listener, logger } = getServersState(id);

  logger.log('Updating current map');

  execute(EVENTS.SHOW_CURRENT_MAP);

  return new Promise((res, rej) => {
    listener.once(EVENTS.SHOW_CURRENT_MAP, (data: TMap) => {
      getServersState(id).currentMap = data;

      logger.log('Updated current map');
      res(true);
    });

    setTimeout(
      () => rej({ id, message: 'Updating current map error' }),
      UPDATERS_REJECT_TIMEOUT,
    );
  });
};
