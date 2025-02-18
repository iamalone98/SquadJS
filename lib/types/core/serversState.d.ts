/// <reference types="node" />
import { TServersState } from '../types';
export declare const serversState: TServersState;
export declare const getServersState: (id: number) => {
  id: number;
  rcon: import('../types').TRcon;
  logs: import('../types').TLogs;
  logger: {
    log: (...text: string[]) => void;
    warn: (...text: string[]) => void;
    error: (...text: string[]) => void;
  };
  execute: import('../types').TExecute;
  coreListener: import('events');
  listener: import('events');
  maps: import('../types').TMaps;
  plugins: import('../types').TPlugin[];
  votingActive?: boolean | undefined;
  admins?: import('../types').TAdmin | undefined;
  players?: import('../types').TPlayer[] | undefined;
  squads?: import('../types').TSquad[] | undefined;
  currentMap?:
    | {
        level: string | null;
        layer: string | null;
      }
    | undefined;
  nextMap?:
    | {
        level: string | null;
        layer: string | null;
      }
    | undefined;
  tickRate?: number | undefined;
  serverInfo?: import('squad-rcon').TServerInfo | undefined;
} & import('../plugins/types').TPluginsState;
