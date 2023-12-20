import EventEmitter from 'events';
import { LogsReaderEvents } from 'squad-logs';
import { RconEvents } from 'squad-rcon';
import { TEvents } from '../../types';
import { chatCommandParser, convertObjToArrayEvents } from './helpers';

export const initEvents = ({ rconEmitter, logsEmitter }: TEvents) => {
  const coreEmitter = new EventEmitter();
  const localEmitter = new EventEmitter();

  coreEmitter.setMaxListeners(20);
  localEmitter.setMaxListeners(30);

  const rconEvents = convertObjToArrayEvents(RconEvents);
  const logsEvents = convertObjToArrayEvents(LogsReaderEvents);

  /* RCON EVENTS */

  rconEvents.forEach((event) => {
    rconEmitter.on(event, (data) => coreEmitter.emit(event, data));
  });

  /* LOGS EVENTS */

  logsEvents.forEach((event) => {
    logsEmitter.on(event, (data) => coreEmitter.emit(event, data));
  });

  chatCommandParser(coreEmitter);

  return { coreEmitter, localEmitter };
};
