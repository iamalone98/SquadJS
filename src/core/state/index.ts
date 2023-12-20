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

  const { listener } = getServersState(id);

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

  listener.on(EVENTS.PLAYER_CONNECTED, updatesOnEvents);
  listener.on(EVENTS.SQUAD_CREATED, updatesOnEvents);

  listener.on(EVENTS.NEW_GAME, async () => {
    await updateAdmins(id, getAdmins);
    await updateCurrentMap(id);
    await updateNextMap(id);
  });
};
