import chalk from 'chalk';
import { format } from 'date-fns';
import { LogsReaderEvents, LogsReader } from 'squad-logs';
import { RconEvents, Rcon } from 'squad-rcon';
import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import EventEmitter from 'events';
import fs$1 from 'fs';
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
const adminKillServer = (execute) => __awaiter(void 0, void 0, void 0, function* () {
    yield execute(`AdminKillServer`);
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
    CHAT_COMMAND_SKIPMAP: 'CHAT_COMMAND:skipmap', CHAT_COMMAND_VOTEMAP: 'CHAT_COMMAND:votemap', CHAT_COMMAND_ADMINS: 'CHAT_COMMAND:admins', CHAT_COMMAND_REPORT: 'CHAT_COMMAND:report', CHAT_COMMAND_R: 'CHAT_COMMAND:r', CHAT_COMMAND_STVOL: 'CHAT_COMMAND:ствол', CHAT_COMMAND_FIX: 'CHAT_COMMAND:fix', CHAT_COMMAND_BONUS: 'CHAT_COMMAND:bonus', CHAT_COMMAND_STATS: 'CHAT_COMMAND:stats', CHAT_COMMAND_DISCORD: 'CHAT_COMMAND:discord', CHAT_COMMAND_SWITCH: 'CHAT_COMMAND:switch', CHAT_COMMAND_SWAP: 'CHAT_COMMAND:swap', CHAT_COMMAND_SW: 'CHAT_COMMAND:sw' });
const UPDATERS_REJECT_TIMEOUT = 10000;
const UPDATE_TIMEOUT = 30000;

const getPlayerBySteamID = (state, steamID) => { var _a; return ((_a = state.players) === null || _a === void 0 ? void 0 : _a.find((player) => player.steamID === steamID)) || null; };
const getPlayerByEOSID = (state, eosID) => { var _a; return ((_a = state.players) === null || _a === void 0 ? void 0 : _a.find((player) => player.eosID === eosID)) || null; };
const getPlayerByName = (state, name) => { var _a; return ((_a = state.players) === null || _a === void 0 ? void 0 : _a.find((player) => player.name.includes(name))) || null; };
const getSquadByID = (state, squadID) => { var _a; return ((_a = state.squads) === null || _a === void 0 ? void 0 : _a.find((squad) => squad.squadID === squadID)) || null; };
const getAdmins = (state, adminPermission) => state.admins
    ? Object.keys(state.admins).filter((admin) => { var _a; return (_a = state.admins) === null || _a === void 0 ? void 0 : _a[admin][adminPermission]; })
    : null;
const getPlayers = (state) => state.players;

