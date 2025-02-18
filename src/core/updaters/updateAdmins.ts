import { EVENTS } from '../../constants';
import { TGetAdmins } from '../../types';
import { getServersState } from '../serversState';

export const updateAdmins = async (id: number, getAdmins: TGetAdmins) => {
  const { coreListener, logger } = getServersState(id);

  logger.log('Updating admins');

  const admins = await getAdmins();

  const state = getServersState(id);
  state.admins = admins;

  coreListener.emit(EVENTS.UPDATED_ADMINS, state.admins);

  logger.log('Updated admins');
};
