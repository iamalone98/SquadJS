import { TChatMessage } from 'squad-rcon';
import { EVENTS } from '../constants';
import { adminBroadcast, adminForceTeamChange, adminWarn } from '../core';
import { getUserDataWithSteamID } from '../rnsdb';
import { TPluginProps } from '../types';

export const chatCommands: TPluginProps = (state, options) => {
  const { listener, execute } = state;
  const {
    adminsEnable,
    reportEnable,
    stvolEnable,
    fixEnable,
    discordEnable,
    statsEnable,
    bonusEnable,
    swapEnable,
    swapTimeout,
    statsTimeout,
    stvolTimeout,
  } = options;
  let players: string[] = [];
  let timeoutPlayers: string[] = [];
  const swapHistory: any[] = [];
  const admins = (data: TChatMessage) => {
    if (!adminsEnable) return;
    adminWarn(execute, data.steamID, 'На сервере присутствует администратор');
    adminWarn(
      execute,
      data.steamID,
      'Для связи с администратором перейдите в дискорд канал discord.gg/rn-server',
    );
  };

  const report = (data: TChatMessage) => {
    if (!reportEnable) return;
    adminWarn(
      execute,
      data.steamID,
      `Для завершения репорта, создайте тикет в discord.gg/rn-server`,
    );
  };

  const stvol = (data: TChatMessage) => {
    if (!stvolEnable) return;
    const { name, steamID } = data;

    if (players.find((player) => player === steamID)) {
      adminWarn(execute, data.steamID, 'Разрешено использовать раз в 5 минут!');
      return;
    }

    const range = Math.floor(Math.random() * 31 + 1);

    adminBroadcast(execute, `У ${name} ствол ${range}см`);

    players.push(steamID);

    setTimeout(() => {
      players = players.filter((player) => player !== steamID);
    }, parseInt(stvolTimeout));
  };

  const fix = (data: TChatMessage) => {
    if (!fixEnable) return;
    adminForceTeamChange(execute, data.steamID);
    adminForceTeamChange(execute, data.steamID);
  };

  const discord = (data: TChatMessage) => {
    if (!discordEnable) return;
    adminWarn(
      execute,
      data.steamID,
      'Discord сервера - https://discord.gg/rn-server',
    );
    adminWarn(
      execute,
      data.steamID,
      'Либо в дискорде "Добавить сервер -> rn-server"',
    );
  };

  const stats = async (data: TChatMessage) => {
    if (!statsEnable) return;
    const { steamID, message } = data;
    let user;
    if (timeoutPlayers.find((p) => p === steamID)) {
      adminWarn(execute, steamID, 'Разрешено использовать раз в 3 минуты!');
      return;
    }
    if (message.length === 0) {
      user = await getUserDataWithSteamID(steamID);
    } else {
      const { players } = state;
      const getPlayer = players?.find((p) =>
        p.name.trim().toLowerCase().includes(message.trim().toLowerCase()),
      );
      if (!getPlayer) {
        adminWarn(
          execute,
          steamID,
          'Имя указано неверно, либо игрок отсутствует на сервере!',
        );
      } else {
        user = await getUserDataWithSteamID(getPlayer.steamID);
      }
    }
    if (!user) return;
    const { name, kills, death, revives, teamkills, kd } = user;

    adminWarn(
      execute,
      steamID,
      `Игрок: ${name}\nУбийств: ${kills}\nСмертей: ${death}\nПомощь: ${revives}\nТимкилы: ${teamkills}\nK/D: ${kd}
       `,
    );
    timeoutPlayers.push(steamID);
    setTimeout(() => {
      timeoutPlayers = timeoutPlayers.filter((p) => p !== steamID);
    }, parseInt(statsTimeout));
  };

  const bonus = async (data: TChatMessage) => {
    if (!bonusEnable) return;
    const { steamID } = data;

    const user = await getUserDataWithSteamID(steamID);
    if (!user) return;
    const bonus = user.bonuses;
    adminWarn(execute, steamID, `У вас бонусов ${bonus || 0}`);
    adminWarn(
      execute,
      steamID,
      'За час игры 60 бонусов, на Seed картах 120 бонусов',
    );
    adminWarn(
      execute,
      steamID,
      'Для получения Vip статуса за бонусы нажмите на кнопку в дискорде discord.gg/rn-server в канале получить-vip',
    );
    adminWarn(execute, steamID, 'Стоимость Vip статуса равна 15 000 баллов');
  };

  const swap = async (data: TChatMessage) => {
    if (!swapEnable) return;
    const deletionTime = parseInt(swapTimeout);
    const { steamID } = data;

    const existingEntry = swapHistory.find(
      (entry) => entry.steamID === steamID,
    );

    if (existingEntry) {
      const remainingTime =
        deletionTime - (Date.now() - existingEntry.startTime);
      const remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
      const remainingMinutes = Math.floor(
        (remainingTime % (1000 * 60 * 60)) / (1000 * 60),
      );
      adminWarn(
        execute,
        steamID,
        `Команда доступна через ${remainingHours} ч ${remainingMinutes} мин!`,
      );
      return;
    }

    adminForceTeamChange(execute, steamID);
    const deletionTimer = setTimeout(
      () => removeSteamID(steamID),
      deletionTime,
    );
    swapHistory.push({
      steamID: steamID,
      deletionTimer: deletionTimer,
      startTime: Date.now(),
    });
  };

  function removeSteamID(steamID: String) {
    const index = swapHistory.findIndex((entry) => entry.steamID === steamID);
    if (index !== -1) {
      clearTimeout(swapHistory[index].deletionTimer);
      swapHistory.splice(index, 1);
    }
  }

  listener.on(EVENTS.CHAT_COMMAND_ADMINS, admins);
  listener.on(EVENTS.CHAT_COMMAND_REPORT, report);
  listener.on(EVENTS.CHAT_COMMAND_R, report);
  listener.on(EVENTS.CHAT_COMMAND_STVOL, stvol);
  listener.on(EVENTS.CHAT_COMMAND_FIX, fix);
  listener.on(EVENTS.CHAT_COMMAND_BONUS, bonus);
  listener.on(EVENTS.CHAT_COMMAND_STATS, stats);
  listener.on(EVENTS.CHAT_COMMAND_DISCORD, discord);
  listener.on(EVENTS.CHAT_COMMAND_SWITCH, swap);
  listener.on(EVENTS.CHAT_COMMAND_SWAP, swap);
  listener.on(EVENTS.CHAT_COMMAND_SW, swap);
};
