import EventEmitter from 'events';
import { LogsReader } from 'squad-logs';
import { TServerInfo } from 'squad-rcon';
import { initLogger } from './core/logger';
import { TPluginsState } from './plugins/types';

export type TConfig = {
  id: number;
  host: string;
  password: string;
  port: number;
  mapsName: string;
  mapsRegExp: string;
  plugins: TPlugin[];
  adminsFilePath: string;
  logFilePath: string;
  ftp?: {
    username: string;
    password: string;
  };
};

export type TServersState = {
  [key in number]: {
    id: number;
    rcon: TRcon;
    logs: TLogs;
    logger: TLogger;
    execute: TExecute;
    coreListener: EventEmitter;
    listener: EventEmitter;
    maps: TMaps;
    plugins: TPlugin[];
    // boolean for check current voting in plugins
    // votemap or skipmap
    votingActive?: boolean;
    admins?: TAdmin;
    players?: TPlayer[];
    squads?: TSquad[];
    currentMap?: {
      level: string | null;
      layer: string | null;
    };
    nextMap?: {
      level: string | null;
      layer: string | null;
    };
    tickRate?: number;
    serverInfo?: TServerInfo;
  } & TPluginsState;
};

export type TMaps = {
  [key in string]: { layerName: string; layerMode: string };
};

export type TAdmin = {
  [key in string]: { [key in string]: boolean };
};

export type TPluginProps<T = unknown> = (state: TState, options: T) => void;

export type TPlugin = {
  name: string;
  enabled: boolean;
  options: any;
};

export type TPlayer = {
  name: string;
  eosID: string;
  steamID: string;
  teamID: string;
  role: string;
  isLeader: boolean;
  squadID?: string | null;
  ip?: string;
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

export type TState = TServersState[number];
export type TGetAdmins = LogsReader['getAdminsFile'];
export type TExecute = (command: string) => Promise<string>;
export type TLogger = ReturnType<typeof initLogger>;

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
