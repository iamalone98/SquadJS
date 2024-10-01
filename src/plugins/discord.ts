import { TPluginProps } from '../types';

export const discord: TPluginProps = (state) => {
  return new Promise((res, rej) => {
    state.discord = {
      sendMessage(channelId, text) {
        console.log(channelId, text);
      },
    };

    rej('test');
  });
};
