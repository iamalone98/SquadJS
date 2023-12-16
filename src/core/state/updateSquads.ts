import { TSquad } from 'squad-rcon';
import { serversState } from '../../serversState';

export const updateSquads = async (id: number) => {
  const { execute, listener, logger } = serversState[id];

  logger.log('Updating squads');

  execute('ListSquads');

  return new Promise((res) => {
    listener.once('ListSquads', (data: TSquad[]) => {
      serversState[id].squads = [...data];

      res(true);
    });
  });
};
