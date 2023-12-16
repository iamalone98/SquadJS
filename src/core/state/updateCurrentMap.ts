import { TMap } from 'squad-rcon';
import { serversState } from '../../serversState';

export const updateCurrentMap = async (id: number) => {
  const { execute, listener, logger } = serversState[id];

  logger.log('Updating current map');

  execute('ShowCurrentMap');

  return new Promise((res) => {
    listener.once('ShowCurrentMap', (data: TMap) => {
      serversState[id].currentMap = data;

      res(true);
    });
  });
};
