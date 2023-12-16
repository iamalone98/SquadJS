import EventEmitter from 'events';
import { LogsReaderEvents } from 'squad-logs';
import { RconEvents } from 'squad-rcon';
import { EVENTS } from '../../constants';
import { TEvents } from '../../types';
import {
  chatCommandParser,
  convertObjToArrayEvents,
} from './helpers';

export const initEvents = ({ rconEmitter, logsEmitter }: TEvents) => {
  const emitter = new EventEmitter();

  emitter.setMaxListeners(20);

  const rconEvents = convertObjToArrayEvents(RconEvents);
  const logsEvents = convertObjToArrayEvents(LogsReaderEvents);

  /* RCON EVENTS */

  rconEvents.forEach((event) => {
    rconEmitter.on(event, (data) => emitter.emit(event, data));
  });

  rconEmitter.on(EVENTS.LIST_PLAYERS, (data) =>
    emitter.emit(EVENTS.LIST_PLAYERS, data),
  );
  rconEmitter.on(EVENTS.LIST_SQUADS, (data) =>
    emitter.emit(EVENTS.LIST_SQUADS, data),
  );
  rconEmitter.on(EVENTS.SHOW_CURRENT_MAP, (data) =>
    emitter.emit(EVENTS.SHOW_CURRENT_MAP, data),
  );
  rconEmitter.on(EVENTS.SHOW_NEXT_MAP, (data) =>
    emitter.emit(EVENTS.SHOW_NEXT_MAP, data),
  );

  /* LOGS EVENTS */

  logsEvents.forEach((event) => {
    logsEmitter.on(event, (data) => emitter.emit(event, data));
  });

  chatCommandParser(emitter);

  return emitter;
};
