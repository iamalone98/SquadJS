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
    adminsMessage,
    reportMessage,
    stvolMessage,
    discordMessage,
    statsTimeOutMessage,
    statsPlayerNotFoundMessage,
    bonusWarnMessage,
  } = options;
  type SwapHistoryItem = {
    steamID: string;
    deletionTimer: NodeJS.Timeout;
    startTime: number;
  };
  let players: string[] = [];
  let timeoutPlayers: string[] = [];
  const swapHistory: SwapHistoryItem[] = [];

  const sendWarningMessages = (steamID: string, messages: string) => {
    for (const message of messages) {
      adminWarn(execute, steamID, message);
    }
  };

  const admins = (data: TChatMessage) => {
    if (!adminsEnable) return;
    const { steamID } = data;
    sendWarningMessages(steamID, adminsMessage);
  };

  const report = (data: TChatMessage) => {
    if (!reportEnable) return;
    sendWarningMessages(data.steamID, reportMessage);
  };

  const stvol = (data: TChatMessage) => {
    if (!stvolEnable) return;
    const { name, steamID } = data;

    if (players.find((player) => player === steamID)) {
      sendWarningMessages(steamID, stvolMessage);
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
    const { steamID } = data;
    sendWarningMessages(steamID, discordMessage);
  };

  const stats = async (data: TChatMessage) => {
    if (!statsEnable) return;
    const { steamID, message } = data;
    let user;
    if (timeoutPlayers.find((p) => p === steamID)) {
      sendWarningMessages(steamID, statsTimeOutMessage);
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
        sendWarningMessages(steamID, statsPlayerNotFoundMessage);
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
    sendWarningMessages(steamID, bonusWarnMessage);
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

  function removeSteamID(steamID: string) {
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
