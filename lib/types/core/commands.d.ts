import { TExecute } from '../types';
export declare const adminEndMatch: (execute: TExecute) => Promise<void>;
export declare const adminBroadcast: (execute: TExecute, str: string) => Promise<void>;
export declare const adminChangeLayer: (execute: TExecute, str: string) => Promise<void>;
export declare const adminSetNextLayer: (execute: TExecute, str: string) => Promise<void>;
export declare const adminWarn: (execute: TExecute, steamID: string, reason: string) => Promise<void>;
