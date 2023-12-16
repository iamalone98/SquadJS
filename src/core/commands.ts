import { TExecute } from '../types';

export const adminEndMatch = async (execute: TExecute) => {
  await execute('AdminEndMatch');
};

export const adminBroadcast = async (execute: TExecute, str: string) => {
  await execute(`AdminBroadcast ${str}`);
};

export const adminChangeLayer = async (execute: TExecute, str: string) => {
  await execute(`AdminChangeLayer ${str}`);
};

export const adminSetNextLayer = async (execute: TExecute, str: string) => {
  await execute(`AdminSetNextLayer ${str}`);
};

export const adminWarn = async (
  execute: TExecute,
  steamID: string,
  reason: string,
) => {
  await execute(`AdminWarn ${steamID} ${reason}`);
};
