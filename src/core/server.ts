import EventEmitter from 'events';
import { LogsReader, TLogReaderOptions } from 'squad-logs';
import { Rcon } from 'squad-rcon';
import { TConfig, TExecute } from '../types';

type TPromiseRcon = { execute: TExecute; rconEmitter: EventEmitter };
type TPromiseLogs = { logsEmitter: EventEmitter };

export const initServer = (config: TConfig) => {
  const { id, host, port, password, ftp, logFilePath } = config;

  const { rconEmitter, execute } = Rcon({
    id,
    host,
    port,
    password,
  });

  const logsReaderConfig = ftp
    ? {
        id,
        host,
        remoteFilePath: ftp.logFilePath,
        username: ftp.username,
        password: ftp.password,
      }
    : { id, localFilePath: logFilePath };

  const logsEmitter = LogsReader(
    logsReaderConfig as TLogReaderOptions,
  );

  return Promise.all([
    new Promise<TPromiseRcon>((res) =>
      rconEmitter.on('connected', () =>
        res({ execute, rconEmitter }),
      ),
    ),
    new Promise<TPromiseLogs>((res) =>
      logsEmitter.on('connected', () => res({ logsEmitter })),
    ),
  ]);
};
