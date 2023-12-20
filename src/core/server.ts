import { LogsReader, TLogReaderOptions } from 'squad-logs';
import { Rcon } from 'squad-rcon';
import { TConfig, TLogs, TRcon } from '../types';

export const initServer = async (config: TConfig) => {
  const { id, host, port, password, ftp, logFilePath, adminsFilePath } = config;

  const { rconEmitter, execute, close } = Rcon({
    id,
    host,
    port,
    password,
    autoReconnect: false,
  });

  const logsReaderConfig = ftp
    ? {
        id,
        host,
        adminsFilePath,
        autoReconnect: false,
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
        autoReconnect: false,
      };

  const logsReader = new LogsReader(logsReaderConfig as TLogReaderOptions);

  return Promise.all([
    new Promise<TRcon>((res) =>
      rconEmitter.on('connected', () => res({ execute, rconEmitter, close })),
    ),
    new Promise<TLogs>(async (res) => {
      await logsReader.init();
      res({
        logsEmitter: logsReader,
        getAdmins: logsReader.getAdminsFile.bind(logsReader),
        close: logsReader.close.bind(logsReader),
      });
    }),
  ]);
};
