import { EVENTS } from '../constants';
import { adminKillServer } from '../core';
import { TPluginProps } from '../types';

export const autorestartServers: TPluginProps = (state) => {
  const { listener, execute, logger } = state;
  let isTimeToRestart = false;
  const restartInterval = 24 * 60 * 60 * 1000; //24h
  let restartTimeout: NodeJS.Timeout;
  let isRestartTimeoutSet = false;

  setInterval(() => {
    isTimeToRestart = true;
  }, restartInterval);

  const setRestartTimeout = () => {
    restartTimeout = setTimeout(() => {
      logger.log('Рестарт сервера...');
      adminKillServer(execute);
      isRestartTimeoutSet = false;
      isTimeToRestart = false;
    }, 300000);

    isRestartTimeoutSet = true;
  };

  const clearRestartTimeout = () => {
    clearTimeout(restartTimeout);
    isRestartTimeoutSet = false;
  };

  const autorestart = (data: string) => {
    if (data.length === 0 && isTimeToRestart) {
      if (isRestartTimeoutSet) {
        clearRestartTimeout();
      } else {
        setRestartTimeout();
      }
    } else {
      if (isRestartTimeoutSet) {
        clearRestartTimeout();
      }
    }
  };

  listener.on(EVENTS.UPDATED_PLAYERS, autorestart);
};
