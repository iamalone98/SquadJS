import { updateCurrentMap } from './updateCurrentMap';
import { updateNextMap } from './updateNextMap';
import { updatePlayers } from './updatePlayers';
import { updateSquads } from './updateSquads';

export const initState = async (id: number) => {
  await updatePlayers(id);
  await updateSquads(id);
  await updateCurrentMap(id);
  await updateNextMap(id);
};
