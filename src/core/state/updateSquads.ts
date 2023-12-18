import { TSquad } from 'squad-rcon';
import { EVENTS, UPDATERS_REJECT_TIMEOUT } from '../../constants';
import { getServersState } from '../../serversState';

export const updateSquads = async (id: number) => {
  const { execute, listener, logger } = getServersState(id);

  logger.log('Updating squads');

  execute(EVENTS.LIST_SQUADS);

  return new Promise((res, rej) => {
    listener.once(EVENTS.LIST_SQUADS, (data: TSquad[]) => {
      const state = getServersState(id);
      state.squads = [...data];

      listener.emit(EVENTS.LIST_SQUADS, state.squads);

      logger.log('Updated squads');
      res(true);
    });

    setTimeout(() => rej('Updating squads error'), UPDATERS_REJECT_TIMEOUT);
  });
};
