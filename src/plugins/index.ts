import { getServersState } from '../serversState';
import { discord } from './discord';
import { skipmap } from './skipmap';

const plugins = [discord, skipmap];

export const initPlugins = async (id: number) => {
  const state = getServersState(id);

  for (const fn of plugins) {
    state.logger.log(`Initializing plugin: ${fn.name}`);

    const plugin = state.plugins.find((p) => p.name === fn.name);

    if (plugin && plugin.enabled) {
      await fn(state, plugin.options);
      state.logger.log(`Initialized plugin: ${fn.name}`);
    } else {
      state.logger.warn(`Disabled plugin: ${fn.name}`);
    }
  }

  return new Promise((res) => res(true));
};
