import { TPlayer } from 'squad-rcon';
import { EVENTS, UPDATERS_REJECT_TIMEOUT } from '../../constants';
import { getServersState } from '../../serversState';

export const updatePlayers = async (id: number) => {
  const { execute, coreListener, logger } = getServersState(id);

  logger.log('Updating players');

  execute(EVENTS.LIST_PLAYERS);

  return new Promise((res, rej) => {
    coreListener.once(EVENTS.LIST_PLAYERS, (data: TPlayer[]) => {
      const state = getServersState(id);
      state.players = data.map((player) => {
        const playerFound = state.players?.find(
          (p) => p.steamID === player.steamID,
        );

        if (playerFound) {
          if (player.teamID !== playerFound.teamID)
            coreListener.emit(EVENTS.PLAYER_TEAM_CHANGED, {
              player: player,
              oldTeamID: playerFound.teamID,
              newTeamID: player.teamID,
            });
          if (player.squadID !== playerFound.squadID)
            coreListener.emit(EVENTS.PLAYER_SQUAD_CHANGED, {
              player: player,
              oldSquadID: playerFound.squadID,
              newSquadID: player.squadID,
            });

          if (player.role !== playerFound.role)
            coreListener.emit(EVENTS.PLAYER_ROLE_CHANGED, {
              player: player,
              oldRole: playerFound.role,
              newRole: player.role,
              isLeader: player.isLeader,
            });

          if (player.isLeader !== playerFound.isLeader) {
            coreListener.emit(EVENTS.PLAYER_LEADER_CHANGED, {
              player: player,
              oldRole: playerFound.role,
              newRole: player.role,
              isLeader: player.isLeader,
            });
          }

          return {
            ...playerFound,
            ...player,
          };
        }

        return player;
      });

      coreListener.emit(EVENTS.UPDATED_PLAYERS, state.players);

      logger.log('Updated players');
      res(true);
    });

    setTimeout(
      () => rej({ id, message: 'Updating players' }),
      UPDATERS_REJECT_TIMEOUT,
    );
  });
};
