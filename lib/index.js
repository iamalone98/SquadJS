import chalk from 'chalk';
import { format } from 'date-fns';
import { LogsReaderEvents, LogsReader } from 'squad-logs';
import { RconEvents, Rcon } from 'squad-rcon';
import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import url from 'url';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

const adminEndMatch = (execute) => __awaiter(void 0, void 0, void 0, function* () {
    yield execute('AdminEndMatch');
});
const adminBroadcast = (execute, str) => __awaiter(void 0, void 0, void 0, function* () {
    yield execute(`AdminBroadcast ${str}`);
});
const adminSetNextLayer = (execute, str) => __awaiter(void 0, void 0, void 0, function* () {
    yield execute(`AdminSetNextLayer ${str}`);
});
const adminDisbandSquad = (execute, teamID, squadID) => __awaiter(void 0, void 0, void 0, function* () {
    yield execute(`AdminDisbandSquad ${teamID} ${squadID}`);
});
const adminWarn = (execute, steamID, reason) => __awaiter(void 0, void 0, void 0, function* () {
    yield execute(`AdminWarn ${steamID} ${reason}`);
});
const adminKick = (execute, steamID, reason) => __awaiter(void 0, void 0, void 0, function* () {
    yield execute(`AdminKick ${steamID} ${reason}`);
});
const adminForceTeamChange = (execute, steamID) => __awaiter(void 0, void 0, void 0, function* () {
    yield execute(`AdminForceTeamChange ${steamID}`);
});

const getTime = () => format(new Date(), 'd LLL HH:mm:ss');
const initLogger = (id, enabled) => ({
    log: (...text) => {
        enabled &&
            console.log(chalk.yellow(`[SquadJS][${id}][${getTime()}]`), chalk.green(text));
    },
    warn: (...text) => {
        enabled &&
            console.log(chalk.yellow(`[SquadJS][${id}][${getTime()}]`), chalk.magenta(text));
    },
    error: (...text) => {
        enabled &&
            console.log(chalk.yellow(`[SquadJS][${id}][${getTime()}]`), chalk.red(text));
    },
});

const serversState = {};
const getServersState = (id) => serversState[id];

const EVENTS = Object.assign(Object.assign(Object.assign({}, RconEvents), LogsReaderEvents), { UPDATED_ADMINS: 'UPDATED_ADMINS', UPDATED_PLAYERS: 'UPDATED_PLAYERS', UPDATED_SQUADS: 'UPDATED_SQUADS', PLAYER_TEAM_CHANGED: 'PLAYER_TEAM_CHANGED', PLAYER_SQUAD_CHANGED: 'PLAYER_SQUAD_CHANGED', PLAYER_ROLE_CHANGED: 'PLAYER_ROLE_CHANGED', PLAYER_LEADER_CHANGED: 'PLAYER_LEADER_CHANGED', 
    // CHAT COMMANDS
    CHAT_COMMAND_SKIPMAP: 'CHAT_COMMAND:skipmap', CHAT_COMMAND_VOTEMAP: 'CHAT_COMMAND:votemap', CHAT_COMMAND_ADMINS: 'CHAT_COMMAND:admins', CHAT_COMMAND_REPORT: 'CHAT_COMMAND:report', CHAT_COMMAND_R: 'CHAT_COMMAND:r', CHAT_COMMAND_STVOL: 'CHAT_COMMAND:ствол', CHAT_COMMAND_FIX: 'CHAT_COMMAND:fix' });
const UPDATERS_REJECT_TIMEOUT = 10000;
const UPDATE_TIMEOUT = 30000;

const getPlayerByEOSID = (state, eosID) => { var _a; return ((_a = state.players) === null || _a === void 0 ? void 0 : _a.find((player) => player.eosID === eosID)) || null; };
const getPlayerByName = (state, name) => { var _a; return ((_a = state.players) === null || _a === void 0 ? void 0 : _a.find((player) => player.name.includes(name))) || null; };
const getAdmins = (state, adminPermission) => state.admins
    ? Object.keys(state.admins).filter((admin) => { var _a; return (_a = state.admins) === null || _a === void 0 ? void 0 : _a[admin][adminPermission]; })
    : null;
const getPlayers = (state) => state.players;

