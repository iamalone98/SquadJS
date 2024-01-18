import { TDeployableDamaged } from 'squad-logs';
import { EVENTS } from '../constants';
import { adminKick } from '../core';
import { TPluginProps } from '../types';
import { getPlayerByName } from './helpers';

export const fobExplosionDamage: TPluginProps = (state) => {
  const { listener, execute } = state;
  const deployableDamaged = (data: TDeployableDamaged) => {
    const { weapon, deployable, name } = data;
    if (!data.deployable.match(/(?:FOBRadio|Hab)_/i)) return;
    if (!data.weapon.match(/_Deployable_/i)) return;
    const player = getPlayerByName(state, name);
    if (!player) return;
    const teamsFob = [
      ['SZ1', 'Russian Ground Forces', 'BP_FOBRadio_RUS'],
      ['600g', 'Insurgent Forces', 'BP_FobRadio_INS'],
      ['SZ1', 'Middle Eastern Alliance', 'BP_FOBRadio_MEA'],
      ['M112', 'Canadian Army', 'BP_FOBRadio_Woodland'],
      ['CompB', 'Australian Defence Force', 'BP_FOBRadio_Woodland'],
      ['1lb', 'Irregular Militia Forces', 'BP_FOBRadio_MIL'],
      ['M112', 'British Army', 'BP_FOBRadio_Woodland'],
      ['M112', 'United States Marine Corps', 'BP_FOBRadio_Woodland'],
      ['IED', 'Insurgent Forces', 'BP_FobRadio_INS'],
      ['IED', 'Irregular Militia Forces', 'BP_FOBRadio_MIL'],
      ['PLA', "People's Liberation Army", 'BP_FOBRadio_PLA'],
      ['M112', 'United States Army', 'BP_FOBRadio_Woodland'],
    ];

    teamsFob.forEach((e) => {
      if (weapon.includes(e[0]) && deployable.includes(e[2])) {
        adminKick(execute, player.steamID, 'Урон союзной FOB');
      }
    });
  };

  listener.on(EVENTS.DEPLOYABLE_DAMAGED, deployableDamaged);
};
