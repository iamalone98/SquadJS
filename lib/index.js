import chalk from 'chalk';
import { Client, GatewayIntentBits } from 'discord.js';
import { LogsReaderEvents, LogsReader } from 'squad-logs';
import { RconEvents, Rcon } from 'squad-rcon';
import EventEmitter from 'events';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';
import url from 'url';

const adminWarn = async (execute, steamID, reason) => {
    await execute(`AdminWarn ${steamID} ${reason}`);
};

const discord = (state, options) => {
    const { logger } = state;
    return new Promise((res, rej) => {
        if (!options?.token) {
            rej('[Discord] Token is missing in options.');
        }
        const { token } = options;
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });
        client.once('ready', () => {
            logger.log(`[Discord] Logged in as ${client.user?.tag}`);
            res(true);
            state.discord = {
                sendMessage(channelId, text) {
                    const channel = client.channels.cache.get(channelId);
                    if (!channel) {
                        logger.error(`[Discord] Failed to send message: Channel not found.`);
                        return;
                    }
                    if (channel.isSendable()) {
                        channel
                            .send(text)
                            .then(() => logger.log(`[Discord] Message sent to channel ${channelId}.`))
                            .catch((err) => logger.error(`[Discord] Failed to send message: ${err.message}`));
                    }
                    else {
                        logger.error(`[Discord] Channel ${channelId} is not text-based.`);
                    }
                },
            };
        });
        client.on('error', (error) => {
            logger.error(`[Discord] Error: ${error.message}`);
        });
        client.login(token).catch((error) => {
            rej(`[Discord] Failed to login: ${error.message}`);
        });
    });
};

const EVENTS = {
    ...RconEvents,
    ...LogsReaderEvents,
    UPDATED_ADMINS: 'UPDATED_ADMINS',
    UPDATED_PLAYERS: 'UPDATED_PLAYERS',
    UPDATED_SQUADS: 'UPDATED_SQUADS',
    PLAYER_TEAM_CHANGED: 'PLAYER_TEAM_CHANGED',
    PLAYER_SQUAD_CHANGED: 'PLAYER_SQUAD_CHANGED',
    PLAYER_ROLE_CHANGED: 'PLAYER_ROLE_CHANGED',
    PLAYER_LEADER_CHANGED: 'PLAYER_LEADER_CHANGED',
    // CHAT COMMANDS
    CHAT_COMMAND_SKIPMAP: 'CHAT_COMMAND:skipmap',
};
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

const plugins = [discord, skipmap];
const initPlugins = async (id) => {
    const state = getServersState(id);
    for (const fn of plugins) {
        state.logger.log(`Initializing plugin: ${fn.name}`);
        const plugin = state.plugins.find((p) => p.name === fn.name);
        if (plugin && plugin.enabled) {
            await fn(state, plugin.options);
            state.logger.log(`Initialized plugin: ${fn.name}`);
        }
        else {
            state.logger.warn(`Disabled plugin: ${fn.name}`);
        }
    }
    return new Promise((res) => res(true));
};

const convertObjToArrayEvents = (events) => Object.keys(events).map((event) => events[event]);
const chatCommandParser = (listener) => {
    listener.on(EVENTS.CHAT_MESSAGE, (data) => {
        const command = data.message.match(/!([^ ]+) ?(.*)/);
        if (command)
            listener.emit(`CHAT_COMMAND:${command[1].toLowerCase()}`, {
                ...data,
                message: command[2].trim(),
            });
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
const getConfigs = () => {
    const configPath = path.resolve(__dirname$1, '../config.json');
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
        return {
            id: parseInt(key, 10),
            ...config[key],
        };
    });
};
const getCurrentTime = () => format(new Date(), 'd LLL HH:mm:ss');

const initLogger = (id) => ({
    log: (...text) => {
        console.log(chalk.yellow(`[SquadJS][${id}][${getCurrentTime()}]`), chalk.green(text));
    },
    warn: (...text) => {
        console.log(chalk.yellow(`[SquadJS][${id}][${getCurrentTime()}]`), chalk.magenta(text));
    },
    error: (...text) => {
        console.log(chalk.yellow(`[SquadJS][${id}][${getCurrentTime()}]`), chalk.red(text));
    },
});

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const initMaps = async (mapsName, mapsRegExp, logger) => {
    logger.log('Loading maps');
    const filePath = path.resolve(__dirname, mapsName);
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
            const groups = matches?.groups;
            if (!groups || !groups?.layerName || !groups?.layerMode) {
                logger.error(`RegExp parse ${map} error`);
                process.exit(1);
            }
            const { layerName, layerMode } = groups;
            maps[map] = { layerName, layerMode };
        });
        logger.log('Loaded maps');
        res(maps);
    });
};

