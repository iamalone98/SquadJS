import { TChatMessage } from 'squad-rcon';
import { EVENTS } from '../constants';
import { adminBroadcast, adminEndMatch, adminWarn } from '../core';
import { TPluginProps } from '../types';

export const skipmap: TPluginProps = (state, options) => {
  const { listener, execute } = state;
  const { voteTick, voteDuration, voteRepeatDelay, onlyForVip, needVotes } =
    options;
  let voteReadyToStart = true;
  let voteStarting = false;
  let voteStartingRepeat = true;
  let secondsToEnd = voteDuration / 1000;
  let timer: NodeJS.Timeout;
  let timerDelayStarting: NodeJS.Timeout;
  let timerDelayNextStart: NodeJS.Timeout;
  let historyPlayers: string[] = [];
  let votes: { [key in string]: string[] } = {
    '+': [],
    '-': [],
  };

  const chatCommand = (data: TChatMessage) => {
    const { steamID } = data;
    const { admins } = state;
    if (state.votingActive || voteStarting) {
      adminWarn(execute, steamID, 'В данный момент голосование уже идет!');

      return;
    }

    if (!voteStartingRepeat) {
      adminWarn(
        execute,
        steamID,
        'Должно пройти 15 минут после последнего использования skipmap!',
      );

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

    if (onlyForVip && !admins?.[steamID]) {
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

    adminBroadcast(
      execute,
      'Голосование за пропуск текущей карты!\nИспользуйте +(За) -(Против) для голосования',
    );

    historyPlayers.push(steamID);
    state.votingActive = true;
    voteStarting = true;
    voteStartingRepeat = false;
    timer = setInterval(() => {
      secondsToEnd = secondsToEnd - voteTick / 1000;
      const positive = votes['+'].length;
      const negative = votes['-'].length;
      const currentVotes = positive - negative <= 0 ? 0 : positive - negative;

      if (secondsToEnd <= 0) {
        if (currentVotes >= needVotes) {
          adminBroadcast(execute, 'Голосование завершено!\nМатч завершается!');
          adminBroadcast(
            execute,
            `За: ${positive} Против: ${negative} Набрано: ${currentVotes} из ${needVotes} голос(ов)`,
          );
          state.skipmap = true;
          reset();
          adminEndMatch(execute);

          return;
        }

        timerDelayNextStart = setTimeout(() => {
          voteStartingRepeat = true;
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
    clearTimeout(timerDelayNextStart);
    historyPlayers = [];
    voteReadyToStart = false;
    voteStartingRepeat = true;
    state.skipmap = false;
    timerDelayStarting = setTimeout(() => {
      voteReadyToStart = true;
    }, 60000);
  };

  listener.on(EVENTS.CHAT_COMMAND_SKIPMAP, chatCommand);
  listener.on(EVENTS.CHAT_MESSAGE, chatMessage);
  listener.on(EVENTS.NEW_GAME, newGame);

  const reset = () => {
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
