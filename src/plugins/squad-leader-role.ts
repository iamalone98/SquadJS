import { EVENTS } from '../constants';
import { adminDisbandSquad, adminWarn } from '../core';
import {
  TPlayer,
  TPlayerLeaderChanged,
  TPlayerRoleChanged,
  TPluginProps,
} from '../types';

export const squadLeaderRole: TPluginProps = (state) => {
  const { listener, execute, logger } = state;
  let trackedPlayers: Record<string, TPlayer> = {};

  const getWarn = async (steamID: string, text: string, seconds?: number) => {
    if (!seconds) {
      return adminWarn(execute, steamID, text);
    }

    const newText = text.replace(/{{time}}/, seconds.toString());
    await adminWarn(execute, steamID, newText);
  };

  const newGame = () => {
    trackedPlayers = {};
  };

  const getIsLeaderRole = (role: string) => {
    return role.indexOf('SL') !== -1;
  };

  const untrackPlayer = (steamID: string, reason?: string) => {
    const tracker = trackedPlayers[steamID];
    delete trackedPlayers[steamID];

    if (tracker) {
      logger.log(
        `unTracker: Name: ${tracker.name} SquadID: ${tracker.squadID} TeamID: ${
          tracker.teamID
        } Reason: ${reason || 'null'}`,
      );
    }
  };

  const leaderChanged = async (
    data: TPlayerRoleChanged | TPlayerLeaderChanged,
  ) => {
    const { player, isLeader } = data;
    const { currentMap, admins } = state;
    if (currentMap?.layer?.toLowerCase().includes('seed')) return;
    //if (admins?.[player.steamID]?.ban) return;
    const timeDisband: number = 120000;
    const iterationCheck: number = 30000;
    const messageGetRole: string =
      'Возьми кит лидера или сквад будет расформирован через {{time}}сек';
    const messageDisband: string = 'Отряд расформирован';
    const messageSuccess: string = 'Спасибо что взяли кит!';

    let seconds = timeDisband / 1000;
    let timer: NodeJS.Timeout | null = null;

    const leaderRole = getIsLeaderRole(player.role);
    if (trackedPlayers[player.steamID]) return;
    if (isLeader && leaderRole) return;
    if (!player) return;
    if (isLeader && !leaderRole && !trackedPlayers[player.steamID]) {
      trackedPlayers[player.steamID] = player;
    }

    if (isLeader) {
      if (!leaderRole) {
        await getWarn(player.steamID, messageGetRole, seconds);
        logger.log(
          `startTracker: Name: ${player.name} SquadID: ${player.squadID} TeamID: ${player.teamID} Seconds: ${seconds}`,
        );

        timer = setInterval(async () => {
          let updatedPlayer = state.players?.find(
            (user) => user.steamID === player.steamID,
          );
          seconds = seconds - iterationCheck / 1000;

          if (!updatedPlayer) {
            clearInterval(timer!);
            timer = null;

            untrackPlayer(player.steamID, 'Игрок вышел');

            return;
          }

          if (!updatedPlayer.isLeader) {
            clearInterval(timer!);
            timer = null;
            untrackPlayer(player.steamID, 'Игрок больше не лидер');

            return;
          }

          if (getIsLeaderRole(updatedPlayer.role)) {
            clearInterval(timer!);
            timer = null;

            if (messageSuccess) {
              await getWarn(updatedPlayer.steamID, messageSuccess);
            }

            untrackPlayer(player.steamID, 'Игрок взял кит');

            return;
          }

          if (seconds !== 0) {
            await getWarn(updatedPlayer.steamID, messageGetRole, seconds);
            logger.log(
              `startTracker: Name: ${player.name} SquadID: ${player.squadID} TeamID: ${player.teamID} Seconds: ${seconds}`,
            );
          }

          if (seconds <= 0) {
            untrackPlayer(player.steamID, 'Отряд распущен');
            clearInterval(timer!);
            timer = null;

            await getWarn(updatedPlayer.steamID, messageDisband);

            updatedPlayer = state.players?.find(
              (user) => user.steamID === player.steamID,
            );

            if (updatedPlayer && updatedPlayer?.squadID) {
              await adminDisbandSquad(
                execute,
                updatedPlayer.teamID,
                updatedPlayer.squadID,
              );
            }
          }
        }, iterationCheck);
      }
    }
  };

  listener.on(EVENTS.NEW_GAME, newGame);
  listener.on(EVENTS.PLAYER_ROLE_CHANGED, leaderChanged);
  listener.on(EVENTS.PLAYER_LEADER_CHANGED, leaderChanged);
};
