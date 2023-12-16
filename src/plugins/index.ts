import { getServersState } from '../serversState';
import { skipmap } from './skipmap';

const plugins = [skipmap];

export const initPlugins = async (id: number) => {
  const state = getServersState(id);

  plugins.forEach((fn) => {
    state.logger.log(`Initializing plugin: ${fn.name}`);

    fn(state);
  });

  return new Promise((res) => res(true));
};