const autoKickUnassigned = (state, options) => {
    const { listener, execute, logger } = state;
    const { minPlayersForAfkKick, kickTimeout, warningInterval, gracePeriod } = options;
    const trackedPlayers = {};
    let betweenRounds = false;
    const trackingListUpdateFrequency = 1 * 60 * 1000; // 1min
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
        const admins = getAdmins(state, 'cameraman');
        const players = getPlayers(state);
        if (!players)
            return;
        const run = !(betweenRounds || players.length < minPlayersForAfkKick);
        logger.log(`Update Tracking List? ${run} (Between rounds: ${betweenRounds}, Below player threshold: ${players.length < minPlayersForAfkKick})`);
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
            if (!isUnassigned && isTracked)
                untrackPlayer(player.steamID, 'Вступил в отряд');
            if (!isUnassigned)
                continue;
            if (isAdmin)
                logger.log(`Admin is Unassigned: ${player.name}`);
            if (isAdmin)
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

let db;
const dbName = 'SquadJS';
const dbCollectionMain = 'mainstats';
const dbCollectionTemp = 'tempstats';
const dbCollectionServerInfo = 'serverinfo';
let collectionMain;
let collectionTemp;
let collectionServerInfo;
let isConnected = false;
let reconnectTimer = null;
let dbLink;
const cleaningTime = 604800000;
function connectToDatabase(dbURL) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new MongoClient(dbURL);
        dbLink = dbURL;
        try {
            yield client.connect();
            console.log('Connected to MongoDB');
            db = client.db(dbName);
            collectionMain = db.collection(dbCollectionMain);
            collectionTemp = db.collection(dbCollectionTemp);
            collectionServerInfo = db.collection(dbCollectionServerInfo);
            isConnected = true;
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
            setInterval(pingDatabase, 60000);
        }
        catch (err) {
            console.error('Error connecting to MongoDB:', err);
            isConnected = false;
            setReconnectTimer(dbLink);
        }
    });
}
function pingDatabase(dbLink) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pingResult = yield db.command({ ping: 1 });
            if (pingResult.ok === 1) {
                console.log('Database pinged successfully');
            }
        }
        catch (error) {
            const getTime = () => format(new Date(), 'd LLL HH:mm:ss');
            console.error(`[${getTime()}]Error pinging database`);
            isConnected = false;
            setReconnectTimer(dbLink);
        }
    });
}
function setReconnectTimer(dbLink) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!reconnectTimer) {
            reconnectTimer = setTimeout(() => {
                reconnectTimer = null;
                connectToDatabase(dbLink);
            }, 30000);
        }
    });
}
function createUserIfNullableOrUpdateName(steamID, name) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!db || !isConnected)
            return;
        try {
            const resultMain = yield collectionMain.findOne({
                _id: steamID,
            });
            const resultTemp = yield collectionTemp.findOne({
                _id: steamID,
            });
            const fields = {
                _id: steamID,
                name: name.trim(),
                kills: 0,
                death: 0,
                revives: 0,
                teamkills: 0,
                kd: 0,
                bonuses: 0,
                exp: 0,
                possess: {},
                roles: {},
                squad: { timeplayed: 0, leader: 0, cmd: 0 },
                matches: {
                    matches: 0,
                    winrate: 0,
                    won: 0,
                    lose: 0,
                    history: { matches: [] },
                },
                weapons: {},
            };
            if (!resultMain) {
                yield collectionMain.insertOne(fields);
            }
            if (!resultTemp) {
                yield collectionTemp.insertOne(fields);
            }
            if (resultMain) {
                if (name.trim() !== resultMain.name.trim()) {
                    yield updateUserName(steamID, name.trim());
                }
            }
        }
        catch (err) {
            throw err;
        }
    });
}
function updateUserName(steamID, name) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isConnected)
            return;
        try {
            const doc = {
                $set: {
                    name,
                },
            };
            const user = {
                _id: steamID,
            };
            yield collectionMain.updateOne(user, doc);
            yield collectionTemp.updateOne(user, doc);
        }
        catch (err) {
            throw err;
        }
    });
}
function updateUserBonuses(steamID, count) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isConnected)
            return;
        try {
            const doc = {
                $inc: {
                    bonuses: count,
                },
            };
            const user = {
                _id: steamID,
            };
            yield collectionMain.updateOne(user, doc);
        }
        catch (err) {
            throw err;
        }
    });
}
function updateRoles(steamID, role) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isConnected)
            return;
        const roles = [
            '_sl_',
            '_slcrewman',
            '_slpilot',
            '_pilot',
            '_medic',
            '_crewman',
            '_unarmed',
            '_ar',
            '_rifleman',
            '_marksman',
            '_lat',
            '_grenadier',
            '_hat',
            '_machinegunner',
            '_sniper',
            '_infiltrator',
            '_raider',
            '_ambusher',
            '_engineer',
            '_sapper',
            '_saboteur',
        ];
        const engineer = ['_sapper', '_saboteur'];
        roles.forEach((e) => {
            if (role.toLowerCase().includes(e)) {
                if (engineer.some((el) => role.toLowerCase().includes(el))) {
                    role = '_engineer';
                    return;
                }
                role = e;
            }
        });
        const rolesFilter = `roles.${role}`;
        const doc = {
            $inc: {
                [rolesFilter]: 1,
            },
        };
        const user = {
            _id: steamID,
        };
        yield collectionMain.updateOne(user, doc);
    });
}
function updateTimes(steamID, field, name) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isConnected)
            return;
        const squadFilter = `squad.${field}`;
        const doc = {
            $inc: {
                [squadFilter]: 1,
            },
        };
        const user = {
            _id: steamID,
        };
        yield collectionMain.updateOne(user, doc);
        yield updateCollectionTemp(user, doc, name);
    });
}
function updatePossess(steamID, field) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isConnected)
            return;
        if (field.toLowerCase().includes('soldier'))
            return;
        const possessFilter = `possess.${field}`;
        const doc = {
            $inc: {
                [possessFilter]: 1,
            },
        };
        const user = {
            _id: steamID,
        };
        yield collectionMain.updateOne(user, doc);
    });
}
function getUserDataWithSteamID(steamID) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isConnected)
            return;
        const result = yield collectionMain.findOne({
            _id: steamID,
        });
        if (!result)
            return;
        return result;
    });
}
function updateUser(steamID, field, weapon) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!steamID || !field || !isConnected)
            return;
        const doc = {
            $inc: {
                [field]: 1,
            },
        };
        const user = {
            _id: steamID,
        };
        yield collectionMain.updateOne(user, doc);
        yield collectionTemp.updateOne(user, doc);
        if (field === 'kills' && weapon !== 'null') {
            const weaponFilter = `weapons.${weapon}`;
            const doc = {
                $inc: {
                    [weaponFilter]: 1,
                },
            };
            const user = {
                _id: steamID,
            };
            yield collectionMain.updateOne(user, doc);
            yield collectionTemp.updateOne(user, doc);
        }
        if (field === 'kills' || field === 'death') {
            const resultMain = yield collectionMain.findOne({
                _id: steamID,
            });
            const resultTemp = yield collectionTemp.findOne({
                _id: steamID,
            });
            if (resultMain) {
                let kd;
                if (resultMain.death && isFinite(resultMain.kills / resultMain.death)) {
                    kd = Number((resultMain.kills / resultMain.death).toFixed(2));
                }
                else {
                    kd = resultMain.kills;
                }
                const doc = {
                    $set: {
                        kd: kd,
                    },
                };
                yield collectionMain.updateOne(user, doc);
            }
            if (resultTemp) {
                let kd;
                if (resultTemp.death && isFinite(resultTemp.kills / resultTemp.death)) {
                    kd = Number((resultTemp.kills / resultTemp.death).toFixed(2));
                }
                else {
                    kd = resultTemp.kills;
                }
                const doc = {
                    $set: {
                        kd: kd,
                    },
                };
                yield collectionTemp.updateOne(user, doc);
            }
        }
    });
}
function updateGames(steamID, field) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isConnected)
            return;
        const matchesFilter = `matches.${field}`;
        const doc = {
            $inc: {
                [matchesFilter]: 1,
            },
        };
        const user = {
            _id: steamID,
        };
        yield collectionMain.updateOne(user, doc);
        yield collectionTemp.updateOne(user, doc);
        if (field === 'won' || field === 'lose') {
            const resultMain = yield collectionMain.findOne({
                _id: steamID,
            });
            const resultTemp = yield collectionTemp.findOne({
                _id: steamID,
            });
            const matchesMain = ((resultMain === null || resultMain === void 0 ? void 0 : resultMain.matches.won) || 0) + ((resultMain === null || resultMain === void 0 ? void 0 : resultMain.matches.lose) || 0);
            const matchesTemp = ((resultTemp === null || resultTemp === void 0 ? void 0 : resultTemp.matches.won) || 0) + ((resultTemp === null || resultTemp === void 0 ? void 0 : resultTemp.matches.lose) || 0);
            if (resultMain) {
                const doc = {
                    $set: {
                        'matches.matches': matchesMain,
                        'matches.winrate': Number(((resultMain.matches.won / matchesMain) * 100).toFixed(3)),
                    },
                };
                yield collectionMain.updateOne(user, doc);
            }
            if (resultTemp) {
                const doc = {
                    $set: {
                        'matches.matches': matchesTemp,
                        'matches.winrate': Number(((resultTemp.matches.won / matchesTemp) * 100).toFixed(3)),
                    },
                };
                yield collectionTemp.updateOne(user, doc);
            }
        }
    });
}
function serverHistoryLayers(serverID, rnsHistoryLayers) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!rnsHistoryLayers || !isConnected)
            return;
        const server = yield collectionServerInfo.findOne({
            _id: serverID.toString(),
        });
        if (!server)
            return;
        const data = {
            $push: {
                rnsHistoryLayers,
            },
        };
        yield collectionServerInfo.updateOne(server, data);
    });
}
function getHistoryLayers(serverID) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isConnected)
            return [];
        const result = yield collectionServerInfo.findOne({
            _id: serverID.toString(),
        });
        return (result === null || result === void 0 ? void 0 : result.rnsHistoryLayers) || [];
    });
}
function cleanHistoryLayers(serverID, rnsHistoryLayers) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isConnected)
            return;
        const result = yield collectionServerInfo.findOne({
            _id: serverID.toString(),
        });
        if (!result)
            return;
        const data = {
            $set: { rnsHistoryLayers: [rnsHistoryLayers] },
        };
        yield collectionServerInfo.updateOne(result, data);
    });
}
function getTimeStampForRestartServer(serverID) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isConnected)
            return;
        const server = yield collectionServerInfo.findOne({
            _id: serverID.toString(),
        });
        return server === null || server === void 0 ? void 0 : server.timeStampToRestart;
    });
}
function createTimeStampForRestartServer(serverID) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isConnected)
            return;
        const date = new Date().getTime();
        const id = {
            _id: serverID.toString(),
        };
        const data = {
            $set: {
                timeStampToRestart: date,
            },
        };
        yield collectionServerInfo.updateOne(id, data);
    });
}
function updateCollectionTemp(user, doc, name) {
    return __awaiter(this, void 0, void 0, function* () {
        const tempStats = yield collectionTemp.updateOne(user, doc);
        if (tempStats.modifiedCount !== 1) {
            yield createUserIfNullableOrUpdateName(user._id, name);
            yield collectionTemp.updateOne(user, doc);
        }
    });
}
function creatingTimeStamp() {
    return __awaiter(this, void 0, void 0, function* () {
        const date = new Date().getTime();
        const userTemp = {
            _id: 'dateTemp',
        };
        const dateTemp = {
            $set: {
                date,
            },
        };
        const timeTemp = yield collectionMain.findOne({
            _id: 'dateTemp',
        });
        if (!timeTemp || !timeTemp.date)
            return;
        const checkOutOfDate = date - timeTemp.date;
        if (checkOutOfDate > cleaningTime) {
            console.log('Статистика очищена');
            yield collectionTemp.deleteMany({});
            yield collectionMain.updateOne(userTemp, dateTemp);
        }
    });
}

