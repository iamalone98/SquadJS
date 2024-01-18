import { LogsReader, TLogReaderOptions } from 'squad-logs';
import { Rcon } from 'squad-rcon';
import { TConfig, TLogs, TRcon } from '../types';

export const initServer = async (config: TConfig) => {
  const { id, host, port, password, ftp, logFilePath, adminsFilePath } = config;

  const rcon = new Rcon({
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
        autoReconnect: true,
        filePath: logFilePath,
        username: ftp.username,
        password: ftp.password,
        readType: 'remote',
      }
    : {
        id,
        filePath: logFilePath,
        adminsFilePath,
        readType: 'local',
        autoReconnect: true,
      };

  const logsReader = new LogsReader(logsReaderConfig as TLogReaderOptions);

  return Promise.all([
    new Promise<TRcon>(async (res, rej) => {
      try {
        await rcon.init();

        res({
          rconEmitter: rcon,
          close: rcon.close.bind(rcon),
          execute: rcon.execute.bind(rcon),
        });
      } catch (error) {
        rej(error);
      }
    }),
    new Promise<TLogs>(async (res, rej) => {
      try {
        await logsReader.init();
        res({
          logsEmitter: logsReader,
          getAdmins: logsReader.getAdminsFile.bind(logsReader),
          close: logsReader.close.bind(logsReader),
        });
      } catch (error) {
        rej(error);
      }
    }),
  ]);
};
