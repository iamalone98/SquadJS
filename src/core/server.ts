import EventEmitter from 'events';
import { LogsReader, TLogReaderOptions } from 'squad-logs';
import { Rcon } from 'squad-rcon';
import { TConfig, TExecute, TGetAdmins } from '../types';

type TPromiseRcon = { execute: TExecute; rconEmitter: EventEmitter };
type TPromiseLogs = {
  logsEmitter: EventEmitter;
  getAdmins: TGetAdmins;
};

export const initServer = (config: TConfig) => {
  const { id, host, port, password, ftp, logFilePath, adminsFilePath } = config;

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
        adminsFilePath,
        filePath: logFilePath,
        username: ftp.username,
        password: ftp.password,
        readType: 'remote',
      }
    : { id, filePath: logFilePath, adminsFilePath, readType: 'local' };

  const logsReader = new LogsReader(logsReaderConfig as TLogReaderOptions);

  logsReader.init();

  return Promise.all([
    new Promise<TPromiseRcon>((res) =>
      rconEmitter.on('connected', () => res({ execute, rconEmitter })),
    ),
    new Promise<TPromiseLogs>((res) =>
      logsReader.on('connected', () =>
        res({
          logsEmitter: logsReader,
          getAdmins: logsReader.getAdminsFile.bind(logsReader),
        }),
      ),
    ),
  ]);
};
