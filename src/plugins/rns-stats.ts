import { TPlayerConnected } from 'squad-logs';
import { EVENTS } from '../constants';
import {
  createUserIfNullableOrUpdateName,
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
  const playersBonusesCurrentTime: any = [];
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

          // if (user && user.possessClassname) {
          //   await this.server.rnsdb.updatePossess(
          //     steamID,
          //     user.possessClassname,
          //   );
          // }

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
  };

  // const onKill = () => {
  //   setTimeout(async (info) => {
  //     const { attacker } = info;
  //     const victim = await this.server.getPlayerByName(info.victim.name);

  //     const layer = await this.getLayer();

  //     if (!attacker || !victim) return;
  //     if (
  //       layer.toLowerCase().includes('seed') ||
  //       layer.toLowerCase().includes('seeding')
  //     )
  //       return;
  //     if (!victim.weaponWound) {
  //       const user = this.server.weapons.find(
  //         (u) => u.name === info.victim.name,
  //       );
  //       this.server.rnsdb.updateUser(
  //         info.attacker.steamID,
  //         'kills',
  //         user.weapon,
  //       );
  //       this.server.rnsdb.updateUser(victim.steamID, 'death');
  //       return;
  //     }
  //     this.server.rnsdb.updateUser(
  //       info.attacker.steamID,
  //       'kills',
  //       victim.weaponWound,
  //     );
  //     this.server.rnsdb.updateUser(victim.steamID, 'death');
  //   }, 10000);
  // };

  listener.on(EVENTS.PLAYER_CONNECTED, playerConnected);
  listener.on(EVENTS.UPDATED_PLAYERS, updatedPlayers);
  // listener.on(EVENTS.PLAYER_DIED, onKill);
};
