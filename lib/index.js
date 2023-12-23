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

const adminWarn = (execute, steamID, reason) => __awaiter(void 0, void 0, void 0, function* () {
    yield execute(`AdminWarn ${steamID} ${reason}`);
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
    CHAT_COMMAND_SKIPMAP: 'CHAT_COMMAND:skipmap' });
const UPDATERS_REJECT_TIMEOUT = 10000;
const UPDATE_TIMEOUT = 30000;

const skipmap = (state) => {
    const { listener, execute } = state;
    let voteStarting = false;
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
        {
            adminWarn(execute, steamID, 'Голосование за завершение матча будет доступно через 1 минуту после начала матча!');
            return;
        }
    };
    const chatMessage = (data) => {
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
};

const plugins = [skipmap];
const initPlugins = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const state = getServersState(id);
    plugins.forEach((fn) => {
        state.logger.log(`Initializing plugin: ${fn.name}`);
        const plugin = state.plugins.find((p) => p === fn.name);
        if (plugin === fn.name) {
            state.logger.log(`Initialized plugin: ${fn.name}`);
            fn(state);
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
        rconEmitter.on(event, (data) => coreEmitter.emit(event, data));
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
    return new Promise((res, rej) => {
        coreListener.once(EVENTS.SHOW_CURRENT_MAP, (data) => {
            getServersState(id).currentMap = data;
            logger.log('Updated current map');
            res(true);
        });
        setTimeout(() => rej({ id, message: 'Updating current map error' }), UPDATERS_REJECT_TIMEOUT);
    });
});

const updateNextMap = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const { execute, coreListener, logger } = getServersState(id);
    logger.log('Updating next map');
    execute(EVENTS.SHOW_NEXT_MAP);
    return new Promise((res, rej) => {
        coreListener.once(EVENTS.SHOW_NEXT_MAP, (data) => {
            getServersState(id).nextMap = data;
            logger.log('Updated next map');
            res(true);
        });
        setTimeout(() => rej({ id, message: 'Updating next map error' }), UPDATERS_REJECT_TIMEOUT);
    });
});

const updatePlayers = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const { execute, coreListener, logger } = getServersState(id);
    logger.log('Updating players');
    execute(EVENTS.LIST_PLAYERS);
    return new Promise((res, rej) => {
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
        setTimeout(() => rej({ id, message: 'Updating players' }), UPDATERS_REJECT_TIMEOUT);
    });
});

const updateSquads = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const { execute, coreListener, logger } = getServersState(id);
    logger.log('Updating squads');
    execute(EVENTS.LIST_SQUADS);
    return new Promise((res, rej) => {
        coreListener.once(EVENTS.LIST_SQUADS, (data) => {
            const state = getServersState(id);
            state.squads = [...data];
            coreListener.emit(EVENTS.UPDATED_SQUADS, state.squads);
            logger.log('Updated squads');
            res(true);
        });
        setTimeout(() => rej({ id, message: 'Updating squads error' }), UPDATERS_REJECT_TIMEOUT);
    });
});

const initState = (id, getAdmins) => __awaiter(void 0, void 0, void 0, function* () {
    yield updateAdmins(id, getAdmins);
    yield updateCurrentMap(id);
    yield updateNextMap(id);
    yield updatePlayers(id);
    yield updateSquads(id);
    const { coreListener, listener } = getServersState(id);
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
    const { rconEmitter, execute, close } = Rcon({
        id,
        host,
        port,
        password,
        autoReconnect: false,
    });
    const logsReaderConfig = ftp
        ? {
            id,
            host,
            adminsFilePath,
            autoReconnect: false,
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
            autoReconnect: false,
        };
    const logsReader = new LogsReader(logsReaderConfig);
    return Promise.all([
        new Promise((res) => rconEmitter.on('connected', () => res({ execute, rconEmitter, close }))),
        new Promise((res) => __awaiter(void 0, void 0, void 0, function* () {
            yield logsReader.init();
            res({
                logsEmitter: logsReader,
                getAdmins: logsReader.getAdminsFile.bind(logsReader),
                close: logsReader.close.bind(logsReader),
            });
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

const initial = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const configs = getConfigs();
    if (configs === null || configs === void 0 ? void 0 : configs.length) {
        for (const config of configs) {
            if (id && config.id !== id)
                continue;
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
                    const state = getServersState(err.id);
                    yield state.rcon.close();
                    yield state.logs.close();
                    initial(id);
                }
                else {
                    console.log(chalk.yellow(`[SquadJS]`), chalk.red(error));
                }
            }
        }
    }
});
initial();