const autoKickUnassigned = (state) => {
    const { listener, execute, logger } = state;
    const trackedPlayers = {};
    const kickTimeout = 300000;
    const warningInterval = 30000;
    const gracePeriod = 900000;
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
    const onPlayerSquadChange = (player) => {
        if (player.steamID in trackedPlayers && player.squadID !== null) {
            untrackPlayer(player.steamID);
        }
    };
    const clearDisconnectedPlayers = (data) => {
        const players = getPlayerByEOSID(state, data.eosID);
        for (const steamID of Object.keys(trackedPlayers)) {
            if ((players === null || players === void 0 ? void 0 : players.steamID) === steamID)
                untrackPlayer(steamID, 'Игрок ливнул');
        }
    };
    const untrackPlayer = (steamID, reason) => {
        const tracker = trackedPlayers[steamID];
        delete trackedPlayers[steamID];
        clearInterval(tracker.warnTimerID);
        clearTimeout(tracker.kickTimerID);
        logger.log(`unTracker: Name: ${tracker.name} Reason: ${reason || 'null'}`);
    };
    const updateTrackingList = () => {
        const players = getPlayers(state);
        if (!players)
            return;
        const run = !(betweenRounds || players.length < playerThreshold);
        logger.log(`Update Tracking List? ${run} (Between rounds: ${betweenRounds}, Below player threshold: ${players.length < playerThreshold})`);
        if (!run) {
            for (const steamID of Object.keys(trackedPlayers))
                untrackPlayer(steamID, 'Очистка списка');
            return;
        }
        for (const player of players) {
            const { steamID, squadID } = player;
            const isTracked = steamID in trackedPlayers;
            const isUnassigned = squadID === null;
            const isAdmin = admins === null || admins === void 0 ? void 0 : admins.includes(steamID);
            const isWhitelist = whitelist === null || whitelist === void 0 ? void 0 : whitelist.includes(steamID);
            if (!isUnassigned && isTracked)
                untrackPlayer(player.steamID, 'Вступил в отряд');
            if (!isUnassigned)
                continue;
            if (isAdmin)
                logger.log(`Admin is Unassigned: ${player.name}`);
            if (isAdmin && ignoreWhitelist)
                continue;
            if (isWhitelist)
                logger.log(`Whitelist player is Unassigned: ${player.name}`);
            if (isWhitelist && ignoreWhitelist)
                continue;
            if (!isTracked)
                trackedPlayers[steamID] = trackPlayer(player);
        }
    };
    const msFormat = (ms) => {
        const min = Math.floor((ms / 1000 / 60) << 0);
        const sec = Math.floor((ms / 1000) % 60);
        const minTxt = ('' + min).padStart(2, '0');
        const secTxt = ('' + sec).padStart(2, '0');
        return `${minTxt}:${secTxt}`;
    };
    const trackPlayer = (player) => {
        const { name, eosID, steamID, teamID, role, isLeader, squadID } = player;
        const tracker = {
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
        tracker.warnTimerID = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            const msLeft = kickTimeout - warningInterval * (tracker.warnings + 1);
            if (msLeft < warningInterval + 1)
                clearInterval(tracker.warnTimerID);
            const timeLeft = msFormat(msLeft);
            adminWarn(execute, steamID, `Вступите в отряд или будете кикнуты через - ${timeLeft}`);
            logger.log(`Warning: ${player.name} (${timeLeft})`);
            tracker.warnings++;
        }), warningInterval);
        tracker.kickTimerID = setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            updateTrackingList();
            if (!(tracker.steamID in trackedPlayers))
                return;
            adminKick(execute, player.steamID, 'AFK');
            logger.log(`Kicked: ${player.name}`);
            untrackPlayer(tracker.steamID, 'Игрок кикнут');
        }), kickTimeout);
        return tracker;
    };
    setInterval(() => updateTrackingList(), trackingListUpdateFrequency);
    listener.on(EVENTS.NEW_GAME, newGame);
    listener.on(EVENTS.PLAYER_DISCONNECTED, clearDisconnectedPlayers);
    listener.on(EVENTS.PLAYER_SQUAD_CHANGED, onPlayerSquadChange);
};

const chatCommands = (state) => {
    const { listener, execute } = state;
    let players = [];
    const admins = (data) => {
        adminWarn(execute, data.steamID, 'На сервере присутствует администратор');
        adminWarn(execute, data.steamID, 'Для связи с администратором перейдите в дискорд канал discord.gg/rn-server');
    };
    const report = (data) => {
        adminWarn(execute, data.steamID, `Для завершения репорта, создайте тикет в discord.gg/rn-server`);
    };
    const stvol = (data) => {
        const { name, steamID } = data;
        if (players.find((player) => player === steamID)) {
            adminWarn(execute, data.steamID, 'Разрешено использовать раз в 5 минут!');
            return;
        }
        const range = Math.floor(Math.random() * 31 + 1);
        adminBroadcast(execute, `У ${name} ствол ${range}см`);
        players.push(steamID);
        setTimeout(() => {
            players = players.filter((player) => player !== steamID);
        }, 300000);
    };
    const fix = (data) => {
        adminForceTeamChange(execute, data.steamID);
        adminForceTeamChange(execute, data.steamID);
    };
    listener.on(EVENTS.CHAT_COMMAND_ADMINS, admins);
    listener.on(EVENTS.CHAT_COMMAND_REPORT, report);
    listener.on(EVENTS.CHAT_COMMAND_R, report);
    listener.on(EVENTS.CHAT_COMMAND_STVOL, stvol);
    listener.on(EVENTS.CHAT_COMMAND_FIX, fix);
};

