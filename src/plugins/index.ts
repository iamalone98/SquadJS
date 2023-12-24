import { getServersState } from '../serversState';
import { skipmap } from './skipmap';

const plugins = [skipmap];

export const initPlugins = async (id: number) => {
  const state = getServersState(id);

  plugins.forEach((fn) => {
    state.logger.log(`Initializing plugin: ${fn.name}`);

    const plugin = state.plugins.find((p) => p.name === fn.name);

    if (plugin && plugin.enabled) {
      state.logger.log(`Initialized plugin: ${fn.name}`);

      fn(state, plugin.options);
    } else {
      state.logger.warn(`Disabled plugin: ${fn.name}`);
    }
  });

  return new Promise((res) => res(true));
};
