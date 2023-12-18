import { EVENTS } from '../../constants';
import { getServersState } from '../../serversState';
import { TGetAdmins } from '../../types';

export const updateAdmins = async (id: number, getAdmins: TGetAdmins) => {
  const { listener, logger } = getServersState(id);

  logger.log('Updating admins');

  const admins = await getAdmins();

  const state = getServersState(id);
  state.admins = admins;

  listener.emit(EVENTS.UPDATED_ADMINS, state.admins);

  logger.log('Updated admins');
};
