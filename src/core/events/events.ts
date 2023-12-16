import EventEmitter from 'events';
import { LogsReaderEvents } from 'squad-logs';
import { RconEvents } from 'squad-rcon';
import { TEvents } from '../../types';
import { convertObjToArrayEvents } from './helpers';

export const initEvents = ({ rconEmitter, logsEmitter }: TEvents) => {
  const emitter = new EventEmitter();

  emitter.setMaxListeners(20);

  const rconEvents = convertObjToArrayEvents(RconEvents);
  const logsEvents = convertObjToArrayEvents(LogsReaderEvents);

  /* RCON EVENTS */

  rconEvents.forEach((event) => {
    rconEmitter.on(event, (data) => emitter.emit(event, data));
  });

  rconEmitter.on('ListPlayers', (data) =>
    emitter.emit('ListPlayers', data),
  );
  rconEmitter.on('ListSquads', (data) =>
    emitter.emit('ListSquads', data),
  );

  /* LOGS EVENTS */

  logsEvents.forEach((event) => {
    logsEmitter.on(event, (data) => emitter.emit(event, data));
  });

  return emitter;
};
