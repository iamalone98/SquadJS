import { LogsReader, TLogReaderOptions } from 'squad-logs';
import { Rcon } from 'squad-rcon';
import { TConfig, TLogs, TRcon } from '../types';

const initRcon = async (config: TConfig) =>
  new Promise<TRcon>(async (res, rej) => {
    const { id, host, port, password } = config;
    try {
      const rcon = new Rcon({
        id,
        host,
        port,
        password,
      });

      await rcon.init();

      res({
        rconEmitter: rcon,
        close: rcon.close.bind(rcon),
        execute: rcon.execute.bind(rcon),
      });
    } catch (error) {
      rej(`RCON error: ${error}`);
    }
  });

const initLogs = async (config: TConfig) =>
  new Promise<TLogs>(async (res, rej) => {
    try {
      const { id, host, ftp, logFilePath, adminsFilePath } = config;
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

      await logsReader.init();

      res({
        logsEmitter: logsReader,
        getAdmins: logsReader.getAdminsFile.bind(logsReader),
        close: logsReader.close.bind(logsReader),
      });
    } catch (error) {
      rej(`LOGS error: ${error}`);
    }
  });

export const initParsers = async (config: TConfig): Promise<[TRcon, TLogs]> => {
  const rcon = await initRcon(config);
  const logs = await initLogs(config);

  return [rcon, logs];
};
