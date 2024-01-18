import { TState } from '../types';
export declare const getPlayerBySteamID: (state: TState, steamID: string) => import("../types").TPlayer | null;
export declare const getPlayerByEOSID: (state: TState, eosID: string) => import("../types").TPlayer | null;
export declare const getPlayerByName: (state: TState, name: string) => import("../types").TPlayer | null;
export declare const getSquadByID: (state: TState, squadID: string) => import("../types").TSquad | null;
export declare const getAdmins: (state: TState, adminPermission: string) => string[] | null;
export declare const getVips: (state: TState) => string[] | null;
export declare const getPlayers: (state: TState) => import("../types").TPlayer[] | undefined;
