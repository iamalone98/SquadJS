import fs from 'fs/promises';
import path from 'path';
import {
  TDeployableDamaged,
  TNewGame,
  TPlayerConnected,
  TPlayerDamaged,
  TPlayerDied,
  TPlayerDisconnected,
  TPlayerPossess,
  TPlayerRevived,
  TPlayerSuicide,
  TPlayerWounded,
  TVehicleDamaged,
} from 'squad-logs';
import {
  TChatMessage,
  TPossessedAdminCamera,
  TSquadCreated,
  TUnPossessedAdminCamera,
} from 'squad-rcon';
import { promisify } from 'util';
import { EVENTS } from '../constants';
import { TPlayerRoleChanged, TPluginProps } from '../types';
import {
  getPlayerByEOSID,
  getPlayerByName,
  getPlayerBySteamID,
} from './helpers';

const rename = promisify(fs.rename);

interface LogData {
  currentTime: string;
  action: string;
  [key: string]: unknown;
}

export const rnsLogs: TPluginProps = (state, options) => {
  const { listener } = state;
  const { logPath } = options;
  let logData: LogData[] = []; // Массив для хранения данных перед записью в файл
  const writeInterval = 6000; // Интервал записи данных (1 минута)
  const cleanLogsInterval = 24 * 60 * 60 * 1000; // Интервал очистки старых логов (сутки)
  let matchIsEnded = false;

  async function cleanOldLogsFiles() {
    const currentDate = new Date();
    const expiryLogDate = new Date(
      currentDate.getTime() - 2 * 24 * 60 * 60 * 1000,
    ); // 2 дня

    try {
      const files = await fs.readdir(logPath);
      console.log(files);
      for (const file of files) {
        const filePath = path.join(logPath, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < expiryLogDate) {
          await fs.unlink(filePath);
        }
      }
    } catch (err) {
      console.error('Ошибка чтения директории:', err);
    }
  }

  async function writeLogToFile(tempData: LogData[]) {
    if (!tempData) return;
    if (tempData.length === 0) return;
    if (matchIsEnded) return;
    const { currentMap } = state;
    const logFilePath = `${logPath}${currentMap?.layer}.json`;

    try {
      let logs = [];
      try {
        const data = await fs.readFile(logFilePath, 'utf-8');
        logs = JSON.parse(data);
      } catch (err) {
        logs = [];
      }

      logs = logs.concat(tempData);

      await fs.writeFile(logFilePath, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.error(error);
    }
  }

  setInterval(() => {
    if (logData.length > 0) {
      writeLogToFile(logData);
      logData = [];
    }
  }, writeInterval);

  setInterval(() => {
    cleanOldLogsFiles();
  }, cleanLogsInterval);

  async function renameFileLog(data: { time: string; layer: string }) {
    const { time, layer } = data;
    const currentFilePath = `${logPath}${layer}.json`;
    const newName = `${time}_${layer}`;
    const safeNewName = newName.replace(/[:*?"<>|]/g, '.');

    const newFilePath = `${logPath}${safeNewName}.json`;

    try {
      await rename(currentFilePath, newFilePath);
    } catch (err) {
      console.error('Ошибка при переименовании файла:', err);
    }
  }

  async function onNewGame(data: TNewGame) {
    matchIsEnded = false;
    const { layerClassname } = data;
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });

    logData.push({
      currentTime,
      action: 'NewGame',
      layerClassname,
    });
  }

  async function onPlayerConnected(data: TPlayerConnected) {
    if (matchIsEnded) return;
    const { steamID } = data;
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });
    const player = getPlayerBySteamID(state, steamID);
    logData.push({
      currentTime,
      action: 'Connect',
      player: player?.name ? player : null,
    });
  }

  async function onPlayerDisconnected(data: TPlayerDisconnected) {
    if (matchIsEnded) return;
    const { eosID } = data;
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });
    const player = getPlayerByEOSID(state, eosID);
    logData.push({
      currentTime,
      action: 'Disconnected',
      player: player?.name ? player : null,
    });
  }

  async function onRoundEnded() {
    matchIsEnded = true;
    const { currentMap } = state;
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });
    const nameLogFile = {
      time: currentTime,
      layer: currentMap?.layer || 'Undefined',
    };

    logData.push({
      currentTime,
      action: 'RoundEnd',
    });
    await writeLogToFile(logData);
    logData = [];
    await renameFileLog(nameLogFile);
  }

  async function onPlayerWounded(data: TPlayerWounded) {
    if (matchIsEnded) return;
    const { attackerEOSID, victimName, damage } = data;
    const victim = getPlayerByName(state, victimName);
    const attacker = getPlayerByEOSID(state, attackerEOSID);
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });
    if (
      attacker &&
      victim &&
      attacker?.teamID === victim?.teamID &&
      attacker.name !== victim.name
    ) {
      logData.push({
        currentTime,
        action: 'TeamKill',
        damage,
        attacker: attacker?.name ? attacker : null,
        victim: victim?.name ? victim : null,
      });
    } else {
      logData.push({
        currentTime,
        action: 'Wound',
        damage,
        attacker: attacker?.name ? attacker : null,
        victim: victim?.name ? victim : null,
      });
    }
  }

  async function onPlayerDamaged(data: TPlayerDamaged) {
    if (matchIsEnded) return;
    const { attackerEOSID, victimName, damage } = data;
    const victim = getPlayerByName(state, victimName);
    const attacker = getPlayerByEOSID(state, attackerEOSID);
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });
    if (
      attacker &&
      victim &&
      attacker?.teamID === victim?.teamID &&
      attacker.name !== victim.name
    ) {
      logData.push({
        currentTime,
        action: 'TeamDamaged',
        damage,
        attacker: attacker?.name ? attacker : null,
        victim: victim?.name ? victim : null,
      });
    } else {
      logData.push({
        currentTime,
        action: 'PlayerDamaged',
        damage,
        attacker: attacker?.name ? attacker : null,
        victim: victim?.name ? victim : null,
      });
    }
  }

  async function onPlayerDied(data: TPlayerDied) {
    if (matchIsEnded) return;
    const { attackerEOSID, victimName, damage } = data;
    const victim = getPlayerByName(state, victimName);
    const attacker = getPlayerByEOSID(state, attackerEOSID);
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });

    logData.push({
      currentTime,
      action: 'Died',
      damage,
      attacker: attacker?.name ? attacker : null,
      victim: victim?.name ? victim : null,
    });
  }

  async function onPlayerRevived(data: TPlayerRevived) {
    if (matchIsEnded) return;
    const { reviverEOSID, victimEOSID } = data;
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });
    const reviver = getPlayerByEOSID(state, reviverEOSID);
    const victim = getPlayerByEOSID(state, victimEOSID);
    logData.push({
      currentTime,
      action: 'Revived',
      reviver,
      victim,
    });
  }

  async function onRoleChanged(data: TPlayerRoleChanged) {
    if (matchIsEnded) return;
    const { oldRole, newRole, player } = data;
    const { name } = player;
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });

    logData.push({
      currentTime,
      action: 'RoleChanged',
      name,
      oldRole,
      newRole,
    });
  }

  async function onDeployableDamaged(data: TDeployableDamaged) {
    if (matchIsEnded) return;
    const { deployable, damage, weapon, name } = data;
    const player = getPlayerByName(state, name);
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });

    logData.push({
      currentTime,
      action: 'DeployableDamaged',
      damage,
      deployable,
      weapon,
      player: player?.name ? player : null,
    });
  }

  async function onChatMessage(data: TChatMessage) {
    if (matchIsEnded) return;
    const { name, message, chat } = data;
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });

    logData.push({
      currentTime,
      action: 'ChatMessage',
      name,
      chat,
      message,
    });
  }

  async function onSquadCreated(data: TSquadCreated) {
    if (matchIsEnded) return;
    const { time, squadName, eosID } = data;
    const player = getPlayerByEOSID(state, eosID);
    const currentTime = new Date(time).toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });

    logData.push({
      currentTime,
      action: 'SquadCreated',
      squadName,
      player: player?.name ? player : null,
    });
  }

  async function onEntry(data: TPossessedAdminCamera) {
    if (matchIsEnded) return;
    const { name } = data;
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });

    logData.push({
      currentTime,
      action: 'EntryCamera',
      name,
    });
  }

  async function onExit(data: TUnPossessedAdminCamera) {
    if (matchIsEnded) return;
    const { name } = data;
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });

    logData.push({
      currentTime,
      action: 'ExitCamera',
      name,
    });
  }

  async function onPlayerPossess(data: TPlayerPossess) {
    if (matchIsEnded) return;
    const { eosID, possessClassname } = data;
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });
    const player = getPlayerByEOSID(state, eosID);

    logData.push({
      currentTime,
      action: 'Possess',
      player: player?.name ? player : null,
      possessClassname,
    });
  }

  async function onPlayerSuicide(data: TPlayerSuicide) {
    if (matchIsEnded) return;
    const { name } = data;
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });
    const player = getPlayerByName(state, name);

    logData.push({
      currentTime,
      action: 'Suicide',
      player: player?.name ? player : null,
    });
  }

  async function onVehicleDamage(data: TVehicleDamaged) {
    if (matchIsEnded) return;
    const {
      damage,
      attackerName,
      victimVehicle,
      attackerVehicle,
      healthRemaining,
    } = data;
    const currentTime = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    });

    logData.push({
      currentTime,
      action: 'VehicleDamage',
      attackerName,
      victimVehicle,
      damage,
      attackerVehicle,
      healthRemaining,
    });
  }

  listener.on(EVENTS.PLAYER_CONNECTED, onPlayerConnected);
  listener.on(EVENTS.PLAYER_DISCONNECTED, onPlayerDisconnected);
  listener.on(EVENTS.PLAYER_WOUNDED, onPlayerWounded);
  listener.on(EVENTS.PLAYER_DAMAGED, onPlayerDamaged);
  listener.on(EVENTS.PLAYER_DIED, onPlayerDied);
  listener.on(EVENTS.ROUND_ENDED, onRoundEnded);
  listener.on(EVENTS.NEW_GAME, onNewGame);
  listener.on(EVENTS.PLAYER_REVIVED, onPlayerRevived);
  listener.on(EVENTS.PLAYER_ROLE_CHANGED, onRoleChanged);
  listener.on(EVENTS.DEPLOYABLE_DAMAGED, onDeployableDamaged);
  listener.on(EVENTS.CHAT_MESSAGE, onChatMessage);
  listener.on(EVENTS.SQUAD_CREATED, onSquadCreated);
  listener.on(EVENTS.POSSESSED_ADMIN_CAMERA, onEntry);
  listener.on(EVENTS.UNPOSSESSED_ADMIN_CAMERA, onExit);
  listener.on(EVENTS.PLAYER_POSSESS, onPlayerPossess);
  listener.on(EVENTS.PLAYER_SUICIDE, onPlayerSuicide);
  listener.on(EVENTS.VEHICLE_DAMAGED, onVehicleDamage);
};
