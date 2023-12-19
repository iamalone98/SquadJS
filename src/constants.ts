import { LogsReaderEvents } from 'squad-logs';
import { RconEvents } from 'squad-rcon';

export const EVENTS = {
  ...RconEvents,
  ...LogsReaderEvents,
  UPDATED_ADMINS: 'UPDATED_ADMINS',
  UPDATED_PLAYERS: 'UPDATED_PLAYERS',
  UPDATED_SQUADS: 'UPDATED_SQUADS',

  // CHAT COMMANDS

  CHAT_COMMANDS_SKIPMAP: 'CHAT_COMMAND:skipmap',
};

export const UPDATERS_REJECT_TIMEOUT = 10000;
