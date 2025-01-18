import { TState } from '../types';

export const getPlayerBySteamID = (state: TState, steamID: string) =>
  state.players?.find((player) => player.steamID === steamID) || null;

export const getPlayerByEOSID = (state: TState, eosID: string) =>
  state.players?.find((player) => player.eosID === eosID) || null;

export const getPlayerByName = (state: TState, name: string) =>
  state.players?.find((player) => player.name.includes(name)) || null;

export const getSquadByID = (state: TState, squadID: string, teamID: string) =>
  state.squads?.find(
    (squad) => squad.squadID === squadID && squad.teamID === teamID,
  ) || null;

export const getAdmins = (state: TState) =>
  state.admins
    ? Object.keys(state.admins).filter((admin) => state.admins?.[admin]['ban'])
    : null;

export const getVips = (state: TState) =>
  state.admins
    ? Object.keys(state.admins).filter(
        (admin) => state.admins?.[admin]['reserved'],
      )
    : null;
