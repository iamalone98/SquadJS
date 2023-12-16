import EventEmitter from 'events';
import { TChatMessage } from 'squad-rcon';
import { EVENTS } from '../../constants';

export const convertObjToArrayEvents = (events: {
  [key in string]: string;
}) => Object.keys(events).map((event) => event);

export const chatCommandParser = (listener: EventEmitter) => {
  listener.on(EVENTS.CHAT_MESSAGE, (data: TChatMessage) => {
    const command = data.message.match(/!([^ ]+) ?(.*)/);
    if (command)
      listener.emit(`CHAT_COMMAND:${command[1].toLowerCase()}`, {
        ...data,
        message: command[2].trim(),
      });
  });
};
