import {
  TPlayerConnected,
  TPlayerDied,
  TPlayerRevived,
  TRoundTickets,
} from 'squad-logs';
import { EVENTS } from '../constants';
import { adminWarn } from '../core';
import {
  createUserIfNullableOrUpdateName,
  getUserDataWithSteamID,
  updateGames,
  updatePossess,
  updateRoles,
  updateTimes,
  updateUser,
} from '../rnsdb';
import { TPluginProps } from '../types';
import {
  getPlayerByEOSID,
  getPlayerByName,
  getPlayerBySteamID,
  getSquadByID,
} from './helpers';

export const rnsStats: TPluginProps = (state) => {
  const { listener, execute } = state;
  let playersCurrenTime: Array<{
    steamID: string;
    timer: NodeJS.Timeout;
  }> = [];
  let winner: string;
  const playerConnected = (data: TPlayerConnected) => {
    const user = getPlayerByEOSID(state, data.eosID);
    if (!user) return;
    const { steamID, name } = user;
    createUserIfNullableOrUpdateName(steamID, name);
  };

  const onRoundTickets = (data: TRoundTickets) => {
    const { team, action } = data;
    if (action === 'won') winner = team;
  };

  const onRoundEnded = async () => {
    if (state.skipmap) return;
    const { players } = state;
    if (!players) return;
    for (const player of players) {
      const { teamID, steamID, possess } = player;
      const user = await getUserDataWithSteamID(steamID);
      if (user)
        adminWarn(
          execute,
          steamID,
          `Игрок: ${user.name}\nУбийств: ${user.kills}\nСмертей: ${user.death}\nПомощь: ${user.revives}\nТимкилы: ${user.teamkills}\nK/D: ${user.kd}
        `,
        );
      if (possess?.toLowerCase().includes('developeradmincam')) return;
      if (!winner) return;
      if (teamID === winner) {
        updateGames(steamID, 'won');
      } else {
        updateGames(steamID, 'lose');
      }
    }
    winner = '';
  };

  const updatedPlayers = () => {
    const { players } = state;
    if (!players) return;
    players.forEach((e) => {
      const { steamID } = e;
      if (!steamID) return;
      if (playersCurrenTime.find((e) => e.steamID === steamID)) return;
      playersCurrenTime.push({
        steamID,
        timer: setInterval(async () => {
          const user = getPlayerBySteamID(state, steamID);

          if (user && user.possess) {
            await updatePossess(steamID, user.possess);
          }

          if (user && user.role) {
            await updateRoles(steamID, user.role);
          }

          if (user && user.isLeader && user.squadID) {
            await updateTimes(steamID, 'leader');
            const squad = getSquadByID(state, user.squadID);
            if (
              (squad && squad.squadName === 'CMD Squad') ||
              (squad && squad.squadName === 'Command Squad')
            ) {
              await updateTimes(steamID, 'cmd');
            }
          }
          if (user && user.name) {
            await updateTimes(steamID, 'timeplayed');
          }
        }, 60000),
      });
    });

    playersCurrenTime = playersCurrenTime.filter((e) => {
      const currentUser = players.find((c) => c.steamID === e.steamID);

      if (!currentUser) {
        clearInterval(e.timer);

        return false;
      }

      return e;
    });
  };

  const onDied = (data: TPlayerDied) => {
    const { currentMap } = state;
    if (currentMap?.layer?.toLowerCase().includes('seed')) return;
    const { attackerSteamID, victimName, attackerEOSID } = data;
    const attacker = getPlayerByEOSID(state, attackerEOSID);
    const victim = getPlayerByName(state, victimName);

    if (!victim) return;
    if (attacker?.teamID === victim?.teamID && attacker.name !== victim.name) {
      return updateUser(attackerSteamID, 'teamkills');
    }
    updateUser(attackerSteamID, 'kills', victim.weapon || 'null');
    updateUser(victim.steamID, 'death');
  };

  const onRevived = (data: TPlayerRevived) => {
    const { currentMap } = state;
    if (currentMap?.layer?.toLowerCase().includes('seed')) return;

    const { reviverSteamID } = data;

    updateUser(reviverSteamID, 'revives');
  };

  listener.on(EVENTS.PLAYER_CONNECTED, playerConnected);
  listener.on(EVENTS.UPDATED_PLAYERS, updatedPlayers);
  listener.on(EVENTS.PLAYER_DIED, onDied);
  listener.on(EVENTS.PLAYER_REVIVED, onRevived);
  listener.on(EVENTS.ROUND_ENDED, onRoundEnded);
  listener.on(EVENTS.ROUND_TICKETS, onRoundTickets);
};
