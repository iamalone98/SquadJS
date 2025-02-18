import { TServersState } from '../types';

export const serversState: TServersState = {};

export const getServersState = (id: number) => serversState[id];
