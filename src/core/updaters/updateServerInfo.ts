import { TServerInfo } from 'squad-rcon';
import { EVENTS, UPDATERS_REJECT_TIMEOUT } from '../../constants';
import { getServersState } from '../serversState';

export const updateServerInfo = async (id: number) => {
  const { execute, coreListener, logger } = getServersState(id);

  logger.log('Updating server info');

  execute(EVENTS.SHOW_SERVER_INFO);

  return new Promise((res) => {
    coreListener.once(EVENTS.SHOW_SERVER_INFO, (data: TServerInfo) => {
      getServersState(id).serverInfo = data;

      logger.log('Updated server info');
      res(true);
    });

    setTimeout(() => res(true), UPDATERS_REJECT_TIMEOUT);
  });
};