const fobExplosionDamage = (state) => {
    const { listener, execute } = state;
    const deployableDamaged = (data) => {
        const { weapon, deployable, name } = data;
        if (!data.deployable.match(/(?:FOBRadio|Hab)_/i))
            return;
        if (!data.weapon.match(/_Deployable_/i))
            return;
        const player = getPlayerByName(state, name);
        if (!player)
            return;
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

const randomizerMaps = (state) => {
    const { listener, execute, logger } = state;
    const layerNames = new Set(Object.values(state.maps).map((map) => map.layerName));
    const historyLayersMax = layerNames.size;
    let rnsHistoryLayers = [];
    const newGame = () => {
        const map = recursiveGenerate();
        if (map) {
            logger.log(`Set next Layer ${map}`);
            console.log(rnsHistoryLayers);
            adminSetNextLayer(execute, map);
        }
    };
    listener.on(EVENTS.NEW_GAME, newGame);
    const recursiveGenerate = () => {
        if (rnsHistoryLayers.length >= historyLayersMax) {
            rnsHistoryLayers = rnsHistoryLayers.slice(-1);
            return recursiveGenerate();
        }
        const layer = getRandomLayer();
        if (!rnsHistoryLayers.find((e) => e === layer.layer)) {
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

const skipmap = (state) => {
    const { listener, execute, admins } = state;
    const voteTick = 30000;
    const voteDuration = 120000;
    const voteRepeatDelay = 90000 * 10; //15 min
    let voteStarting = false;
    let voteStartingRepeat = true;
    let secondsToEnd = voteDuration / 1000;
    let timer;
    let timerDelayStarting;
    let timerDelayNextStart;
    const historyPlayers = [];
    let votes = {
        '+': [],
        '-': [],
    };
    const chatCommand = (data) => {
        const { steamID } = data;
        if (state.votingActive || voteStarting) {
            adminWarn(execute, steamID, 'В данный момент голосование уже идет!');
            return;
        }
        if (!voteStartingRepeat) {
            adminWarn(execute, steamID, 'Должно пройти 15 минут после последнего использования skipmap!');
            return;
        }
        if (!(admins === null || admins === void 0 ? void 0 : admins[steamID])) {
            adminWarn(execute, steamID, 'Команда доступна только Vip пользователям');
            return;
        }
        if (historyPlayers.find((i) => i === steamID)) {
            adminWarn(execute, steamID, 'Вы уже запускали голосование, для каждого игрока доступно только одно голосование за игру!');
            return;
        }
        adminBroadcast(execute, 'Голосование за пропуск текущей карты!\nИспользуйте +(За) -(Против) для голосования');
        historyPlayers.push(steamID);
        voteStarting = true;
        voteStartingRepeat = false;
        timer = setInterval(() => {
            secondsToEnd = secondsToEnd - voteTick / 1000;
            const positive = votes['+'].length;
            const negative = votes['-'].length;
            const currentVotes = positive - negative <= 0 ? 0 : positive - negative;
            const needVotes = 15;
            state.votingActive = true;
            if (secondsToEnd <= 0) {
                if (currentVotes >= needVotes) {
                    adminBroadcast(execute, 'Голосование завершено!\nМатч завершается!');
                    adminBroadcast(execute, `За: ${positive} Против: ${negative} Набрано: ${currentVotes} из ${needVotes} голос(ов)`);
                    reset();
                    adminEndMatch(execute);
                    return;
                }
                timerDelayNextStart = setTimeout(() => {
                    voteStartingRepeat = true;
                }, voteRepeatDelay);
                adminBroadcast(execute, 'Голосование завершено!\nНе набрано необходимое количество голосов за пропуск текущей карты');
                adminBroadcast(execute, `За: ${positive} Против: ${negative} Набрано: ${currentVotes} из ${needVotes} голос(ов)`);
                reset();
            }
            else {
                adminBroadcast(execute, `Голосование за пропуск текущей карты!\nЗа: ${positive} Против: ${negative} Набрано: ${currentVotes} из ${needVotes} голос(ов)`);
                adminBroadcast(execute, 'Используйте +(За) -(Против) для голосования');
            }
        }, voteTick);
    };
    const chatMessage = (data) => {
        if (!voteStarting)
            return;
        const { steamID } = data;
        const message = data.message.trim();
        if (message === '+' || message === '-') {
            for (const key in votes) {
                votes[key] = votes[key].filter((p) => p !== steamID);
            }
            votes[message].push(steamID);
            adminWarn(execute, steamID, 'Твой голос принят!');
        }
    };
    const newGame = () => {
    };
    listener.on(EVENTS.CHAT_COMMAND_SKIPMAP, chatCommand);
    listener.on(EVENTS.CHAT_MESSAGE, chatMessage);
    listener.on(EVENTS.NEW_GAME, newGame);
    const reset = () => {
        clearTimeout(timerDelayNextStart);
        clearTimeout(timerDelayStarting);
        clearInterval(timer);
        voteStarting = false;
        state.votingActive = false;
        votes = {
            '+': [],
            '-': [],
        };
    };
};

const squadLeaderRole = (state) => {
    const { listener, execute, logger } = state;
    const { currentMap, admins } = state;
    let trackedPlayers = {};
    const getWarn = (steamID, text, seconds) => __awaiter(void 0, void 0, void 0, function* () {
        if (!seconds) {
            return adminWarn(execute, steamID, text);
        }
        const newText = text.replace(/{{time}}/, seconds.toString());
        yield adminWarn(execute, steamID, newText);
    });
    const newGame = () => {
        trackedPlayers = {};
    };
    const getIsLeaderRole = (role) => {
        return role.indexOf('SL') !== -1;
    };
    const untrackPlayer = (steamID, reason) => {
        const tracker = trackedPlayers[steamID];
        delete trackedPlayers[steamID];
        if (tracker) {
            logger.log(`unTracker: Name: ${tracker.name} SquadID: ${tracker.squadID} TeamID: ${tracker.teamID} Reason: ${reason || 'null'}`);
        }
    };
    const leaderChanged = (data) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const { player, isLeader } = data;
        if ((_a = currentMap === null || currentMap === void 0 ? void 0 : currentMap.layer) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes('seed'))
            return;
        if ((_b = admins === null || admins === void 0 ? void 0 : admins[player.steamID]) === null || _b === void 0 ? void 0 : _b.ban)
            return;
        const timeDisband = 120000;
        const iterationCheck = 30000;
        const messageGetRole = 'Возьми кит лидера или сквад будет расформирован через {{time}}сек';
        const messageDisband = 'Отряд расформирован';
        const messageSuccess = 'Спасибо что взяли кит!';
        let seconds = timeDisband / 1000;
        let timer = null;
        const leaderRole = getIsLeaderRole(player.role);
        if (trackedPlayers[player.steamID])
            return;
        if (isLeader && leaderRole)
            return;
        if (!player)
            return;
        if (isLeader && !leaderRole && !trackedPlayers[player.steamID]) {
            trackedPlayers[player.steamID] = player;
        }
        if (isLeader) {
            if (!leaderRole) {
                yield getWarn(player.steamID, messageGetRole, seconds);
                logger.log(`startTracker: Name: ${player.name} SquadID: ${player.squadID} TeamID: ${player.teamID} Seconds: ${seconds}`);
                timer = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
                    var _c, _d;
                    let updatedPlayer = (_c = state.players) === null || _c === void 0 ? void 0 : _c.find((user) => user.steamID === player.steamID);
                    seconds = seconds - iterationCheck / 1000;
                    if (!updatedPlayer) {
                        clearInterval(timer);
                        timer = null;
                        untrackPlayer(player.steamID, 'Игрок вышел');
                        return;
                    }
                    if (!updatedPlayer.isLeader) {
                        clearInterval(timer);
                        timer = null;
                        untrackPlayer(player.steamID, 'Игрок больше не лидер');
                        return;
                    }
                    if (getIsLeaderRole(updatedPlayer.role)) {
                        clearInterval(timer);
                        timer = null;
                        {
                            yield getWarn(updatedPlayer.steamID, messageSuccess);
                        }
                        untrackPlayer(player.steamID, 'Игрок взял кит');
                        return;
                    }
                    if (seconds !== 0) {
                        yield getWarn(updatedPlayer.steamID, messageGetRole, seconds);
                        logger.log(`startTracker: Name: ${player.name} SquadID: ${player.squadID} TeamID: ${player.teamID} Seconds: ${seconds}`);
                    }
                    if (seconds <= 0) {
                        untrackPlayer(player.steamID, 'Отряд распущен');
                        clearInterval(timer);
                        timer = null;
                        yield getWarn(updatedPlayer.steamID, messageDisband);
                        updatedPlayer = (_d = state.players) === null || _d === void 0 ? void 0 : _d.find((user) => user.steamID === player.steamID);
                        if (updatedPlayer && (updatedPlayer === null || updatedPlayer === void 0 ? void 0 : updatedPlayer.squadID)) {
                            yield adminDisbandSquad(execute, updatedPlayer.teamID, updatedPlayer.squadID);
                        }
                    }
                }), iterationCheck);
            }
        }
    });
    listener.on(EVENTS.NEW_GAME, newGame);
    listener.on(EVENTS.PLAYER_ROLE_CHANGED, leaderChanged);
    listener.on(EVENTS.PLAYER_LEADER_CHANGED, leaderChanged);
};

