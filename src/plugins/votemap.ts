import { TChatMessage } from 'squad-rcon';
import { EVENTS } from '../constants';
import { adminBroadcast, adminSetNextLayer, adminWarn } from '../core';
import { TState } from '../types';

export const voteMap = (state: TState) => {
  const { listener, execute } = state;
  const voteTick = 30000;
  const voteDuration = 120000;
  const voteRepeatDelay = 60000 * 10;
  let voteReadyToStart = false;
  let voteStarting = false;
  let secondsToEnd = voteDuration / 1000;
  let timer: NodeJS.Timeout;
  let timerDelayStarting: NodeJS.Timeout;
  let timerDelayNextStart: NodeJS.Timeout;
  let votes: { [key in string]: string[] } = {
    '+': [],
    '-': [],
  };

  const chatCommand = (data: TChatMessage) => {
    console.log(data);
    const { steamID, message } = data;
    console.log(data);
    if (state.votingActive || voteStarting) {
      adminWarn(execute, steamID, 'В данный момент голосование уже идет!');

      return;
    }

    // if (!voteReadyToStart) {
    //   adminWarn(
    //     execute,
    //     steamID,
    //     'Голосование будет доступно через 1 минуту после старта карты!',
    //   );

    //   return;
    // }

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

    if (!foundMap) {
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

    timer = setInterval(() => {
      secondsToEnd = secondsToEnd - voteTick / 1000;
      const positive = votes['+'].length;
      const negative = votes['-'].length;
      const currentVotes = positive - negative <= 0 ? 0 : positive - negative;
      const needVotes = 1;

      voteStarting = true;
      state.votingActive = true;

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

          return;
        }

        timerDelayNextStart = setTimeout(() => {
          voteStarting = false;
        }, voteRepeatDelay);

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
    () => {
      reset();

      timerDelayStarting = setTimeout(() => {
        voteReadyToStart = true;
      }, 60000);
    };
  };

  listener.on(EVENTS.CHAT_COMMAND_VOTEMAP, chatCommand);
  listener.on(EVENTS.CHAT_MESSAGE, chatMessage);
  listener.on(EVENTS.NEW_GAME, newGame);

  const reset = () => {
    clearTimeout(timerDelayNextStart);
    clearTimeout(timerDelayStarting);
    clearInterval(timer);
    voteStarting = false;
    state.votingActive = false;
    votes = {
      '+': [],
      '-': [],
    };
  };
};
