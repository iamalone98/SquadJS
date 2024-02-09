import { EVENTS } from '../constants';
import { adminSetNextLayer } from '../core';
import { TPluginProps } from '../types';

export const randomizerMaps: TPluginProps = (state) => {
  const { listener, execute, logger } = state;
  const layerNames = new Set(
    Object.values(state.maps).map((map) => map.layerName),
  );

  const historyLayersMax = layerNames.size;
  let rnsHistoryLayers: string[] = [];

  const newGame = () => {
    const map = recursiveGenerate();
    if (map) {
      logger.log(`Set next Layer ${map}`);
      adminSetNextLayer(execute, map);
    }
  };

  listener.on(EVENTS.NEW_GAME, newGame);

  const recursiveGenerate = (): string => {
    const { currentMap } = state;

    if (rnsHistoryLayers.length >= historyLayersMax) {
      rnsHistoryLayers = rnsHistoryLayers.slice(-1);
      return recursiveGenerate();
    }

    const layer = getRandomLayer();
    if (!rnsHistoryLayers.find((e) => e === layer.layer)) {
      if (layer.layer === currentMap?.layer) {
        rnsHistoryLayers.push(layer.layer);
        return recursiveGenerate();
      }

      rnsHistoryLayers.push(layer.layer);
      return layer.map;
    }

    return recursiveGenerate();
  };

  const getRandomLayer = () => {
    const layersLength = Object.keys(state.maps).length;
    const random = Math.floor(Math.random() * layersLength);
    const map = Object.keys(state.maps)[random];
    const layer = state.maps[map].layerName;
    return { layer, map };
  };
};
