import { EVENTS } from '../../constants';
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

  setInterval(async () => {
    await updatePlayers(id);
    await updateSquads(id);
  }, 30000);

  listener.on(EVENTS.NEW_GAME, async () => {
    await updateAdmins(id, getAdmins);
    await updateCurrentMap(id);
    await updateNextMap(id);
  });
};
