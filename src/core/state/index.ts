import { EVENTS, UPDATE_TIMEOUT } from '../../constants';
import { getServersState } from '../../serversState';
import { TGetAdmins } from '../../types';
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

  const { coreListener, listener } = getServersState(id);

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

      listener.emit(event, data);
    });
  }
};
