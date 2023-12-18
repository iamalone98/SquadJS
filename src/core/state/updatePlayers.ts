import { TPlayer } from 'squad-rcon';
import { EVENTS, UPDATERS_REJECT_TIMEOUT } from '../../constants';
import { getServersState } from '../../serversState';

export const updatePlayers = async (id: number) => {
  const { execute, listener, logger } = getServersState(id);

  logger.log('Updating players');

  execute(EVENTS.LIST_PLAYERS);

  return new Promise((res, rej) => {
    listener.once(EVENTS.LIST_PLAYERS, (data: TPlayer[]) => {
      const state = getServersState(id);
      state.players = data.map((player) => {
        const playerFound = state.players?.find(
          (p) => p.steamID === player.steamID,
        );

        if (playerFound) {
          return {
            ...playerFound,
            ...player,
          };
        }

        return player;
      });

      listener.emit(EVENTS.UPDATED_PLAYERS, state.players);

      logger.log('Updated players');
      res(true);
    });

    setTimeout(() => rej('Updating players error'), UPDATERS_REJECT_TIMEOUT);
  });
};