const initRcon = async (config) => new Promise(async (res, rej) => {
    const { id, host, port, password } = config;
    try {
        const rcon = new Rcon({
            id,
            host,
            port,
            password,
        });
        await rcon.init();
        res({
            rconEmitter: rcon,
            close: rcon.close.bind(rcon),
            execute: rcon.execute.bind(rcon),
        });
    }
    catch (error) {
        rej(`RCON error: ${error}`);
    }
});
const initLogs = async (config) => new Promise(async (res, rej) => {
    try {
        const { id, host, ftp, logFilePath, adminsFilePath } = config;
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
        await logsReader.init();
        res({
            logsEmitter: logsReader,
            getAdmins: logsReader.getAdminsFile.bind(logsReader),
            close: logsReader.close.bind(logsReader),
        });
    }
    catch (error) {
        rej(`LOGS error: ${error}`);
    }
});
const initParsers = async (config) => {
    const rcon = await initRcon(config);
    const logs = await initLogs(config);
    return [rcon, logs];
};

const serversState = {};
const getServersState = (id) => serversState[id];

const updateAdmins = async (id, getAdmins) => {
    const { coreListener, logger } = getServersState(id);
    logger.log('Updating admins');
    const admins = await getAdmins();
    const state = getServersState(id);
    state.admins = admins;
    coreListener.emit(EVENTS.UPDATED_ADMINS, state.admins);
    logger.log('Updated admins');
};

const updateCurrentMap = async (id) => {
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
};

const updateNextMap = async (id) => {
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
};

const updatePlayers = async (id) => {
    const { execute, coreListener, logger } = getServersState(id);
    logger.log('Updating players');
    execute(EVENTS.LIST_PLAYERS);
    return new Promise((res) => {
        coreListener.once(EVENTS.LIST_PLAYERS, (data) => {
            const state = getServersState(id);
            state.players = data.map((player) => {
                const playerFound = state.players?.find((p) => p.steamID === player.steamID);
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
                    return {
                        ...playerFound,
                        ...player,
                    };
                }
                return player;
            });
            coreListener.emit(EVENTS.UPDATED_PLAYERS, state.players);
            logger.log('Updated players');
            res(true);
        });
        setTimeout(() => res(true), UPDATERS_REJECT_TIMEOUT);
    });
};

const updateServerInfo = async (id) => {
    const { execute, coreListener, logger } = getServersState(id);
    logger.log('Updating server info');
    execute(EVENTS.SHOW_SERVER_INFO);
    return new Promise((res) => {
        coreListener.once(EVENTS.SHOW_SERVER_INFO, (data) => {
            getServersState(id).serverInfo = data;
            logger.log('Updated server info');
            res(true);
        });
        setTimeout(() => res(true), UPDATERS_REJECT_TIMEOUT);
    });
};

const updateSquads = async (id) => {
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
};

const initUpdaters = async (id, getAdmins) => {
    await updateAdmins(id, getAdmins);
    await updateCurrentMap(id);
    await updateNextMap(id);
    await updatePlayers(id);
    await updateSquads(id);
    await updateServerInfo(id);
    const state = getServersState(id);
    const { coreListener, listener } = state;
    let updateTimeout;
    let canRunUpdateInterval = true;
    setInterval(async () => {
        if (!canRunUpdateInterval)
            return;
        await updatePlayers(id);
        await updateSquads(id);
        await updateServerInfo(id);
    }, UPDATE_TIMEOUT);
    const updatesOnEvents = async () => {
        canRunUpdateInterval = false;
        clearTimeout(updateTimeout);
        await updatePlayers(id);
        await updateSquads(id);
        await updateServerInfo(id);
        updateTimeout = setTimeout(() => (canRunUpdateInterval = true), UPDATE_TIMEOUT);
    };
    for (const key in EVENTS) {
        const event = EVENTS[key];
        coreListener.on(event, async (data) => {
            if (event === EVENTS.PLAYER_CONNECTED) {
                const player = data;
                const players = state.players;
                state.players = players
                    ? players.map((p) => p.steamID === player.steamID ? { ...p, ip: player.ip } : p)
                    : [];
            }
            if (event === EVENTS.PLAYER_CONNECTED || event === EVENTS.SQUAD_CREATED) {
                await updatesOnEvents();
            }
            if (event === EVENTS.NEW_GAME) {
                await updateAdmins(id, getAdmins);
                await updateCurrentMap(id);
                await updateNextMap(id);
            }
            if (event === EVENTS.TICK_RATE) {
                const tickRateData = data;
                state.tickRate = tickRateData.tickRate;
            }
            listener.emit(event, data);
        });
    }
};

const initSquadJS = async (config) => {
    const { id, mapsName, mapsRegExp, plugins } = config;
    const logger = initLogger(id);
    const [rcon, logs] = await initParsers(config);
    const { rconEmitter, execute } = rcon;
    const { logsEmitter, getAdmins } = logs;
    const { localEmitter, coreEmitter } = initEvents({
        rconEmitter,
        logsEmitter,
    });
    const maps = await initMaps(mapsName, mapsRegExp, logger);
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
    await initUpdaters(id, getAdmins);
    await initPlugins(id);
};

(async () => {
    const configs = getConfigs();
    if (configs?.length) {
        for (const config of configs) {
            try {
                await initSquadJS(config);
            }
            catch (error) {
                const err = error;
                if (err?.id && err?.message) {
                    console.log(chalk.yellow(`[SquadJS][${err.id}][${getCurrentTime()}]`), chalk.red(err.message));
                }
                else {
                    console.log(chalk.yellow(`[SquadJS][${getCurrentTime()}]`), chalk.red(error));
                }
            }
        }
    }
})();
