import { TChatMessage } from 'squad-rcon';
import { EVENTS } from '../constants';
import { adminBroadcast, adminEndMatch, adminWarn } from '../core';
import { TPlugin } from '../types';

export const skipmap = (state: TPlugin) => {
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

  listener.on(EVENTS.CHAT_COMMANDS_SKIPMAP, (data: TChatMessage) => {
    const { steamID } = data;

    if (state.votingActive || voteStarting) {
      adminWarn(execute, steamID, 'В данный момент голосование уже идет!');

      return;
    }

    if (!voteReadyToStart) {
      adminWarn(
        execute,
        steamID,
        'Голосование за завершение матча будет доступно через 1 минуту после начала матча!',
      );

      return;
    }

    adminBroadcast(
      execute,
      'Голосование за пропуск текущей карты!\nИспользуйте +(За) -(Против) для голосования',
    );

    timer = setInterval(() => {
      secondsToEnd = secondsToEnd - voteTick / 1000;
      const positive = votes['+'].length;
      const negative = votes['-'].length;
      const currentVotes = positive - negative <= 0 ? 0 : positive - negative;
      const needVotes = 15;

      voteStarting = true;
      state.votingActive = true;

      if (secondsToEnd <= 0) {
        if (currentVotes >= needVotes) {
          adminBroadcast(execute, 'Голосование завершено!\nМатч завершается!');
          adminBroadcast(
            execute,
            `За: ${positive} Против: ${negative} Набрано: ${currentVotes} из ${needVotes} голос(ов)`,
          );

          reset();
          adminEndMatch(execute);

          return;
        }

        timerDelayNextStart = setTimeout(() => {
          voteStarting = false;
        }, voteRepeatDelay);

        adminBroadcast(
          execute,
          'Голосование завершено!\nНе набрано необходимое количество голосов за пропуск текущей карты',
        );
        adminBroadcast(
          execute,
          `За: ${positive} Против: ${negative} Набрано: ${currentVotes} из ${needVotes} голос(ов)`,
        );

        reset();
      } else {
        adminBroadcast(
          execute,
          `Голосование за пропуск текущей карты!\nЗа: ${positive} Против: ${negative} Набрано: ${currentVotes} из ${needVotes} голос(ов)`,
        );
        adminBroadcast(execute, 'Используйте +(За) -(Против) для голосования');
      }
    }, voteTick);
  });

  listener.on(EVENTS.CHAT_MESSAGE, (data: TChatMessage) => {
    const { steamID } = data;
    const message = data.message.trim();

    if (message === '+' || message === '-') {
      for (const key in votes) {
        votes[key] = votes[key].filter((p) => p !== steamID);
      }

      votes[message].push(steamID);

      adminWarn(execute, steamID, 'Твой голос принят!');
    }
  });

  listener.on(EVENTS.NEW_GAME, () => {
    reset();

    timerDelayStarting = setTimeout(() => {
      voteReadyToStart = true;
    }, 60000);
  });

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
