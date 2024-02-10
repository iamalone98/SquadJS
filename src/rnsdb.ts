import { Collection, Db, MongoClient } from 'mongodb';

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
}

interface Info {
  _id: string;
  rnsHistoryLayers: string[];
  timeStampToRestart: number;
}

let db: Db;
const dbName = 'SquadJS';
const dbCollectionMain = 'mainstats';
const dbCollectionTemp = 'tempstats';
const dbCollectionServerInfo = 'serverinfo';
let collectionMain: Collection<Main>;
let collectionTemp: Collection<Main>;
let collectionServerInfo: Collection<Info>;

export async function connectToDatabase(dbLink: string): Promise<void> {
  const client = new MongoClient(dbLink);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    db = client.db(dbName);
    collectionMain = db.collection(dbCollectionMain);
    collectionTemp = db.collection(dbCollectionTemp);
    collectionServerInfo = db.collection(dbCollectionServerInfo);
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

export async function createUserIfNullableOrUpdateName(
  steamID: string,
  name: string,
): Promise<void> {
  if (!db) {
    throw new Error('Database is not connected');
  }
  try {
    const resultMain = await collectionMain.findOne({
      _id: steamID,
    });

    const resultTemp = await collectionTemp.findOne({
      _id: steamID,
    });

    const fields = {
      _id: steamID,
      name,
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
      await collectionMain.insertOne(fields);
    }

    if (!resultTemp) {
      await collectionTemp.insertOne(fields);
    }

    if (resultMain) {
      if (name !== resultMain.name) {
        await updateUserName(steamID, name);
      }
    }
  } catch (err) {
    throw err;
  }
}

async function updateUserName(steamID: string, name: string) {
  try {
    const doc = {
      $set: {
        name,
      },
    };

    const user = {
      _id: steamID,
    };

    await collectionMain.updateOne(user, doc);
    await collectionTemp.updateOne(user, doc);
  } catch (err) {
    throw err;
  }
}

export async function updateUserBonuses(steamID: string, count: number) {
  try {
    const doc = {
      $inc: {
        bonuses: count,
      },
    };

    const user = {
      _id: steamID,
    };

    await collectionMain.updateOne(user, doc);
  } catch (err) {
    throw err;
  }
}

export async function updateRoles(steamID: string, role: string) {
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

  await collectionMain.updateOne(user, doc);
}

export async function updateTimes(steamID: string, field: string) {
  const squadFilter = `squad.${field}`;
  const doc = {
    $inc: {
      [squadFilter]: 1,
    },
  };

  const user = {
    _id: steamID,
  };

  await collectionMain.updateOne(user, doc);
}

export async function updatePossess(steamID: string, field: string) {
  if (field.toLowerCase().includes('soldier')) return;
  const possessFilter = `possess.${field}`;
  const doc = {
    $inc: {
      [possessFilter]: 1,
    },
  };

  const user = {
    _id: steamID,
  };

  await collectionMain.updateOne(user, doc);
}

export async function getUserDataWithSteamID(steamID: string) {
  const result = await collectionMain.findOne({
    _id: steamID,
  });

  if (!result) return;

  return result;
}

export async function updateUser(
  steamID: string,
  field: string,
  weapon?: string,
) {
  if (!steamID || !field) return;
  const doc = {
    $inc: {
      [field]: 1,
    },
  };

  const user = {
    _id: steamID,
  };

  await collectionMain.updateOne(user, doc);
  await collectionTemp.updateOne(user, doc);

  if (field === 'kills' && weapon !== '') {
    const weaponFilter = `weapons.${weapon}`;
    const doc = {
      $inc: {
        [weaponFilter]: 1,
      },
    };

    const user = {
      _id: steamID,
    };
    await collectionMain.updateOne(user, doc);
    await collectionTemp.updateOne(user, doc);
  }

  if (field === 'kills' || field === 'death') {
    const resultMain = await collectionMain.findOne({
      _id: steamID,
    });

    const resultTemp = await collectionTemp.findOne({
      _id: steamID,
    });

    if (resultMain) {
      let kd;
      if (resultMain.death && isFinite(resultMain.kills / resultMain.death)) {
        kd = Number((resultMain.kills / resultMain.death).toFixed(2));
      } else {
        kd = resultMain.kills;
      }

      const doc = {
        $set: {
          kd: kd,
        },
      };
      await collectionMain.updateOne(user, doc);
    }

    if (resultTemp) {
      let kd;
      if (resultTemp.death && isFinite(resultTemp.kills / resultTemp.death)) {
        kd = Number((resultTemp.kills / resultTemp.death).toFixed(2));
      } else {
        kd = resultTemp.kills;
      }

      const doc = {
        $set: {
          kd: kd,
        },
      };
      await collectionTemp.updateOne(user, doc);
    }
  }
}

export async function updateGames(steamID: string, field: string) {
  const matchesFilter = `matches.${field}`;
  const doc = {
    $inc: {
      [matchesFilter]: 1,
    },
  };

  const user = {
    _id: steamID,
  };

  await collectionMain.updateOne(user, doc);
  await collectionTemp.updateOne(user, doc);

  if (field === 'won' || field === 'lose') {
    const resultMain = await collectionMain.findOne({
      _id: steamID,
    });

    const matchesMain =
      (resultMain?.matches.won || 0) + (resultMain?.matches.lose || 0);

    if (resultMain) {
      const doc = {
        $set: {
          'matches.matches': matchesMain,
          'matches.winrate': Number(
            ((resultMain.matches.won / matchesMain) * 100).toFixed(3),
          ),
        },
      };
      await collectionMain.updateOne(user, doc);
    }
  }
}

export async function serverHistoryLayers(
  serverID: number,
  rnsHistoryLayers?: string,
) {
  if (!rnsHistoryLayers) return;
  const server = await collectionServerInfo.findOne({
    _id: serverID.toString(),
  });
  if (!server) return;

  const data = {
    $push: {
      rnsHistoryLayers,
    },
  };
  await collectionServerInfo.updateOne(server, data);
}

export async function getHistoryLayers(serverID: number) {
  const result = await collectionServerInfo.findOne({
    _id: serverID.toString(),
  });
  return result?.rnsHistoryLayers || [];
}

export async function cleanHistoryLayers(
  serverID: number,
  rnsHistoryLayers: string,
) {
  const result = await collectionServerInfo.findOne({
    _id: serverID.toString(),
  });
  if (!result) return;
  const data = {
    $set: { rnsHistoryLayers: [rnsHistoryLayers] },
  };

  await collectionServerInfo.updateOne(result, data);
}

export async function getTimeStampForRestartServer(serverID: number) {
  const server = await collectionServerInfo.findOne({
    _id: serverID.toString(),
  });

  return server?.timeStampToRestart;
}

export async function createTimeStampForRestartServer(serverID: number) {
  const date: number = new Date().getTime();

  const id = {
    _id: serverID.toString(),
  };

  const data = {
    $set: {
      timeStampToRestart: date,
    },
  };

  await collectionServerInfo.updateOne(id, data);
}