const voteMap = (state) => {
    const { listener, execute, admins } = state;
    const voteTick = 30000;
    const voteDuration = 180000;
    let voteStarting = false;
    let secondsToEnd = voteDuration / 1000;
    let timer;
    let timerDelayStarting;
    let timerDelayNextStart;
    let vote = false;
    const historyPlayers = [];
    let votes = {
        '+': [],
        '-': [],
    };
    const chatCommand = (data) => {
        const { steamID, message } = data;
        if (state.votingActive || voteStarting) {
            adminWarn(execute, steamID, 'В данный момент голосование уже идет!');
            return;
        }
        if (vote) {
            adminWarn(execute, steamID, 'Голосование уже прошло!');
            return;
        }
        if (!(admins === null || admins === void 0 ? void 0 : admins[steamID])) {
            adminWarn(execute, steamID, 'Команда доступна только Vip пользователям');
            return;
        }
        if (historyPlayers.find((i) => i === steamID)) {
            adminWarn(execute, steamID, 'Вы уже запускали голосование, для каждого игрока доступно только одно голосование за игру!');
            return;
        }
        const layersToLowerCase = new Set(Object.keys(state.maps).map((map) => map.toLowerCase()));
        const messageToLower = message.toLowerCase().trim().split(' ').join('_');
        let foundMap = false;
        layersToLowerCase.forEach((e) => {
            if (e.includes(messageToLower)) {
                foundMap = true;
                return;
            }
        });
        if (!foundMap || message.length === 0) {
            adminWarn(execute, steamID, 'Неправильно указано название карты, список карт можно найти в дискорд канале discord.gg/rn-server плагины!');
            return;
        }
        adminBroadcast(execute, `Голосование за следующую карту ${message}!\nИспользуйте +(За) -(Против) для голосования`);
        voteStarting = true;
        historyPlayers.push(steamID);
        timer = setInterval(() => {
            secondsToEnd = secondsToEnd - voteTick / 1000;
            const positive = votes['+'].length;
            const negative = votes['-'].length;
            const currentVotes = positive - negative <= 0 ? 0 : positive - negative;
            const needVotes = 10;
            state.votingActive = true;
            if (secondsToEnd <= 0) {
                if (currentVotes >= needVotes) {
                    adminBroadcast(execute, `Голосование завершено!\nСледующая карта ${message}!`);
                    adminBroadcast(execute, `За: ${positive} Против: ${negative} Набрано: ${currentVotes} из ${needVotes} голос(ов)`);
                    reset();
                    adminSetNextLayer(execute, messageToLower);
                    vote = true;
                    return;
                }
                adminBroadcast(execute, 'Голосование завершено!\nНе набрано необходимое количество голосов');
                adminBroadcast(execute, `За: ${positive} Против: ${negative} Набрано: ${currentVotes} из ${needVotes} голос(ов)`);
                reset();
            }
            else {
                adminBroadcast(execute, `Голосование за следующую карту ${message}!\nЗа: ${positive} Против: ${negative} Набрано: ${currentVotes} из ${needVotes} голос(ов)`);
                adminBroadcast(execute, 'Используйте +(За) -(Против) для голосования');
            }
        }, voteTick);
    };
    const chatMessage = (data) => {
        if (!voteStarting)
            return;
        const { steamID } = data;
        const message = data.message.trim();
        if (message === '+' || message === '-') {
            for (const key in votes) {
                votes[key] = votes[key].filter((p) => p !== steamID);
            }
            votes[message].push(steamID);
            adminWarn(execute, steamID, 'Твой голос принят!');
        }
    };
    const newGame = () => {
    };
    listener.on(EVENTS.CHAT_COMMAND_VOTEMAP, chatCommand);
    listener.on(EVENTS.CHAT_MESSAGE, chatMessage);
    listener.on(EVENTS.NEW_GAME, newGame);
    const reset = () => {
        clearTimeout(timerDelayNextStart);
        clearTimeout(timerDelayStarting);
        clearInterval(timer);
        voteStarting = false;
        state.votingActive = false;
        votes = {
            '+': [],
            '-': [],
        };
    };
};

