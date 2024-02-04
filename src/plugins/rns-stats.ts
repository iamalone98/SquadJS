import { TPlayerConnected } from 'squad-logs';
import { EVENTS } from '../constants';
import {
  createUserIfNullableOrUpdateName,
  updatePossess,
  updateRoles,
  updateTimes,
  updateUserBonuses,
} from '../rnsdb';
import { TPluginProps } from '../types';
import { getPlayerByEOSID, getPlayerBySteamID, getSquadByID } from './helpers';

export const rnsStats: TPluginProps = (state) => {
  const { listener } = state;
  const classicBonus = 1;
  const seedBonus = 2;
  let playersBonusesCurrentTime: Array<{
    steamID: string;
    timer: NodeJS.Timeout;
  }> = [];
  const playerConnected = (data: TPlayerConnected) => {
    const user = getPlayerByEOSID(state, data.eosID);
    if (!user) return;
    const { steamID, name } = user;
    createUserIfNullableOrUpdateName(steamID, name);
  };

  const updatedPlayers = () => {
    const { players, currentMap } = state;
    if (!players) return;
    players.forEach((e) => {
      const { steamID } = e;
      if (!steamID) return;
      if (
        playersBonusesCurrentTime.find(
          (e: { steamID: string }) => e.steamID === steamID,
        )
      )
        return;
      playersBonusesCurrentTime.push({
        steamID,
        timer: setInterval(async () => {
          const user = getPlayerBySteamID(state, steamID);
          if (currentMap?.layer?.toLowerCase().includes('seed')) {
            await updateUserBonuses(steamID, seedBonus);
          } else {
            await updateUserBonuses(steamID, classicBonus);
          }

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

    playersBonusesCurrentTime = playersBonusesCurrentTime.filter((e) => {
      const currentUser = players.find((c) => c.steamID === e.steamID);

      if (!currentUser) {
        clearInterval(e.timer);

        return false;
      }

      return e;
    });
  };

  // const onDied = (data: TPlayerDied) => {
  //   const { currentMap } = state;
  //   const { attackerSteamID, victimName } = data;
  //   const victim = getPlayerByName(state, victimName);

  //   if (!attackerSteamID || !victim) return;
  //   if (currentMap?.layer?.toLowerCase().includes('seed')) return;
  //   // if (!victim.weapon) {
  //   //   const user = this.server.weapons.find(
  //   //     (u) => u.name === data.victim.name,
  //   //   );
  //   //   this.server.rnsdb.updateUser(
  //   //     data.attacker.steamID,
  //   //     'kills',
  //   //     user.weapon,
  //   //   );
  //   //   this.server.rnsdb.updateUser(victim.steamID, 'death');
  //   //   return;
  //   // }
  //   if (!victim.weapon) return;
  //   updateUser(attackerSteamID, 'kills', victim.weapon);
  //   updateUser(victim.steamID, 'death');
  // };

  listener.on(EVENTS.PLAYER_CONNECTED, playerConnected);
  listener.on(EVENTS.UPDATED_PLAYERS, updatedPlayers);
  // listener.on(EVENTS.PLAYER_DIED, onDied);
};
