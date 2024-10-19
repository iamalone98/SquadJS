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

export const adminDisbandSquad = async (
  execute: TExecute,
  teamID: string,
  squadID: string,
) => {
  await execute(`AdminDisbandSquad ${teamID} ${squadID}`);
};

export const adminWarn = async (
  execute: TExecute,
  steamID: string,
  reason: string,
) => {
  await execute(`AdminWarn ${steamID} ${reason}`);
};

export const adminKick = async (
  execute: TExecute,
  steamID: string,
  reason: string,
) => {
  await execute(`AdminKick ${steamID} ${reason}`);
};

export const adminBan = async (
  execute: TExecute,
  steamID: string,
  reason: string,
) => {
  await execute(`AdminBan ${steamID} ${reason}`);
};

export const adminForceTeamChange = async (
  execute: TExecute,
  steamID: string,
) => {
  await execute(`AdminForceTeamChange ${steamID}`);
};

export const adminDemoteCommander = async (
  execute: TExecute,
  steamID: string,
) => {
  await execute(`AdminDemoteCommander ${steamID}`);
};

export const adminRemovePlayerFromSquad = async (
  execute: TExecute,
  steamID: string,
) => {
  await execute(`AdminRemovePlayerFromSquad ${steamID}`);
};

export const adminKillServer = async (execute: TExecute) => {
  await execute('AdminKillServer');
};

export const adminRenameSquad = async (
  execute: TExecute,
  teamID: string,
  squadID: string,
) => {
  await execute(`AdminRenameSquad ${teamID} ${squadID}`);
};