const warnPlayers = (state) => {
    const { listener, execute } = state;
    let warningTimeout;
    const sendWarningMessages = (steamID, messages) => {
        for (const message of messages) {
            adminWarn(execute, steamID, message);
        }
    };
    const playerConnected = (data) => {
        const { steamID } = data;
        const messages = [
            'Ознакомьтесь с правилами сервера, чтобы избежать неприятных ситуаций.',
            'Нарушение правил — прямой путь к бану. Соблюдайте правила и наслаждайтесь игрой!',
        ];
        sendWarningMessages(steamID, messages);
        setTimeout(() => {
            sendWarningMessages(steamID, messages);
        }, 60000);
    };
    const squadCreated = (data) => {
        const { steamID } = data;
        if (warningTimeout) {
            clearTimeout(warningTimeout);
        }
        const messages = [
            'Ознакомьтесь с правилами сервера, чтобы избежать неприятных ситуаций.',
            'Нарушение правил — прямой путь к бану. Соблюдайте правила и наслаждайтесь игрой!',
        ];
        sendWarningMessages(steamID, messages);
        warningTimeout = setTimeout(() => {
            sendWarningMessages(steamID, messages);
        }, 60000);
    };
    const playerRoleChanged = (data) => {
        const { role, steamID } = data.player;
        if (warningTimeout) {
            clearTimeout(warningTimeout);
        }
        const roleMessagesMap = new Map([
            ['Pilot', 'Запрещено управление вертолетом без навыков пилотирования!'],
            [
                'Crewman',
                'Передвижение на тяж. технике в одиночку и без Сквад лидера запрещено!',
            ],
        ]);
        for (const [checkRole, message] of roleMessagesMap) {
            if (role.includes(checkRole)) {
                adminWarn(execute, steamID, message);
                warningTimeout = setTimeout(() => {
                    adminWarn(execute, steamID, message);
                }, 60000);
            }
        }
    };
    const playerWounded = (data) => {
        if (data.victimName && data.attackerSteamID) ;
    };
    listener.on(EVENTS.PLAYER_CONNECTED, playerConnected);
    listener.on(EVENTS.SQUAD_CREATED, squadCreated);
    listener.on(EVENTS.PLAYER_ROLE_CHANGED, playerRoleChanged);
    listener.on(EVENTS.PLAYER_WOUNDED, playerWounded);
};

