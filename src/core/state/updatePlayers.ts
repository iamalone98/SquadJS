import { TPlayer } from 'squad-rcon';
import { serversState } from '../../serversState';

export const updatePlayers = async (id: number) => {
  const { execute, listener, logger } = serversState[id];

  logger.log('Updating players');

  execute('ListPlayers');

  return new Promise((res) => {
    listener.once('ListPlayers', (data: TPlayer[]) => {
      serversState[id].players = [...data];

      res(true);
    });
  });
};