const autorestartServers = (state) => {
    const { listener, execute, logger, id } = state;
    let restartTimeout;
    let isRestartTimeoutSet = false;
    const setRestartTimeout = () => {
        restartTimeout = setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            logger.log('Рестарт сервера...');
            yield createTimeStampForRestartServer(id);
            yield adminKillServer(execute);
            isRestartTimeoutSet = false;
        }), 300000);
        isRestartTimeoutSet = true;
    };
    const clearRestartTimeout = () => {
        clearTimeout(restartTimeout);
        isRestartTimeoutSet = false;
    };
    const autorestart = (data) => __awaiter(void 0, void 0, void 0, function* () {
        const lastRestartTime = yield getTimeStampForRestartServer(id);
        if (!lastRestartTime)
            return;
        if (new Date().getTime() - lastRestartTime > 86400000) {
            if (data.length === 0) {
                if (!isRestartTimeoutSet)
                    setRestartTimeout();
            }
            else {
                if (isRestartTimeoutSet) {
                    clearRestartTimeout();
                }
            }
        }
    });
    listener.on(EVENTS.UPDATED_PLAYERS, autorestart);
};

const bonuses = (state, options) => {
    const { listener } = state;
    const { classicBonus, seedBonus } = options;
    let playersBonusesCurrentTime = [];
    const playerConnected = (data) => {
        const user = getPlayerByEOSID(state, data.eosID);
        if (!user)
            return;
        const { steamID, name } = user;
        createUserIfNullableOrUpdateName(steamID, name);
    };
    const updatedPlayers = () => {
        const { players, currentMap } = state;
        if (!players)
            return;
        players.forEach((e) => {
            const { steamID } = e;
            if (!steamID)
                return;
            if (playersBonusesCurrentTime.find((e) => e.steamID === steamID))
                return;
            playersBonusesCurrentTime.push({
                steamID,
                timer: setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
                    var _a;
                    if ((_a = currentMap === null || currentMap === void 0 ? void 0 : currentMap.layer) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes('seed')) {
                        yield updateUserBonuses(steamID, seedBonus);
                    }
                    else {
                        yield updateUserBonuses(steamID, classicBonus);
                    }
                }), 60000),
            });
        });
        playersBonusesCurrentTime = playersBonusesCurrentTime.filter((e) => {
            const currentUser = players.find((c) => c.steamID === e.steamID);
            if (!currentUser) {
                clearInterval(e.timer);
                return false;
            }
            return e;
        });
    };
    listener.on(EVENTS.PLAYER_CONNECTED, playerConnected);
    listener.on(EVENTS.UPDATED_PLAYERS, updatedPlayers);
};

