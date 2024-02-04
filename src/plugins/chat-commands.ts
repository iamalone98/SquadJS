import { TChatMessage } from 'squad-rcon';
import { EVENTS } from '../constants';
import { adminBroadcast, adminForceTeamChange, adminWarn } from '../core';
import { getBonusesWithSteamID } from '../rnsdb';
import { TPluginProps } from '../types';

export const chatCommands: TPluginProps = (state) => {
  const { listener, execute } = state;
  let players: string[] = [];

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

  const bonus = (data: TChatMessage) => {
    const { steamID } = data;

    const userBonuses = getBonusesWithSteamID(steamID);

    adminWarn(execute, steamID, `У вас бонусов ${userBonuses || 0}`);
    adminWarn(
      execute,
      steamID,
      'За час игры 60 бонусов, на Seed картах 120 бонусов',
    );
    adminWarn(
      execute,
      steamID,
      'Для получения Vip статуса !vip в дискорде discord.gg/rn-server в канале vip-за-бонусы',
    );
    adminWarn(execute, steamID, 'Стоимость Vip статуса равна 15 000 баллов');
  };

  listener.on(EVENTS.CHAT_COMMAND_ADMINS, admins);
  listener.on(EVENTS.CHAT_COMMAND_REPORT, report);
  listener.on(EVENTS.CHAT_COMMAND_R, report);
  listener.on(EVENTS.CHAT_COMMAND_STVOL, stvol);
  listener.on(EVENTS.CHAT_COMMAND_FIX, fix);
  listener.on(EVENTS.CHAT_COMMAND_BONUS, bonus);
};
