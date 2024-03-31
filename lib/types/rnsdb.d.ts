interface Main {
    _id: string;
    name: string;
    bonuses: number;
    kills: number;
    death: number;
    revives: number;
    teamkills: number;
    kd: number;
    exp: number;
    possess: object;
    roles: object;
    squad: object;
    matches: {
        matches: number;
        winrate: number;
        won: number;
        lose: number;
        history: object;
    };
    weapons: object;
    date?: number;
}
export declare function connectToDatabase(dbURL: string): Promise<void>;
export declare function createUserIfNullableOrUpdateName(steamID: string, name: string): Promise<void>;
export declare function updateUserBonuses(steamID: string, count: number): Promise<void>;
export declare function updateRoles(steamID: string, role: string): Promise<void>;
export declare function updateTimes(steamID: string, field: string, name: string): Promise<void>;
export declare function updatePossess(steamID: string, field: string): Promise<void>;
export declare function getUserDataWithSteamID(steamID: string): Promise<import("mongodb").WithId<Main> | undefined>;
export declare function updateUser(steamID: string, field: string, weapon?: string): Promise<void>;
export declare function updateGames(steamID: string, field: string): Promise<void>;
export declare function serverHistoryLayers(serverID: number, rnsHistoryLayers?: string): Promise<void>;
export declare function getHistoryLayers(serverID: number): Promise<string[]>;
export declare function cleanHistoryLayers(serverID: number, rnsHistoryLayers: string): Promise<void>;
export declare function getTimeStampForRestartServer(serverID: number): Promise<number | undefined>;
export declare function createTimeStampForRestartServer(serverID: number): Promise<void>;
export declare function updateCollectionTemp(user: {
    _id: string;
}, doc: object, name: string): Promise<void>;
export declare function creatingTimeStamp(): Promise<void>;
export {};
