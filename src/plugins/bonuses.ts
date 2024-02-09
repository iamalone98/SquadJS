import { EVENTS } from '../constants';
import { updateUserBonuses } from '../rnsdb';
import { TPluginProps } from '../types';

export const bonuses: TPluginProps = (state) => {
  const { listener } = state;
  const classicBonus = 1;
  const seedBonus = 2;
  let playersBonusesCurrentTime: Array<{
    steamID: string;
    timer: NodeJS.Timeout;
  }> = [];

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
          if (currentMap?.layer?.toLowerCase().includes('seed')) {
            await updateUserBonuses(steamID, seedBonus);
          } else {
            await updateUserBonuses(steamID, classicBonus);
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

  listener.on(EVENTS.UPDATED_PLAYERS, updatedPlayers);
};
