import EventEmitter from 'events';
import { Rcon } from 'squad-rcon';
import { initLogger } from './logger';

type Logger = ReturnType<typeof initLogger>;

export type TConfig = {
  id: number;
  host: string;
  password: string;
  port: number;
  pluginsEnabled: string[];
  logFilePath?: string;
  ftp?: {
    logFilePath: string;
    username: string;
    password: string;
  };
};

export type TServersState = {
  [key in number]: {
    logger: Logger;
    execute: TExecute;
    listener: EventEmitter;
    players?: TPlayer[];
    squads?: TSquad[];
    playersCount?: number;
    currentMap?: {
      level: string | null;
      layer: string | null;
    };
    nextMap?: {
      level: string | null;
      layer: string | null;
    };
    tickRate?: string;
  };
};

export type TPlayer = {
  name: string;
  eosID: string;
  steamID: string;
  teamID: string;
  role: string;
  isLeader: boolean;
  squadID?: string | null;
};

export type TSquad = {
  squadID: string;
  squadName: string;
  size: string;
  locked: string;
  creatorName: string;
  creatorEOSID: string;
  creatorSteamID: string;
  teamID: string | null;
  teamName: string | null;
};

export type TExecute = ReturnType<typeof Rcon>['execute'];

export type TSquadJS = {
  id: number;
  execute: TExecute;
  rconEmitter: EventEmitter;
  logsEmitter: EventEmitter;
};

export type TEvents = {
  rconEmitter: EventEmitter;
  logsEmitter: EventEmitter;
};