const plugins = [
    skipmap,
    voteMap,
    randomizerMaps,
    warnPlayers,
    squadLeaderRole,
    autoKickUnassigned,
    chatCommands,
    fobExplosionDamage,
];
const initPlugins = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const state = getServersState(id);
    plugins.forEach((fn) => {
        state.logger.log(`Initializing plugin: ${fn.name}`);
        const plugin = state.plugins.find((p) => p.name === fn.name);
        if (plugin && plugin.enabled) {
            state.logger.log(`Initialized plugin: ${fn.name}`);
            fn(state, plugin.options);
        }
        else {
            state.logger.warn(`Disabled plugin: ${fn.name}`);
        }
    });
    return new Promise((res) => res(true));
});

const convertObjToArrayEvents = (events) => Object.keys(events).map((event) => events[event]);
const chatCommandParser = (listener) => {
    listener.on(EVENTS.CHAT_MESSAGE, (data) => {
        const command = data.message.match(/!([^ ]+) ?(.*)/);
        if (command)
            listener.emit(`CHAT_COMMAND:${command[1].toLowerCase()}`, Object.assign(Object.assign({}, data), { message: command[2].trim() }));
    });
};

const initEvents = ({ rconEmitter, logsEmitter }) => {
    const coreEmitter = new EventEmitter();
    const localEmitter = new EventEmitter();
    coreEmitter.setMaxListeners(50);
    localEmitter.setMaxListeners(50);
    const rconEvents = convertObjToArrayEvents(RconEvents);
    const logsEvents = convertObjToArrayEvents(LogsReaderEvents);
    /* RCON EVENTS */
    rconEvents.forEach((event) => {
        // disabled dublicate, using only Logs SQUAD_CREATED
        if (event !== RconEvents.SQUAD_CREATED) {
            rconEmitter.on(event, (data) => coreEmitter.emit(event, data));
        }
    });
    /* LOGS EVENTS */
    logsEvents.forEach((event) => {
        logsEmitter.on(event, (data) => coreEmitter.emit(event, data));
    });
    chatCommandParser(coreEmitter);
    return { coreEmitter, localEmitter };
};

const __dirname$1 = url.fileURLToPath(new URL('.', import.meta.url));
const initMaps = (mapsName, mapsRegExp, logger) => __awaiter(void 0, void 0, void 0, function* () {
    logger.log('Loading maps');
    const filePath = path.resolve(__dirname$1, mapsName);
    if (!fs.existsSync(filePath)) {
        logger.error(`Maps ${mapsName} not found`);
        process.exit(1);
    }
    return new Promise((res) => {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (!data || !data.length) {
            logger.error(`Maps ${mapsName} empty`);
            process.exit(1);
        }
        const maps = {};
        data.forEach((map) => {
            const regexp = new RegExp(mapsRegExp);
            const matches = map.match(regexp);
            const groups = matches === null || matches === void 0 ? void 0 : matches.groups;
            if (!groups || !(groups === null || groups === void 0 ? void 0 : groups.layerName) || !(groups === null || groups === void 0 ? void 0 : groups.layerMode)) {
                logger.error(`RegExp parse ${map} error`);
                process.exit(1);
            }
            const { layerName, layerMode } = groups;
            maps[map] = { layerName, layerMode };
        });
        logger.log('Loaded maps');
        res(maps);
    });
});

