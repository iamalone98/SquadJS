import { EVENTS } from '../../constants';
import { getServersState } from '../../serversState';
import { TGetAdmins } from '../../types';

export const updateAdmins = async (id: number, getAdmins: TGetAdmins) => {
  const { coreListener, logger } = getServersState(id);

  logger.log('Updating admins');

  const admins = await getAdmins();

  const state = getServersState(id);
  state.admins = admins;

  coreListener.emit(EVENTS.UPDATED_ADMINS, state.admins);

  logger.log('Updated admins');
};