const chatCommands = (state, options) => {
    const { listener, execute } = state;
    const { adminsEnable, reportEnable, stvolEnable, fixEnable, discordEnable, statsEnable, bonusEnable, swapEnable, swapTimeout, } = options;
    let players = [];
    let timeoutPlayers = [];
    const swapHistory = [];
    const admins = (data) => {
        if (!adminsEnable)
            return;
        adminWarn(execute, data.steamID, 'На сервере присутствует администратор');
        adminWarn(execute, data.steamID, 'Для связи с администратором перейдите в дискорд канал discord.gg/rn-server');
    };
    const report = (data) => {
        if (!reportEnable)
            return;
        adminWarn(execute, data.steamID, `Для завершения репорта, создайте тикет в discord.gg/rn-server`);
    };
    const stvol = (data) => {
        if (!stvolEnable)
            return;
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
        if (!fixEnable)
            return;
        adminForceTeamChange(execute, data.steamID);
        adminForceTeamChange(execute, data.steamID);
    };
    const discord = (data) => {
        if (!discordEnable)
            return;
        adminWarn(execute, data.steamID, 'Discord сервера - https://discord.gg/rn-server');
        adminWarn(execute, data.steamID, 'Либо в дискорде "Добавить сервер -> rn-server"');
    };
    const stats = (data) => __awaiter(void 0, void 0, void 0, function* () {
        if (!statsEnable)
            return;
        const { steamID, message } = data;
        let user;
        if (timeoutPlayers.find((p) => p === steamID)) {
            adminWarn(execute, steamID, 'Разрешено использовать раз в 3 минуты!');
            return;
        }
        if (message.length === 0) {
            user = yield getUserDataWithSteamID(steamID);
        }
        else {
            const { players } = state;
            const getPlayer = players === null || players === void 0 ? void 0 : players.find((p) => p.name.trim().toLowerCase().includes(message.trim().toLowerCase()));
            if (!getPlayer) {
                adminWarn(execute, steamID, 'Имя указано неверно, либо игрок отсутствует на сервере!');
            }
            else {
                user = yield getUserDataWithSteamID(getPlayer.steamID);
            }
        }
        if (!user)
            return;
        const { name, kills, death, revives, teamkills, kd } = user;
        adminWarn(execute, steamID, `Игрок: ${name}\nУбийств: ${kills}\nСмертей: ${death}\nПомощь: ${revives}\nТимкилы: ${teamkills}\nK/D: ${kd}
       `);
        timeoutPlayers.push(steamID);
        setTimeout(() => {
            timeoutPlayers = timeoutPlayers.filter((p) => p !== steamID);
        }, 180000);
    });
    const bonus = (data) => __awaiter(void 0, void 0, void 0, function* () {
        if (!bonusEnable)
            return;
        const { steamID } = data;
        const user = yield getUserDataWithSteamID(steamID);
        if (!user)
            return;
        const bonus = user.bonuses;
        adminWarn(execute, steamID, `У вас бонусов ${bonus || 0}`);
        adminWarn(execute, steamID, 'За час игры 60 бонусов, на Seed картах 120 бонусов');
        adminWarn(execute, steamID, 'Для получения Vip статуса за бонусы нажмите на кнопку в дискорде discord.gg/rn-server в канале получить-vip');
        adminWarn(execute, steamID, 'Стоимость Vip статуса равна 15 000 баллов');
    });
    const swap = (data) => __awaiter(void 0, void 0, void 0, function* () {
        if (!swapEnable)
            return;
        const deletionTime = parseInt(swapTimeout);
        console.log(deletionTime);
        const { steamID } = data;
        const existingEntry = swapHistory.find((entry) => entry.steamID === steamID);
        if (existingEntry) {
            const remainingTime = deletionTime - (Date.now() - existingEntry.startTime);
            const remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
            const remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            adminWarn(execute, steamID, `Команда доступна через ${remainingHours} ч ${remainingMinutes} мин!`);
            return;
        }
        adminForceTeamChange(execute, steamID);
        const deletionTimer = setTimeout(() => removeSteamID(steamID), deletionTime);
        swapHistory.push({
            steamID: steamID,
            deletionTimer: deletionTimer,
            startTime: Date.now(),
        });
    });
    function removeSteamID(steamID) {
        const index = swapHistory.findIndex((entry) => entry.steamID === steamID);
        if (index !== -1) {
            clearTimeout(swapHistory[index].deletionTimer);
            swapHistory.splice(index, 1);
        }
    }
    listener.on(EVENTS.CHAT_COMMAND_ADMINS, admins);
    listener.on(EVENTS.CHAT_COMMAND_REPORT, report);
    listener.on(EVENTS.CHAT_COMMAND_R, report);
    listener.on(EVENTS.CHAT_COMMAND_STVOL, stvol);
    listener.on(EVENTS.CHAT_COMMAND_FIX, fix);
    listener.on(EVENTS.CHAT_COMMAND_BONUS, bonus);
    listener.on(EVENTS.CHAT_COMMAND_STATS, stats);
    listener.on(EVENTS.CHAT_COMMAND_DISCORD, discord);
    listener.on(EVENTS.CHAT_COMMAND_SWITCH, swap);
    listener.on(EVENTS.CHAT_COMMAND_SWAP, swap);
    listener.on(EVENTS.CHAT_COMMAND_SW, swap);
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
    const newGame = () => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = state;
        rnsHistoryLayers = yield getHistoryLayers(id);
        const map = yield recursiveGenerate();
        if (map) {
            logger.log(`Set next Layer ${map}`);
            console.log(rnsHistoryLayers);
            yield adminSetNextLayer(execute, map);
        }
    });
    listener.on(EVENTS.NEW_GAME, newGame);
    const recursiveGenerate = () => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = state;
        if (rnsHistoryLayers.length >= historyLayersMax) {
            yield cleanHistoryLayers(id, rnsHistoryLayers[historyLayersMax - 1]);
        }
        if (rnsHistoryLayers.length >= historyLayersMax) {
            rnsHistoryLayers = rnsHistoryLayers.slice(-1);
            return recursiveGenerate();
        }
        const layer = getRandomLayer();
        if (!rnsHistoryLayers.find((e) => e === layer.layer)) {
            yield serverHistoryLayers(id, layer.layer);
            return layer.map;
        }
        return recursiveGenerate();
    });
    const getRandomLayer = () => {
        const layersLength = Object.keys(state.maps).length;
        const random = Math.floor(Math.random() * layersLength);
        const map = Object.keys(state.maps)[random];
        const layer = state.maps[map].layerName;
        return { layer, map };
    };
};

