import { TMap } from 'squad-rcon';
import { serversState } from '../../serversState';

export const updateNextMap = async (id: number) => {
  const { execute, listener, logger } = serversState[id];

  logger.log('Updating next map');

  execute('ShowNextMap');

  return new Promise((res) => {
    listener.once('ShowNextMap', (data: TMap) => {
      serversState[id].nextMap = data;

      res(true);
    });
  });
};
