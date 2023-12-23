import { TPlayerDisconnected } from 'squad-logs';
import { EVENTS } from '../constants';
import { adminKick, adminWarn } from '../core';
import { TPlayer, TState } from '../types';
import { getAdmins, getPlayerByEOSID, getPlayers } from './helpers';

export const autoKickUnassigned = (state: TState) => {
  const { listener, execute } = state;
  const trackedPlayers: Record<string, TPlayer> = {};
  const kickTimeout = 300000;
  const warningInterval = 30000;
  const gracePeriod = 1000; //900000
  let betweenRounds = false;
  const trackingListUpdateFrequency = 1 * 60 * 1000; // 1min
  //const cleanUpFrequency = 1 * 60 * 1000; // 1min
  const playerThreshold = 1;
  const admins = getAdmins(state, 'canseeadminchat');
  const whitelist = getAdmins(state, 'cameraman');
  const ignoreWhitelist = true;

  const newGame = () => {
    betweenRounds = true;
    updateTrackingList();
    setTimeout(() => {
      betweenRounds = false;
    }, gracePeriod);
  };

  const onPlayerSquadChange = (player: TPlayer) => {
    if (player.steamID in trackedPlayers && player.squadID !== null) {
      untrackPlayer(player.steamID);
    }
  };

  const clearDisconnectedPlayers = (data: TPlayerDisconnected) => {
    const players = getPlayerByEOSID(state, data.eosID);
    for (const steamID of Object.keys(trackedPlayers)) {
      if (players?.steamID === steamID) untrackPlayer(steamID, 'Игрок ливнул');
    }
  };

  interface PlayerTracker extends TPlayer {
    warnings: number;
    startTime: number;
    warnTimerID?: NodeJS.Timeout;
    kickTimerID?: NodeJS.Timeout;
  }

  const untrackPlayer = (steamID: string, reason?: string) => {
    const tracker = trackedPlayers[steamID];
    delete trackedPlayers[steamID];
    clearInterval((tracker as PlayerTracker).warnTimerID);
    clearTimeout((tracker as PlayerTracker).kickTimerID);
    console.log(`unTracker: Name: ${tracker.name} Reason: ${reason || 'null'}`);
  };

  const updateTrackingList = () => {
    const players = getPlayers(state);
    if (!players) return;
    const run = !(betweenRounds || players.length < playerThreshold);
    console.log(
      1,
      `Update Tracking List? ${run} (Between rounds: ${betweenRounds}, Below player threshold: ${
        players.length < playerThreshold
      })`,
    );

    if (!run) {
      for (const steamID of Object.keys(trackedPlayers))
        untrackPlayer(steamID, 'Очистка списка');
      return;
    }

    for (const player of players) {
      const { steamID, squadID } = player;
      const isTracked = steamID in trackedPlayers;
      const isUnassigned = squadID === null;
      const isAdmin = admins?.includes(steamID);
      const isWhitelist = whitelist?.includes(steamID);

      if (!isUnassigned && isTracked)
        untrackPlayer(player.steamID, 'Вступил в отряд');

      if (!isUnassigned) continue;

      if (isAdmin) console.log(1, `Admin is Unassigned: ${player.name}`);
      if (isAdmin && ignoreWhitelist) continue;

      if (isWhitelist)
        console.log(1, `Whitelist player is Unassigned: ${player.name}`);
      if (isWhitelist && ignoreWhitelist) continue;

      if (!isTracked) trackedPlayers[steamID] = trackPlayer(player);
    }
  };

  const msFormat = (ms: number) => {
    const min = Math.floor((ms / 1000 / 60) << 0);
    const sec = Math.floor((ms / 1000) % 60);
    const minTxt = ('' + min).padStart(2, '0');
    const secTxt = ('' + sec).padStart(2, '0');
    return `${minTxt}:${secTxt}`;
  };

  const trackPlayer = (player: TPlayer) => {
    const { name, eosID, steamID, teamID, role, isLeader, squadID } = player;
    const tracker: PlayerTracker = {
      name,
      eosID,
      steamID,
      teamID,
      role,
      isLeader,
      squadID,
      warnings: 0,
      startTime: Date.now(),
    };

    tracker.warnTimerID = setInterval(async () => {
      const msLeft = kickTimeout - warningInterval * (tracker.warnings + 1);

      if (msLeft < warningInterval + 1) clearInterval(tracker.warnTimerID);

      const timeLeft = msFormat(msLeft);
      adminWarn(
        execute,
        steamID,
        `Вступите в отряд или будете кикнуты через - ${timeLeft}`,
      );
      console.log(1, `Warning: ${player.name} (${timeLeft})`);
      tracker.warnings++;
    }, warningInterval);

    tracker.kickTimerID = setTimeout(async () => {
      updateTrackingList();

      if (!(tracker.steamID in trackedPlayers)) return;

      adminKick(execute, player.steamID, 'AFK');

      console.log(1, `Kicked: ${player.name}`);
      untrackPlayer(tracker.steamID, 'Игрок кикнут');
    }, kickTimeout);

    return tracker;
  };

  setInterval(() => updateTrackingList(), trackingListUpdateFrequency);

  listener.on(EVENTS.NEW_GAME, newGame);
  listener.on(EVENTS.PLAYER_DISCONNECTED, clearDisconnectedPlayers);
  listener.on(EVENTS.PLAYER_SQUAD_CHANGED, onPlayerSquadChange);
};