const updateAdmins = (id, getAdmins) => __awaiter(void 0, void 0, void 0, function* () {
    const { coreListener, logger } = getServersState(id);
    logger.log('Updating admins');
    const admins = yield getAdmins();
    const state = getServersState(id);
    state.admins = admins;
    coreListener.emit(EVENTS.UPDATED_ADMINS, state.admins);
    logger.log('Updated admins');
});

const updateCurrentMap = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const { execute, coreListener, logger } = getServersState(id);
    logger.log('Updating current map');
    execute(EVENTS.SHOW_CURRENT_MAP);
    return new Promise((res) => {
        coreListener.once(EVENTS.SHOW_CURRENT_MAP, (data) => {
            getServersState(id).currentMap = data;
            logger.log('Updated current map');
            res(true);
        });
        setTimeout(() => res(true), UPDATERS_REJECT_TIMEOUT);
    });
});

const updateNextMap = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const { execute, coreListener, logger } = getServersState(id);
    logger.log('Updating next map');
    execute(EVENTS.SHOW_NEXT_MAP);
    return new Promise((res) => {
        coreListener.once(EVENTS.SHOW_NEXT_MAP, (data) => {
            getServersState(id).nextMap = data;
            logger.log('Updated next map');
            res(true);
        });
        setTimeout(() => res(true), UPDATERS_REJECT_TIMEOUT);
    });
});

const updatePlayers = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const { execute, coreListener, logger } = getServersState(id);
    logger.log('Updating players');
    execute(EVENTS.LIST_PLAYERS);
    return new Promise((res) => {
        coreListener.once(EVENTS.LIST_PLAYERS, (data) => {
            const state = getServersState(id);
            state.players = data.map((player) => {
                var _a;
                const playerFound = (_a = state.players) === null || _a === void 0 ? void 0 : _a.find((p) => p.steamID === player.steamID);
                if (playerFound) {
                    if (player.teamID !== playerFound.teamID)
                        coreListener.emit(EVENTS.PLAYER_TEAM_CHANGED, {
                            player: player,
                            oldTeamID: playerFound.teamID,
                            newTeamID: player.teamID,
                        });
                    if (player.squadID !== playerFound.squadID)
                        coreListener.emit(EVENTS.PLAYER_SQUAD_CHANGED, {
                            player: player,
                            oldSquadID: playerFound.squadID,
                            newSquadID: player.squadID,
                        });
                    if (player.role !== playerFound.role)
                        coreListener.emit(EVENTS.PLAYER_ROLE_CHANGED, {
                            player: player,
                            oldRole: playerFound.role,
                            newRole: player.role,
                            isLeader: player.isLeader,
                        });
                    if (player.isLeader !== playerFound.isLeader) {
                        coreListener.emit(EVENTS.PLAYER_LEADER_CHANGED, {
                            player: player,
                            oldRole: playerFound.role,
                            newRole: player.role,
                            isLeader: player.isLeader,
                        });
                    }
                    return Object.assign(Object.assign({}, playerFound), player);
                }
                return player;
            });
            coreListener.emit(EVENTS.UPDATED_PLAYERS, state.players);
            logger.log('Updated players');
            res(true);
        });
        setTimeout(() => res(true), UPDATERS_REJECT_TIMEOUT);
    });
});

const updateSquads = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const { execute, coreListener, logger } = getServersState(id);
    logger.log('Updating squads');
    execute(EVENTS.LIST_SQUADS);
    return new Promise((res) => {
        coreListener.once(EVENTS.LIST_SQUADS, (data) => {
            const state = getServersState(id);
            state.squads = [...data];
            coreListener.emit(EVENTS.UPDATED_SQUADS, state.squads);
            logger.log('Updated squads');
            res(true);
        });
        setTimeout(() => res(true), UPDATERS_REJECT_TIMEOUT);
    });
});

