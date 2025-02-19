import { TPlayerConnected, TTickRate } from 'squad-logs';
import { EVENTS, UPDATE_TIMEOUT } from '../../constants';
import { TGetAdmins } from '../../types';
import { getServersState } from '../serversState';
import { updateAdmins } from './updateAdmins';
import { updateCurrentMap } from './updateCurrentMap';
import { updateNextMap } from './updateNextMap';
import { updatePlayers } from './updatePlayers';
import { updateServerInfo } from './updateServerInfo';
import { updateSquads } from './updateSquads';

export const initUpdaters = async (id: number, getAdmins: TGetAdmins) => {
  await updateAdmins(id, getAdmins);
  await updateCurrentMap(id);
  await updateNextMap(id);
  await updatePlayers(id);
  await updateSquads(id);
  await updateServerInfo(id);

  const state = getServersState(id);
  const { coreListener, listener } = state;

  let updateTimeout: NodeJS.Timeout;
  let canRunUpdateInterval = true;
  setInterval(async () => {
    if (!canRunUpdateInterval) return;
    await updatePlayers(id);
    await updateSquads(id);
    await updateServerInfo(id);
  }, UPDATE_TIMEOUT);

  const updatesOnEvents = async () => {
    canRunUpdateInterval = false;
    clearTimeout(updateTimeout);
    await updatePlayers(id);
    await updateSquads(id);
    await updateServerInfo(id);
    updateTimeout = setTimeout(
      () => (canRunUpdateInterval = true),
      UPDATE_TIMEOUT,
    );
  };

  for (const key in EVENTS) {
    const event = EVENTS[key as keyof typeof EVENTS];
    coreListener.on(event, async (data) => {
      if (event === EVENTS.PLAYER_CONNECTED) {
        const player = data as TPlayerConnected;
        const players = state.players;

        state.players = players
          ? players.map((p) =>
              p.steamID === player.steamID ? { ...p, ip: player.ip } : p,
            )
          : [];
      }

      if (event === EVENTS.PLAYER_CONNECTED || event === EVENTS.SQUAD_CREATED) {
        await updatesOnEvents();
      }

      if (event === EVENTS.NEW_GAME) {
        await updateAdmins(id, getAdmins);
        await updateCurrentMap(id);
        await updateNextMap(id);
      }

      if (event === EVENTS.TICK_RATE) {
        const tickRateData = data as TTickRate;

        state.tickRate = tickRateData.tickRate;
      }

      listener.emit(event, data);
    });
  }
};
