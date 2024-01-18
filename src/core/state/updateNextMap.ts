import { TMap } from 'squad-rcon';
import { EVENTS, UPDATERS_REJECT_TIMEOUT } from '../../constants';
import { getServersState } from '../../serversState';

export const updateNextMap = async (id: number) => {
  const { execute, coreListener, logger } = getServersState(id);

  logger.log('Updating next map');

  execute(EVENTS.SHOW_NEXT_MAP);

  return new Promise((res, rej) => {
    coreListener.once(EVENTS.SHOW_NEXT_MAP, (data: TMap) => {
      getServersState(id).nextMap = data;

      logger.log('Updated next map');
      res(true);
    });

    setTimeout(
      () => rej({ id, message: 'Updating next map error' }),
      UPDATERS_REJECT_TIMEOUT,
    );
  });
};