const initState = (id, getAdmins) => __awaiter(void 0, void 0, void 0, function* () {
    yield updateAdmins(id, getAdmins);
    yield updateCurrentMap(id);
    yield updateNextMap(id);
    yield updatePlayers(id);
    yield updateSquads(id);
    const state = getServersState(id);
    const { coreListener, listener } = state;
    let updateTimeout;
    let canRunUpdateInterval = true;
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        if (!canRunUpdateInterval)
            return;
        yield updatePlayers(id);
        yield updateSquads(id);
    }), UPDATE_TIMEOUT);
    const updatesOnEvents = () => __awaiter(void 0, void 0, void 0, function* () {
        canRunUpdateInterval = false;
        clearTimeout(updateTimeout);
        yield updatePlayers(id);
        yield updateSquads(id);
        updateTimeout = setTimeout(() => (canRunUpdateInterval = true), UPDATE_TIMEOUT);
    });
    for (const key in EVENTS) {
        const event = EVENTS[key];
        coreListener.on(event, (data) => __awaiter(void 0, void 0, void 0, function* () {
            if (event === EVENTS.PLAYER_CONNECTED || event === EVENTS.SQUAD_CREATED) {
                yield updatesOnEvents();
            }
            if (event === EVENTS.NEW_GAME) {
                yield updateAdmins(id, getAdmins);
                yield updateCurrentMap(id);
                yield updateNextMap(id);
            }
            if (event === EVENTS.TICK_RATE) {
                const tickRateData = data;
                state.tickRate = tickRateData.tickRate;
            }
            listener.emit(event, data);
        }));
    }
});

const initSquadJS = ({ id, mapsName, mapsRegExp, plugins, rcon, logs, }) => __awaiter(void 0, void 0, void 0, function* () {
    const { rconEmitter, execute } = rcon;
    const { logsEmitter, getAdmins } = logs;
    const { localEmitter, coreEmitter } = initEvents({
        rconEmitter,
        logsEmitter,
    });
    const logger = initLogger(id, true);
    const maps = yield initMaps(mapsName, mapsRegExp, logger);
    serversState[id] = {
        id,
        rcon,
        logs,
        listener: localEmitter,
        coreListener: coreEmitter,
        execute,
        logger,
        maps,
        plugins,
    };
    yield initState(id, getAdmins);
    yield initPlugins(id);
});

const initServer = (config) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, host, port, password, ftp, logFilePath, adminsFilePath } = config;
    const rcon = new Rcon({
        id,
        host,
        port,
        password,
    });
    const logsReaderConfig = ftp
        ? {
            id,
            host,
            adminsFilePath,
            autoReconnect: true,
            filePath: logFilePath,
            username: ftp.username,
            password: ftp.password,
            readType: 'remote',
        }
        : {
            id,
            filePath: logFilePath,
            adminsFilePath,
            readType: 'local',
            autoReconnect: true,
        };
    const logsReader = new LogsReader(logsReaderConfig);
    return Promise.all([
        new Promise((res, rej) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield rcon.init();
                res({
                    rconEmitter: rcon,
                    close: rcon.close.bind(rcon),
                    execute: rcon.execute.bind(rcon),
                });
            }
            catch (error) {
                rej(error);
            }
        })),
        new Promise((res, rej) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield logsReader.init();
                res({
                    logsEmitter: logsReader,
                    getAdmins: logsReader.getAdminsFile.bind(logsReader),
                    close: logsReader.close.bind(logsReader),
                });
            }
            catch (error) {
                rej(error);
            }
        })),
    ]);
});

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const getConfigs = () => {
    const configPath = path.resolve(__dirname, '../config.json');
    if (!fs.existsSync(configPath)) {
        console.log(chalk.yellow(`[SquadJS]`), chalk.red('Config file required!'));
        return null;
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return Object.keys(config).map((key) => {
        for (const option of [
            'host',
            'password',
            'port',
            'logFilePath',
            'adminsFilePath',
            'mapsName',
            'mapsRegExp',
            'plugins',
        ])
            if (!(option in config[key])) {
                console.log(chalk.yellow(`[SquadJS]`), chalk.red(`${option} required!`));
                process.exit(1);
            }
        return Object.assign({ id: parseInt(key, 10) }, config[key]);
    });
};

const initial = () => __awaiter(void 0, void 0, void 0, function* () {
    const configs = getConfigs();
    if (configs === null || configs === void 0 ? void 0 : configs.length) {
        for (const config of configs) {
            try {
                const [rcon, logs] = yield initServer(config);
                yield initSquadJS({
                    rcon,
                    logs,
                    id: config.id,
                    mapsName: config.mapsName,
                    mapsRegExp: config.mapsRegExp,
                    plugins: config.plugins,
                });
            }
            catch (error) {
                const err = error;
                if ((err === null || err === void 0 ? void 0 : err.id) && (err === null || err === void 0 ? void 0 : err.message)) {
                    console.log(chalk.yellow(`[SquadJS]`), chalk.red(`Server ${err.id} error: ${err.message}`));
                }
                else {
                    console.log(chalk.yellow(`[SquadJS]`), chalk.red(error));
                }
            }
        }
    }
});
initial();
