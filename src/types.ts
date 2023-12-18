import EventEmitter from 'events';
import { LogsReader } from 'squad-logs';
import { Rcon } from 'squad-rcon';
import { initLogger } from './logger';
import { getServersState } from './serversState';

export type TConfig = {
  id: number;
  host: string;
  password: string;
  port: number;
  mapsName: string;
  pluginsEnabled: string[];
  adminsFilePath: string;
  logFilePath: string;
  ftp?: {
    username: string;
    password: string;
  };
};

export type TServersState = {
  [key in number]: {
    logger: TLogger;
    execute: TExecute;
    listener: EventEmitter;
    maps: string[];
    // boolean for check current voting in plugins
    // votemap or skipmap
    votingActive?: boolean;
    admins?: TAdmin;
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

export type TAdmin = {
  [key in string]: { [key in string]: boolean };
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

export type TSquadJS = {
  id: number;
  execute: TExecute;
  mapsName: string;
  getAdmins: TGetAdmins;
  rconEmitter: EventEmitter;
  logsEmitter: EventEmitter;
};

export type TEvents = {
  rconEmitter: EventEmitter;
  logsEmitter: EventEmitter;
};

export type TPlugin = TGetServersState;

export type TGetAdmins = LogsReader['getAdminsFile'];
export type TLogger = ReturnType<typeof initLogger>;
export type TExecute = ReturnType<typeof Rcon>['execute'];
export type TGetServersState = ReturnType<typeof getServersState>;