const rnsStats = (state) => {
    const { listener, execute } = state;
    let playersCurrenTime = [];
    let winner;
    const onRoundTickets = (data) => {
        const { team, action } = data;
        if (action === 'won')
            winner = team;
    };
    const onRoundEnded = () => __awaiter(void 0, void 0, void 0, function* () {
        if (state.skipmap)
            return;
        const { players } = state;
        if (!players)
            return;
        for (const player of players) {
            const { teamID, steamID, possess } = player;
            const user = yield getUserDataWithSteamID(steamID);
            if (user)
                adminWarn(execute, steamID, `Игрок: ${user.name}\nУбийств: ${user.kills}\nСмертей: ${user.death}\nПомощь: ${user.revives}\nТимкилы: ${user.teamkills}\nK/D: ${user.kd}
        `);
            if (possess === null || possess === void 0 ? void 0 : possess.toLowerCase().includes('developeradmincam'))
                return;
            if (!winner)
                return;
            if (teamID === winner) {
                updateGames(steamID, 'won');
            }
            else {
                updateGames(steamID, 'lose');
            }
        }
        winner = '';
        yield creatingTimeStamp();
    });
    const updatedPlayers = () => {
        const { players } = state;
        if (!players)
            return;
        players.forEach((e) => {
            const { steamID } = e;
            if (!steamID)
                return;
            if (playersCurrenTime.find((e) => e.steamID === steamID))
                return;
            playersCurrenTime.push({
                steamID,
                timer: setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
                    const user = getPlayerBySteamID(state, steamID);
                    if (user && user.possess) {
                        yield updatePossess(steamID, user.possess);
                    }
                    if (user && user.role) {
                        yield updateRoles(steamID, user.role);
                    }
                    if (user && user.isLeader && user.squadID) {
                        yield updateTimes(steamID, 'leader', user.name);
                        const squad = getSquadByID(state, user.squadID);
                        if ((squad && squad.squadName === 'CMD Squad') ||
                            (squad && squad.squadName === 'Command Squad')) {
                            yield updateTimes(steamID, 'cmd', user.name);
                        }
                    }
                    if (user) {
                        yield updateTimes(steamID, 'timeplayed', user.name);
                    }
                }), 60000),
            });
        });
        playersCurrenTime = playersCurrenTime.filter((e) => {
            const currentUser = players.find((c) => c.steamID === e.steamID);
            if (!currentUser) {
                clearInterval(e.timer);
                return false;
            }
            return e;
        });
    };
    const onDied = (data) => {
        var _a;
        const { currentMap } = state;
        if ((_a = currentMap === null || currentMap === void 0 ? void 0 : currentMap.layer) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes('seed'))
            return;
        const { attackerSteamID, victimName, attackerEOSID } = data;
        const attacker = getPlayerByEOSID(state, attackerEOSID);
        const victim = getPlayerByName(state, victimName);
        if (!victim)
            return;
        if ((attacker === null || attacker === void 0 ? void 0 : attacker.teamID) === (victim === null || victim === void 0 ? void 0 : victim.teamID) && attacker.name !== victim.name) {
            return updateUser(attackerSteamID, 'teamkills');
        }
        updateUser(attackerSteamID, 'kills', victim.weapon || 'null');
        updateUser(victim.steamID, 'death');
    };
    const onRevived = (data) => {
        var _a;
        const { currentMap } = state;
        if ((_a = currentMap === null || currentMap === void 0 ? void 0 : currentMap.layer) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes('seed'))
            return;
        const { reviverSteamID } = data;
        updateUser(reviverSteamID, 'revives');
    };
    listener.on(EVENTS.UPDATED_PLAYERS, updatedPlayers);
    listener.on(EVENTS.PLAYER_DIED, onDied);
    listener.on(EVENTS.PLAYER_REVIVED, onRevived);
    listener.on(EVENTS.ROUND_ENDED, onRoundEnded);
    listener.on(EVENTS.ROUND_TICKETS, onRoundTickets);
};

