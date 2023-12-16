import { LogsReaderEvents } from 'squad-logs';
import { RconEvents } from 'squad-rcon';

export const EVENTS = {
  ...RconEvents,
  ...LogsReaderEvents,
  LIST_PLAYERS: 'ListPlayers',
  LIST_SQUADS: 'ListSquads',
  UPDATED_PLAYERS: 'UPDATED_PLAYERS',
  UPDATED_SQUADS: 'UPDATED_SQUADS',
  SHOW_CURRENT_MAP: 'ShowCurrentMap',
  SHOW_NEXT_MAP: 'ShowNextMap',

  // CHAT COMMANDS

  CHAT_COMMANDS_SKIPMAP: 'CHAT_COMMAND:skipmap',
};
