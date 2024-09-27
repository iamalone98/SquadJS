import { getServersState } from '../serversState';
import { skipmap } from './skipmap';
import { TPluginsState } from './types';

const plugins = [skipmap];
const pluginsState: TPluginsState = {};

export const initPlugins = async (id: number) => {
  const state = getServersState(id);

  for (const fn of plugins) {
    state.logger.log(`Initializing plugin: ${fn.name}`);

    const plugin = state.plugins.find((p) => p.name === fn.name);

    if (plugin && plugin.enabled) {
      await fn(state, pluginsState, plugin.options);
      state.logger.log(`Initialized plugin: ${fn.name}`);
    } else {
      state.logger.warn(`Disabled plugin: ${fn.name}`);
    }
  }

  return new Promise((res) => res(true));
};
