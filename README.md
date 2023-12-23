## **SquadJS**

This is a slightly improved version of SquadJS

Main differences:
`Initializing multiple servers`
`Supports built-in maps and mods`
`Typescript`

#### Prerequisites

- [Node.js](https://nodejs.org/en/) (18.18.2 max) - [Download](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/) (Version 1.22.0+) - [Download](https://classic.yarnpkg.com/en/docs/install)

### Configuring SquadJS

SquadJS can be configured using a JSON configuration file
Take a look at [config.example.json](./config.example.json)
Create a `config.json` file in the main folder.

**NOTE - ftp works using the SFTP protocol**

#### Local Configuration

```json
{
  "1": {
    "host": "127.0.0.1",
    "password": "password",
    "port": 21110,
    "logFilePath": "/SquadGame/Saved/Logs/SquadGame.log",
    "adminsFilePath": "/SquadGame/ServerConfig/Admins.cfg",
    "mapsName": "vanilla.json",
    "mapsRegExp": "(?<layerName>[a-zA-Z]+)_(?<layerMode>.*)",
    "plugins": ["skipmap"]
  }
}
```

#### Remote Configuration

```json
{
  "1": {
    "host": "127.0.0.1",
    "password": "pass",
    "port": 21110,
    "logFilePath": "/SquadGame/Saved/Logs/SquadGame.log",
    "adminsFilePath": "/SquadGame/ServerConfig/Admins.cfg",
    "mapsName": "mee.json",
    "mapsRegExp": "([a-zA-Z]+)_(?<layerName>[a-zA-Z]+)_(?<layerMode>.*)",
    "plugins": ["skipmap"],
    "ftp": {
      "username": "root",
      "password": "pass"
    }
  }
}
```

- `1` - an string ID to uniquely identify the server.
- `host` - the IP of the server.
- `port` - the RCON port of the server.
- `password` - the RCON password of the server.
- `logFilePath` - squad logs path.
- `adminsFilePath` - admins file path.
- `mapsName` - file name for use maps.
- `mapsRegExp` - regexp for parse maps.
- `plugins` - list of plugins that are included.
