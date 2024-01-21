import { TChatMessage } from 'squad-rcon';
import { EVENTS } from '../constants';
import { adminBroadcast, adminSetNextLayer, adminWarn } from '../core';
import { TPluginProps } from '../types';

export const voteMap: TPluginProps = (state) => {
  const { listener, execute, admins } = state;
  const voteTick = 30000;
  const voteDuration = 180000;
  let voteReadyToStart = true;
  let voteStarting = false;
  let secondsToEnd = voteDuration / 1000;
  let timer: NodeJS.Timeout;
  let timerDelayStarting: NodeJS.Timeout;
  let timerDelayNextStart: NodeJS.Timeout;
  let vote = false;
  let historyPlayers: string[] = [];
  let votes: { [key in string]: string[] } = {
    '+': [],
    '-': [],
  };

  const chatCommand = (data: TChatMessage) => {
    const { steamID, message } = data;
    if (state.votingActive || voteStarting) {
      adminWarn(execute, steamID, 'В данный момент голосование уже идет!');

      return;
    }
    console.log(vote, 'votemap');
    if (vote) {
      adminWarn(execute, steamID, 'Голосование уже прошло!');
      return;
    }

    if (!voteReadyToStart) {
      adminWarn(
        execute,
        steamID,
        'Голосование будет доступно через 1 минуту после старта карты!',
      );

      return;
    }

    if (!admins?.[steamID]) {
      adminWarn(execute, steamID, 'Команда доступна только Vip пользователям');
      return;
    }

    if (historyPlayers.find((i) => i === steamID)) {
      adminWarn(
        execute,
        steamID,
        'Вы уже запускали голосование, для каждого игрока доступно только одно голосование за игру!',
      );
      return;
    }

    const layersToLowerCase = new Set(
      Object.keys(state.maps).map((map) => map.toLowerCase()),
    );
    const messageToLower = message.toLowerCase().trim().split(' ').join('_');

    let foundMap = false;

    layersToLowerCase.forEach((e) => {
      if (e.includes(messageToLower)) {
        foundMap = true;
        return;
      }
    });

    if (!foundMap || message.length === 0) {
      adminWarn(
        execute,
        steamID,
        'Неправильно указано название карты, список карт можно найти в дискорд канале discord.gg/rn-server плагины!',
      );
      return;
    }

    adminBroadcast(
      execute,
      `Голосование за следующую карту ${message}!\nИспользуйте +(За) -(Против) для голосования`,
    );

    voteStarting = true;
    state.votingActive = true;
    historyPlayers.push(steamID);
    timer = setInterval(() => {
      secondsToEnd = secondsToEnd - voteTick / 1000;
      const positive = votes['+'].length;
      const negative = votes['-'].length;
      const currentVotes = positive - negative <= 0 ? 0 : positive - negative;
      const needVotes = 10;

      if (secondsToEnd <= 0) {
        if (currentVotes >= needVotes) {
          adminBroadcast(
            execute,
            `Голосование завершено!\nСледующая карта ${message}!`,
          );
          adminBroadcast(
            execute,
            `За: ${positive} Против: ${negative} Набрано: ${currentVotes} из ${needVotes} голос(ов)`,
          );

          reset();
          adminSetNextLayer(execute, messageToLower);
          vote = true;
          return;
        }

        adminBroadcast(
          execute,
          'Голосование завершено!\nНе набрано необходимое количество голосов',
        );
        adminBroadcast(
          execute,
          `За: ${positive} Против: ${negative} Набрано: ${currentVotes} из ${needVotes} голос(ов)`,
        );

        reset();
      } else {
        adminBroadcast(
          execute,
          `Голосование за следующую карту ${message}!\nЗа: ${positive} Против: ${negative} Набрано: ${currentVotes} из ${needVotes} голос(ов)`,
        );
        adminBroadcast(execute, 'Используйте +(За) -(Против) для голосования');
      }
    }, voteTick);
  };

  const chatMessage = (data: TChatMessage) => {
    if (!voteStarting) return;
    const { steamID } = data;
    const message = data.message.trim();

    if (message === '+' || message === '-') {
      for (const key in votes) {
        votes[key] = votes[key].filter((p) => p !== steamID);
      }

      votes[message].push(steamID);

      adminWarn(execute, steamID, 'Твой голос принят!');
    }
  };

  const newGame = () => {
    reset();
    vote = false;
    console.log(vote, 'newgame');
    voteReadyToStart = false;
    historyPlayers = [];
    timerDelayStarting = setTimeout(() => {
      voteReadyToStart = true;
    }, 60000);
  };

  listener.on(EVENTS.CHAT_COMMAND_VOTEMAP, chatCommand);
  listener.on(EVENTS.CHAT_MESSAGE, chatMessage);
  listener.on(EVENTS.NEW_GAME, newGame);

  const reset = () => {
    clearTimeout(timerDelayNextStart);
    clearTimeout(timerDelayStarting);
    clearInterval(timer);
    secondsToEnd = voteDuration / 1000;
    voteStarting = false;
    state.votingActive = false;
    votes = {
      '+': [],
      '-': [],
    };
  };
};
