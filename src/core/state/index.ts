import { serversState } from '../../serversState';
import { updateCurrentMap } from './updateCurrentMap';
import { updateNextMap } from './updateNextMap';
import { updatePlayers } from './updatePlayers';
import { updateSquads } from './updateSquads';

export const initState = async (id: number) => {
  await updatePlayers(id);
  await updateSquads(id);
  await updateCurrentMap(id);
  await updateNextMap(id);

  const { listener } = serversState[id];

  setInterval(() => {
    updatePlayers(id);
  }, 30000);

  setInterval(() => {
    updateSquads(id);
  }, 30000);

  listener.on('NEW_GAME', () => {
    updateCurrentMap(id);
    updateNextMap(id);
  });
};