const rename = promisify(fs.rename);
const rnsLogs = (state, options) => {
    const { listener } = state;
    const { logPath } = options;
    let logData = []; // Массив для хранения данных перед записью в файл
    const writeInterval = 6000; // Интервал записи данных (1 минута)
    const cleanLogsInterval = 24 * 60 * 60 * 1000; // Интервал очистки старых логов (сутки)
    let matchIsEnded = false;
    function cleanOldLogsFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentDate = new Date();
            const expiryLogDate = new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 дня
            try {
                const files = yield fs.readdir(logPath);
                console.log(files);
                for (const file of files) {
                    const filePath = path.join(logPath, file);
                    const stats = yield fs.stat(filePath);
                    if (stats.mtime < expiryLogDate) {
                        yield fs.unlink(filePath);
                    }
                }
            }
            catch (err) {
                console.error('Ошибка чтения директории:', err);
            }
        });
    }
    function writeLogToFile(tempData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!tempData)
                return;
            if (tempData.length === 0)
                return;
            if (matchIsEnded)
                return;
            const { currentMap } = state;
            const logFilePath = `${logPath}${currentMap === null || currentMap === void 0 ? void 0 : currentMap.layer}.json`;
            try {
                let logs = [];
                try {
                    const data = yield fs.readFile(logFilePath, 'utf-8');
                    logs = JSON.parse(data);
                }
                catch (err) {
                    logs = [];
                }
                logs = logs.concat(tempData);
                yield fs.writeFile(logFilePath, JSON.stringify(logs, null, 2));
            }
            catch (error) {
                console.error(error);
            }
        });
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
    function renameFileLog(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { time, layer } = data;
            const currentFilePath = `${logPath}${layer}.json`;
            const newName = `${time}_${layer}`;
            const safeNewName = newName.replace(/[:*?"<>|]/g, '.');
            const newFilePath = `${logPath}${safeNewName}.json`;
            try {
                yield rename(currentFilePath, newFilePath);
            }
            catch (err) {
                console.error('Ошибка при переименовании файла:', err);
            }
        });
    }
    function onNewGame(data) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    function onPlayerConnected(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (matchIsEnded)
                return;
            const { steamID } = data;
            const currentTime = new Date().toLocaleString('ru-RU', {
                timeZone: 'Europe/Moscow',
            });
            const player = getPlayerBySteamID(state, steamID);
            logData.push({
                currentTime,
                action: 'Connect',
                player: (player === null || player === void 0 ? void 0 : player.name) ? player : null,
            });
        });
    }
    function onPlayerDisconnected(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (matchIsEnded)
                return;
            const { eosID } = data;
            const currentTime = new Date().toLocaleString('ru-RU', {
                timeZone: 'Europe/Moscow',
            });
            const player = getPlayerByEOSID(state, eosID);
            logData.push({
                currentTime,
                action: 'Disconnected',
                player: (player === null || player === void 0 ? void 0 : player.name) ? player : null,
            });
        });
    }
    function onRoundEnded() {
        return __awaiter(this, void 0, void 0, function* () {
            matchIsEnded = true;
            const { currentMap } = state;
            const currentTime = new Date().toLocaleString('ru-RU', {
                timeZone: 'Europe/Moscow',
            });
            const nameLogFile = {
                time: currentTime,
                layer: (currentMap === null || currentMap === void 0 ? void 0 : currentMap.layer) || 'Undefined',
            };
            logData.push({
                currentTime,
                action: 'RoundEnd',
            });
            yield writeLogToFile(logData);
            logData = [];
            yield renameFileLog(nameLogFile);
        });
    }
    function onPlayerWounded(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (matchIsEnded)
                return;
            const { attackerEOSID, victimName, damage } = data;
            const victim = getPlayerByName(state, victimName);
            const attacker = getPlayerByEOSID(state, attackerEOSID);
            const currentTime = new Date().toLocaleString('ru-RU', {
                timeZone: 'Europe/Moscow',
            });
            if (attacker &&
                victim &&
                (attacker === null || attacker === void 0 ? void 0 : attacker.teamID) === (victim === null || victim === void 0 ? void 0 : victim.teamID) &&
                attacker.name !== victim.name) {
                logData.push({
                    currentTime,
                    action: 'TeamKill',
                    damage,
                    attacker: (attacker === null || attacker === void 0 ? void 0 : attacker.name) ? attacker : null,
                    victim: (victim === null || victim === void 0 ? void 0 : victim.name) ? victim : null,
                });
            }
            else {
                logData.push({
                    currentTime,
                    action: 'Wound',
                    damage,
                    attacker: (attacker === null || attacker === void 0 ? void 0 : attacker.name) ? attacker : null,
                    victim: (victim === null || victim === void 0 ? void 0 : victim.name) ? victim : null,
                });
            }
        });
    }
    function onPlayerDamaged(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (matchIsEnded)
                return;
            const { attackerEOSID, victimName, damage } = data;
            const victim = getPlayerByName(state, victimName);
            const attacker = getPlayerByEOSID(state, attackerEOSID);
            const currentTime = new Date().toLocaleString('ru-RU', {
                timeZone: 'Europe/Moscow',
            });
            if (attacker &&
                victim &&
                (attacker === null || attacker === void 0 ? void 0 : attacker.teamID) === (victim === null || victim === void 0 ? void 0 : victim.teamID) &&
                attacker.name !== victim.name) {
                logData.push({
                    currentTime,
                    action: 'TeamDamaged',
                    damage,
                    attacker: (attacker === null || attacker === void 0 ? void 0 : attacker.name) ? attacker : null,
                    victim: (victim === null || victim === void 0 ? void 0 : victim.name) ? victim : null,
                });
            }
            else {
                logData.push({
                    currentTime,
                    action: 'PlayerDamaged',
                    damage,
                    attacker: (attacker === null || attacker === void 0 ? void 0 : attacker.name) ? attacker : null,
                    victim: (victim === null || victim === void 0 ? void 0 : victim.name) ? victim : null,
                });
            }
        });
    }
    function onPlayerDied(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (matchIsEnded)
                return;
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
                attacker: (attacker === null || attacker === void 0 ? void 0 : attacker.name) ? attacker : null,
                victim: (victim === null || victim === void 0 ? void 0 : victim.name) ? victim : null,
            });
        });
    }
    function onPlayerRevived(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (matchIsEnded)
                return;
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
        });
    }
    function onRoleChanged(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (matchIsEnded)
                return;
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
        });
    }
    function onDeployableDamaged(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (matchIsEnded)
                return;
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
                player: (player === null || player === void 0 ? void 0 : player.name) ? player : null,
            });
        });
    }
    function onChatMessage(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (matchIsEnded)
                return;
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
        });
    }
    function onSquadCreated(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (matchIsEnded)
                return;
            const { time, squadName, eosID } = data;
            const player = getPlayerByEOSID(state, eosID);
            const currentTime = new Date(time).toLocaleString('ru-RU', {
                timeZone: 'Europe/Moscow',
            });
            logData.push({
                currentTime,
                action: 'SquadCreated',
                squadName,
                player: (player === null || player === void 0 ? void 0 : player.name) ? player : null,
            });
        });
    }
    function onEntry(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (matchIsEnded)
                return;
            const { name } = data;
            const currentTime = new Date().toLocaleString('ru-RU', {
                timeZone: 'Europe/Moscow',
            });
            logData.push({
                currentTime,
                action: 'EntryCamera',
                name,
            });
        });
    }
    function onExit(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (matchIsEnded)
                return;
            const { name } = data;
            const currentTime = new Date().toLocaleString('ru-RU', {
                timeZone: 'Europe/Moscow',
            });
            logData.push({
                currentTime,
                action: 'ExitCamera',
                name,
            });
        });
    }
    function onPlayerPossess(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (matchIsEnded)
                return;
            const { eosID, possessClassname } = data;
            const currentTime = new Date().toLocaleString('ru-RU', {
                timeZone: 'Europe/Moscow',
            });
            const player = getPlayerByEOSID(state, eosID);
            logData.push({
                currentTime,
                action: 'Possess',
                player: (player === null || player === void 0 ? void 0 : player.name) ? player : null,
                possessClassname,
            });
        });
    }
    function onPlayerSuicide(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (matchIsEnded)
                return;
            const { name } = data;
            const currentTime = new Date().toLocaleString('ru-RU', {
                timeZone: 'Europe/Moscow',
            });
            const player = getPlayerByName(state, name);
            logData.push({
                currentTime,
                action: 'Suicide',
                player: (player === null || player === void 0 ? void 0 : player.name) ? player : null,
            });
        });
    }
    function onVehicleDamage(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (matchIsEnded)
                return;
            const { damage, attackerName, victimVehicle, attackerVehicle, healthRemaining, } = data;
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

const skipmap = (state, options) => {
    const { listener, execute } = state;
    const { voteTick, voteDuration, voteRepeatDelay, onlyForVip, needVotes } = options;
    let voteReadyToStart = true;
    let voteStarting = false;
    let voteStartingRepeat = true;
    let secondsToEnd = voteDuration / 1000;
    let timer;
    let timerDelayStarting;
    let timerDelayNextStart;
    let historyPlayers = [];
    let votes = {
        '+': [],
        '-': [],
    };
    const chatCommand = (data) => {
        const { steamID } = data;
        const { admins } = state;
        if (state.votingActive || voteStarting) {
            adminWarn(execute, steamID, 'В данный момент голосование уже идет!');
            return;
        }
        if (!voteStartingRepeat) {
            adminWarn(execute, steamID, 'Должно пройти 15 минут после последнего использования skipmap!');
            return;
        }
        if (!voteReadyToStart) {
            adminWarn(execute, steamID, 'Голосование за завершение матча будет доступно через 1 минуту после начала матча!');
            return;
        }
        if (onlyForVip && !(admins === null || admins === void 0 ? void 0 : admins[steamID])) {
            adminWarn(execute, steamID, 'Команда доступна только Vip пользователям');
            return;
        }
        if (historyPlayers.find((i) => i === steamID)) {
            adminWarn(execute, steamID, 'Вы уже запускали голосование, для каждого игрока доступно только одно голосование за игру!');
            return;
        }
        adminBroadcast(execute, 'Голосование за пропуск текущей карты!\nИспользуйте +(За) -(Против) для голосования');
        historyPlayers.push(steamID);
        state.votingActive = true;
        voteStarting = true;
        voteStartingRepeat = false;
        timer = setInterval(() => {
            secondsToEnd = secondsToEnd - voteTick / 1000;
            const positive = votes['+'].length;
            const negative = votes['-'].length;
            const currentVotes = positive - negative <= 0 ? 0 : positive - negative;
            if (secondsToEnd <= 0) {
                if (currentVotes >= needVotes) {
                    adminBroadcast(execute, 'Голосование завершено!\nМатч завершается!');
                    adminBroadcast(execute, `За: ${positive} Против: ${negative} Набрано: ${currentVotes} из ${needVotes} голос(ов)`);
                    state.skipmap = true;
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
        reset();
        clearTimeout(timerDelayNextStart);
        historyPlayers = [];
        voteReadyToStart = false;
        voteStartingRepeat = true;
        state.skipmap = false;
        timerDelayStarting = setTimeout(() => {
            voteReadyToStart = true;
        }, 60000);
    };
    listener.on(EVENTS.CHAT_COMMAND_SKIPMAP, chatCommand);
    listener.on(EVENTS.CHAT_MESSAGE, chatMessage);
    listener.on(EVENTS.NEW_GAME, newGame);
    const reset = () => {
        clearTimeout(timerDelayStarting);
        clearInterval(timer);
        secondsToEnd = voteDuration / 1000;
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
        var _a;
        const { player, isLeader } = data;
        const { currentMap } = state;
        const admins = getAdmins(state, 'canseeadminchat');
        const isAdmin = admins === null || admins === void 0 ? void 0 : admins.includes(player.steamID);
        if ((_a = currentMap === null || currentMap === void 0 ? void 0 : currentMap.layer) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes('seed'))
            return;
        if (isAdmin)
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
                    var _b, _c;
                    let updatedPlayer = (_b = state.players) === null || _b === void 0 ? void 0 : _b.find((user) => user.steamID === player.steamID);
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
                        updatedPlayer = (_c = state.players) === null || _c === void 0 ? void 0 : _c.find((user) => user.steamID === player.steamID);
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

const voteMap = (state, options) => {
    const { listener, execute } = state;
    const { voteTick, voteDuration, onlyForVip, needVotes } = options;
    let voteReadyToStart = true;
    let voteStarting = false;
    let secondsToEnd = voteDuration / 1000;
    let timer;
    let timerDelayStarting;
    let timerDelayNextStart;
    let vote = false;
    let historyPlayers = [];
    let votes = {
        '+': [],
        '-': [],
    };
    const chatCommand = (data) => {
        const { steamID, message } = data;
        const { admins } = state;
        if (state.votingActive || voteStarting) {
            adminWarn(execute, steamID, 'В данный момент голосование уже идет!');
            return;
        }
        if (vote) {
            adminWarn(execute, steamID, 'Голосование уже прошло!');
            return;
        }
        if (!voteReadyToStart) {
            adminWarn(execute, steamID, 'Голосование будет доступно через 1 минуту после старта карты!');
            return;
        }
        if (onlyForVip && !(admins === null || admins === void 0 ? void 0 : admins[steamID])) {
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
            if (e === messageToLower) {
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
        state.votingActive = true;
        historyPlayers.push(steamID);
        timer = setInterval(() => {
            secondsToEnd = secondsToEnd - voteTick / 1000;
            const positive = votes['+'].length;
            const negative = votes['-'].length;
            const currentVotes = positive - negative <= 0 ? 0 : positive - negative;
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
        reset();
        vote = false;
        voteReadyToStart = false;
        historyPlayers = [];
        timerDelayStarting = setTimeout(() => {
            voteReadyToStart = true;
        }, 60000);
    };
    listener.on(EVENTS.CHAT_COMMAND_VOTEMAP, chatCommand);
    listener.on(EVENTS.CHAT_MESSAGE, chatMessage);
    listener.on(EVENTS.NEW_GAME, newGame);
    const reset = () => {
        clearTimeout(timerDelayNextStart);
        clearTimeout(timerDelayStarting);
        clearInterval(timer);
        secondsToEnd = voteDuration / 1000;
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
    const messageAttacker = 'Убил своего !!! Извинись в чате.';
    const messageVictim = 'Вас убил союзный игрок.';
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
    const playerWounded = ({ victimName, attackerEOSID }) => {
        if (!victimName || !attackerEOSID)
            return;
        const victim = getPlayerByName(state, victimName);
        const attacker = getPlayerByEOSID(state, attackerEOSID);
        if ((victim === null || victim === void 0 ? void 0 : victim.name) === (attacker === null || attacker === void 0 ? void 0 : attacker.name))
            return;
        if (victim && attacker && victim.teamID === attacker.teamID) {
            adminWarn(execute, victim.steamID, messageVictim + '\n' + attacker.name);
            adminWarn(execute, attacker.steamID, messageAttacker);
        }
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
    autorestartServers,
    rnsStats,
    bonuses,
    rnsLogs,
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
    if (!fs$1.existsSync(filePath)) {
        logger.error(`Maps ${mapsName} not found`);
        process.exit(1);
    }
    return new Promise((res) => {
        const data = JSON.parse(fs$1.readFileSync(filePath, 'utf-8'));
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
            var _a;
            if (event === EVENTS.PLAYER_CONNECTED || event === EVENTS.SQUAD_CREATED) {
                yield updatesOnEvents();
            }
            if (event === EVENTS.NEW_GAME) {
                yield updateAdmins(id, getAdmins);
                yield updateCurrentMap(id);
                yield updateNextMap(id);
            }
            if (event === EVENTS.PLAYER_ROLE_CHANGED ||
                event === EVENTS.PLAYER_LEADER_CHANGED) {
                yield updatePlayers(id);
            }
            if (event === EVENTS.TICK_RATE) {
                const tickRateData = data;
                state.tickRate = tickRateData.tickRate;
            }
            if (event === EVENTS.PLAYER_POSSESS) {
                const player = data;
                if (state.players && player) {
                    state.players = (_a = state.players) === null || _a === void 0 ? void 0 : _a.map((p) => {
                        if (p.steamID === player.steamID) {
                            return Object.assign(Object.assign({}, p), { possess: player.possessClassname });
                        }
                        return p;
                    });
                }
            }
            if (event === EVENTS.PLAYER_DAMAGED) {
                const player = data;
                if (state.players && player) {
                    state.players = state.players.map((p) => {
                        if (p.name === player.victimName) {
                            return Object.assign(Object.assign({}, p), { weapon: player.weapon });
                        }
                        return p;
                    });
                }
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
    if (!fs$1.existsSync(configPath)) {
        console.log(chalk.yellow(`[SquadJS]`), chalk.red('Config file required!'));
        return null;
    }
    const config = JSON.parse(fs$1.readFileSync(configPath, 'utf-8'));
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
                yield connectToDatabase(config.db);
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
