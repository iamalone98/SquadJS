import { TPlayerDamaged, TPlayerPossess, TTickRate } from 'squad-logs';
import { UPDATE_TIMEOUT } from '../../constants';
import { getServersState } from '../../serversState';
import { TGetAdmins } from '../../types';
import { EVENTS } from './../../constants';
import { updateAdmins } from './updateAdmins';
import { updateCurrentMap } from './updateCurrentMap';
import { updateNextMap } from './updateNextMap';
import { updatePlayers } from './updatePlayers';
import { updateSquads } from './updateSquads';

export const initState = async (id: number, getAdmins: TGetAdmins) => {
  await updateAdmins(id, getAdmins);
  await updateCurrentMap(id);
  await updateNextMap(id);
  await updatePlayers(id);
  await updateSquads(id);

  const state = getServersState(id);
  const { coreListener, listener } = state;

  let updateTimeout: NodeJS.Timeout;
  let canRunUpdateInterval = true;
  setInterval(async () => {
    if (!canRunUpdateInterval) return;
    await updatePlayers(id);
    await updateSquads(id);
  }, UPDATE_TIMEOUT);

  const updatesOnEvents = async () => {
    canRunUpdateInterval = false;
    clearTimeout(updateTimeout);
    await updatePlayers(id);
    await updateSquads(id);
    updateTimeout = setTimeout(
      () => (canRunUpdateInterval = true),
      UPDATE_TIMEOUT,
    );
  };

  for (const key in EVENTS) {
    const event = EVENTS[key as keyof typeof EVENTS];
    coreListener.on(event, async (data) => {
      if (event === EVENTS.PLAYER_CONNECTED || event === EVENTS.SQUAD_CREATED) {
        await updatesOnEvents();
      }

      if (event === EVENTS.NEW_GAME) {
        await updateAdmins(id, getAdmins);
        await updateCurrentMap(id);
        await updateNextMap(id);
      }

      if (
        event === EVENTS.PLAYER_ROLE_CHANGED ||
        event === EVENTS.PLAYER_LEADER_CHANGED
      ) {
        await updatePlayers(id);
      }

      if (event === EVENTS.TICK_RATE) {
        const tickRateData = data as TTickRate;

        state.tickRate = tickRateData.tickRate;
      }

      if (event === EVENTS.PLAYER_POSSESS) {
        const player = data as TPlayerPossess;
        if (state.players && player) {
          state.players = state.players?.map((p) => {
            if (p.steamID === player.steamID) {
              return {
                ...p,
                possess: player.possessClassname,
              };
            }
            return p;
          });
        }
      }

      if (event === EVENTS.PLAYER_DAMAGED) {
        const player = data as TPlayerDamaged;
        if (state.players && player) {
          state.players = state.players.map((p) => {
            if (p.name === player.victimName) {
              return {
                ...p,
                weapon: player.weapon,
              };
            }
            return p;
          });
        }
      }

      listener.emit(event, data);
    });
  }
};
