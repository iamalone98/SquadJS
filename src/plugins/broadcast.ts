import { adminBroadcast } from '../core';
import { TPluginProps } from '../types';

export const broadcast: TPluginProps = (state, options) => {
  const { execute } = state;
  const { texts, interval } = options;
  let index = 0;
  function printText() {
    if (index < texts.length) {
      const text = texts[index];
      adminBroadcast(execute, text);
      index++;
    } else {
      index = 0;
    }
  }

  setInterval(printText, parseInt(interval));
};
