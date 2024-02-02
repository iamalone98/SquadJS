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
  matches: object;
  weapons: object;
}

let db: Db;
const dbName = 'SquadJS';
const dbCollectionMain = 'mainstats';
const dbCollectionTemp = 'tempstats';
let collectionMain: Collection<Main>;
let collectionTemp: Collection<Main>;

export async function connectToDatabase(dbLink: string): Promise<void> {
  const client = new MongoClient(dbLink);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    db = client.db(dbName);
    collectionMain = db.collection(dbCollectionMain);
    collectionTemp = db.collection(dbCollectionTemp);
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    throw err;
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
    await collectionTemp.updateOne(user, doc);
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
