import { EVENTS } from '../constants';
import { adminSetNextLayer } from '../core';
import {
  cleanHistoryLayers,
  getHistoryLayers,
  serverHistoryLayers,
} from '../rnsdb';
import { TPluginProps } from '../types';

export const randomizerMaps: TPluginProps = (state) => {
  const { listener, execute, logger } = state;
  const layerNames = new Set(
    Object.values(state.maps).map((map) => map.layerName),
  );

  const historyLayersMax = layerNames.size;
  let rnsHistoryLayers: string[] = [];

  const newGame = async () => {
    const { currentMap, id } = state;
    if (!currentMap?.level) return;
    // console.log(currentMap.layer);
    rnsHistoryLayers = await getHistoryLayers(id);
    // if (!rnsHistoryLayers.find((e) => e === currentMap.layer)) {
    //   await serverHistoryLayers(id, currentMap.level);
    //   rnsHistoryLayers.push(currentMap.level);
    // }

    const map = await recursiveGenerate();
    if (map) {
      logger.log(`Set next Layer ${map}`);
      console.log(rnsHistoryLayers);
      await adminSetNextLayer(execute, map);
    }
  };

  listener.on(EVENTS.NEW_GAME, newGame);

  const recursiveGenerate = async (): Promise<string> => {
    const { id } = state;
    if (rnsHistoryLayers.length >= historyLayersMax) {
      await cleanHistoryLayers(id, rnsHistoryLayers[historyLayersMax - 1]);
    }

    if (rnsHistoryLayers.length >= historyLayersMax) {
      rnsHistoryLayers = rnsHistoryLayers.slice(-1);
      return recursiveGenerate();
    }

    const layer = getRandomLayer();
    console.log(layer);
    if (!rnsHistoryLayers.find((e) => e === layer.layer)) {
      await serverHistoryLayers(id, layer.layer);
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
