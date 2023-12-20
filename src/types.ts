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
  mapsRegExp: string;
  plugins: string[];
  adminsFilePath: string;
  logFilePath: string;
  ftp?: {
    username: string;
    password: string;
  };
};

export type TServersState = {
  [key in number]: {
    rcon: TRcon;
    logs: TLogs;
    logger: TLogger;
    execute: TExecute;
    listener: EventEmitter;
    maps: TMaps;
    plugins: string[];
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
    tickRate?: string; // TODO
  };
};

export type TMaps = {
  [key in string]: { layerName: string; layerMode: string };
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
  mapsName: string;
  mapsRegExp: string;
  plugins: string[];
  rcon: TRcon;
  logs: TLogs;
};

export type TPlayerTeamChanged = {
  player: TPlayer;
  oldTeamID: string;
  newTeamID: string;
};

export type TPlayerSquadChanged = {
  player: TPlayer;
  oldSquadID?: string | null;
  newSquadID?: string | null;
};

export type TPlayerLeaderChanged = {
  player: TPlayer;
  oldRole: string;
  newRole: string;
  isLeader: boolean;
};

export type TPlayerRoleChanged = {
  player: TPlayer;
  oldRole: string;
  newRole: string;
  isLeader: boolean;
};

export type TEvents = {
  rconEmitter: EventEmitter;
  logsEmitter: EventEmitter;
};

export type TError = {
  id?: number;
  message: string;
};

export type TState = TGetServersState;

export type TGetAdmins = LogsReader['getAdminsFile'];
export type TLogger = ReturnType<typeof initLogger>;
export type TExecute = ReturnType<typeof Rcon>['execute'];
export type TGetServersState = ReturnType<typeof getServersState>;

export type TRcon = {
  execute: TExecute;
  rconEmitter: EventEmitter;
  close: () => Promise<unknown>;
};
export type TLogs = {
  logsEmitter: EventEmitter;
  getAdmins: TGetAdmins;
  close: () => Promise<void>;
};
