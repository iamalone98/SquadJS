import { TChatMessage } from 'squad-rcon';
import { EVENTS } from '../constants';
import { adminBroadcast, adminForceTeamChange, adminWarn } from '../core';
import { getUserDataWithSteamID } from '../rnsdb';
import { TPluginProps } from '../types';

export const chatCommands: TPluginProps = (state) => {
  const { listener, execute } = state;
  let players: string[] = [];
  let timeoutPlayers: string[] = [];
  const admins = (data: TChatMessage) => {
    adminWarn(execute, data.steamID, 'На сервере присутствует администратор');
    adminWarn(
      execute,
      data.steamID,
      'Для связи с администратором перейдите в дискорд канал discord.gg/rn-server',
    );
  };

  const report = (data: TChatMessage) => {
    adminWarn(
      execute,
      data.steamID,
      `Для завершения репорта, создайте тикет в discord.gg/rn-server`,
    );
  };

  const stvol = (data: TChatMessage) => {
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
    }, 300000);
  };

  const fix = (data: TChatMessage) => {
    adminForceTeamChange(execute, data.steamID);
    adminForceTeamChange(execute, data.steamID);
  };

  const discord = (data: TChatMessage) => {
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
    }, 180000);
  };

  const bonus = async (data: TChatMessage) => {
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
      'Для получения Vip статуса !vip в дискорде discord.gg/rn-server в канале получить-vip',
    );
    adminWarn(execute, steamID, 'Стоимость Vip статуса равна 15 000 баллов');
  };

  listener.on(EVENTS.CHAT_COMMAND_ADMINS, admins);
  listener.on(EVENTS.CHAT_COMMAND_REPORT, report);
  listener.on(EVENTS.CHAT_COMMAND_R, report);
  listener.on(EVENTS.CHAT_COMMAND_STVOL, stvol);
  listener.on(EVENTS.CHAT_COMMAND_FIX, fix);
  listener.on(EVENTS.CHAT_COMMAND_BONUS, bonus);
  listener.on(EVENTS.CHAT_COMMAND_STATS, stats);
  listener.on(EVENTS.CHAT_COMMAND_DISCORD, discord);
};
