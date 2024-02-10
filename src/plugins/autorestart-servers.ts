import { EVENTS } from '../constants';
import { adminKillServer } from '../core';
import {
  createTimeStampForRestartServer,
  getTimeStampForRestartServer,
} from '../rnsdb';
import { TPluginProps } from '../types';

export const autorestartServers: TPluginProps = (state) => {
  const { listener, execute, logger, id } = state;
  let restartTimeout: NodeJS.Timeout;
  let isRestartTimeoutSet = false;

  const setRestartTimeout = () => {
    restartTimeout = setTimeout(async () => {
      logger.log('Рестарт сервера...');
      await createTimeStampForRestartServer(id);
      await adminKillServer(execute);
      isRestartTimeoutSet = false;
    }, 300000);

    isRestartTimeoutSet = true;
  };

  const clearRestartTimeout = () => {
    clearTimeout(restartTimeout);
    isRestartTimeoutSet = false;
  };

  const autorestart = async (data: string) => {
    const lastRestartTime = await getTimeStampForRestartServer(id);
    if (!lastRestartTime) return;
    if (new Date().getTime() - lastRestartTime > 86400000) {
      if (data.length === 0) {
        if (!isRestartTimeoutSet) setRestartTimeout();
      } else {
        if (isRestartTimeoutSet) {
          clearRestartTimeout();
        }
      }
    }
  };

  listener.on(EVENTS.UPDATED_PLAYERS, autorestart);
};
