import { getServersState } from '../serversState';
import { autoKickUnassigned } from './auto-kick-unassigned';
import { autorestartServers } from './autorestart-servers';
import { bonuses } from './bonuses';
import { chatCommands } from './chat-commands';
import { fobExplosionDamage } from './fobexplosiondamage';
import { randomizerMaps } from './randomizer-maps';
import { rnsStats } from './rns-stats';
import { rnsLogs } from './rnsLogs';
import { skipmap } from './skipmap';
import { squadLeaderRole } from './squad-leader-role';
import { voteMap } from './votemap';
import { warnPlayers } from './warn-players';
const plugins = [
  skipmap,
  voteMap,
  randomizerMaps,
  warnPlayers,
  squadLeaderRole,
  autoKickUnassigned,
  chatCommands,
  fobExplosionDamage,
  autorestartServers,
  rnsStats,
  bonuses,
  rnsLogs,
];

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
